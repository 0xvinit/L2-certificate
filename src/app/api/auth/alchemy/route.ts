import { NextRequest, NextResponse } from "next/server";
import { collection } from "../../../../lib/db";
import { signSession } from "../../../../lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body?.email || "").toLowerCase();
    if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

    const allowCol = await collection("adminAllowlist");
    const me = (await allowCol.findOne({ email, status: { $in: ["active", "pending"] } })) as any;
    if (!me) return NextResponse.json({ error: "Not in allowlist" }, { status: 403 });

    const token = signSession({ adminId: email, isSuperAdmin: !!me.isSuperAdmin });
    const res = NextResponse.json({ ok: true, role: me.isSuperAdmin ? "super" : "admin" });
    res.cookies.set("token", token, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      secure: process.env.NODE_ENV === "production",
    });
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Auth failed" }, { status: 500 });
  }
}


