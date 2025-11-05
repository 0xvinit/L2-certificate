import { NextRequest, NextResponse } from "next/server";
import { PrivyClient } from "@privy-io/server-auth";
import { collection } from "../../../../lib/db";
import { SignJWT } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

// Create a signed app session cookie with role=admin
async function signAppSession(payload: any) {
  const secret = new TextEncoder().encode(JWT_SECRET);
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret);
  return token;
}

export async function POST(req: NextRequest) {
  try {
    // Require identity token from client (more reliable than access token)
    const idHeader = req.headers.get("privy-id-token");
    const incomingToken = (idHeader || "").trim();
    console.log("[privy] id token present:", !!incomingToken, incomingToken ? `len=${incomingToken.length}` : "");
    if (!incomingToken) {
      return NextResponse.json({ error: "Missing identity token (privy-id-token header)" }, { status: 401 });
    }

    const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID as string ;
    const appSecret = process.env.PRIVY_APP_SECRET as string;
    if (!appId || !appSecret) {
      return NextResponse.json({ error: "Privy not configured: set NEXT_PUBLIC_PRIVY_APP_ID and PRIVY_APP_SECRET" }, { status: 500 });
    }

    const privy = new PrivyClient(appId, appSecret);

    // 1) Verify identity token → get userId (method name can differ by SDK version)
    let verified: any = null;
    try {
      if (typeof (privy as any).verifyAuthToken === "function") {
        verified = await (privy as any).verifyAuthToken(incomingToken);
      } else if (typeof (privy as any).verifyIdToken === "function") {
        verified = await (privy as any).verifyIdToken(incomingToken);
      }
    } catch (e: any) {
      console.log("[privy] verify token error:", e?.message || e);
      return NextResponse.json({ error: "Invalid or expired Privy token" }, { status: 401 });
    }

    if (!verified) {
      return NextResponse.json({ error: "Invalid or expired Privy token" }, { status: 401 });
    }

    const verifiedUserId = (verified.userId || verified.sub || verified.user_id || "").toString();
    if (!verifiedUserId) {
      console.log("[privy] verify result missing userId:", verified);
      return NextResponse.json({ error: "Invalid Privy identity token" }, { status: 401 });
    }

    // 2) Fetch user by id
    let user: any;
    try {
      user = await (privy as any).getUser(verifiedUserId);
    } catch (e: any) {
      console.log("[privy] getUser by id error:", e?.message || e);
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    // Robust email extraction (supports different session shapes)
    // Try multiple shapes to extract email
    let primaryEmail = "";
    const emailAddresses: any[] = Array.isArray(user?.email?.addresses) ? user.email.addresses : [];
    const verifiedEmails = emailAddresses.filter((e: any) => e?.verification_status === "verified");
    if (verifiedEmails[0]?.address) primaryEmail = String(verifiedEmails[0].address).toLowerCase();
    else if (user?.email?.address) primaryEmail = String(user.email.address).toLowerCase();
    else if (Array.isArray((user as any)?.linked_accounts)) {
      const g = (user as any).linked_accounts.find((x: any) => x?.type?.includes("google") && x?.email);
      if (g?.email) primaryEmail = String(g.email).toLowerCase();
    } else if ((user as any)?.google?.email) {
      primaryEmail = String((user as any).google.email).toLowerCase();
    } else if ((user as any)?.oauth?.email) {
      primaryEmail = String((user as any).oauth.email).toLowerCase();
    } else if (Array.isArray((user as any)?.identities)) {
      const anyEmail = (user as any).identities.find((x: any) => x?.email);
      if (anyEmail?.email) primaryEmail = String(anyEmail.email).toLowerCase();
    }
    console.log("[privy] user keys:", Object.keys(user || {}));
    console.log("[privy] primaryEmail:", primaryEmail);

    if (!primaryEmail) {
      return NextResponse.json({ error: "Email not available from identity token" }, { status: 401 });
    }

    // Check allowlist collection for active admin email
    const allowCol = await collection("adminAllowlist");
    const allowed = await allowCol.findOne({ email: primaryEmail, status: { $in: ["active", "pending"] } }) as any;
    console.log("[privy] allowlist match:", !!allowed, allowed ? { email: allowed.email, isSuperAdmin: !!allowed.isSuperAdmin, status: allowed.status } : null);

    if (!allowed) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Create app session cookie (role-based)
    const token = await signAppSession({ adminId: primaryEmail, role: "admin", isSuperAdmin: !!allowed.isSuperAdmin });

    const res = NextResponse.json({ ok: true, role: "admin" });
    res.cookies.set("token", token, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      secure: process.env.NODE_ENV === "production",
    });
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: "Auth failed" }, { status: 500 });
  }
}


