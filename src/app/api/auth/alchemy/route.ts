import { NextRequest, NextResponse } from "next/server";
import { collection } from "../../../../lib/db";
import { signSession } from "../../../../lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body?.email || "").toLowerCase();
    const walletAddress = String(body?.walletAddress || "").toLowerCase();
    if (!email && !walletAddress) return NextResponse.json({ error: "Missing email or walletAddress" }, { status: 400 });

    const allowCol = await collection("adminAllowlist");
    let me = null as any;

    if (email) {
      me = (await allowCol.findOne({ email, status: { $in: ["active", "pending"] } })) as any;
    }

    // Fallback: find admin by wallet address if email missing/not allowlisted yet
    if (!me && walletAddress) {
      const walletCol = await collection("walletConnections");
      const linked = (await walletCol.findOne({ walletAddress })) as any;
      if (linked && linked.adminId) {
        me = (await allowCol.findOne({ email: String(linked.adminId).toLowerCase(), status: { $in: ["active", "pending"] } })) as any;
      }
    }

    if (!me) return NextResponse.json({ error: "Not in allowlist" }, { status: 403 });

    const adminId = me.email as string;
    const token = signSession({ adminId, isSuperAdmin: !!me.isSuperAdmin });
    console.log("Alchemy Auth - Token created for:", adminId);
    
    const res = NextResponse.json({ ok: true, role: me.isSuperAdmin ? "super" : "admin" });
    
    // Set cookie with explicit settings to ensure it persists
    res.cookies.set("token", token, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      secure: process.env.NODE_ENV === "production",
      // Don't set domain - let browser use default
    });
    
    console.log("Alchemy Auth - Cookie set for:", adminId);
    console.log("Alchemy Auth - Cookie settings:", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      secure: process.env.NODE_ENV === "production",
    });
    
    return res;
  } catch (e: any) {
    console.error("Alchemy Auth - Error:", e?.message || e);
    return NextResponse.json({ error: e?.message || "Auth failed" }, { status: 500 });
  }
}


