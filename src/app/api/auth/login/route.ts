import { NextRequest, NextResponse } from "next/server";
import { signSession, verifyPassword } from "../../../../lib/auth";
import { collection } from "../../../../lib/db";

export async function POST(req: NextRequest) {
  const { adminId, password } = await req.json();
  if (!adminId || !password) return new Response(JSON.stringify({ error: "Missing" }), { status: 400 });
  
  const col = await collection("admins");
  const admin = await col.findOne({ adminId: adminId.toLowerCase() });
  if (!admin) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  
  const ok = await verifyPassword(password, admin.passwordHash);
  
  if (!ok) {
    return new Response(JSON.stringify({ error: "Invalid password" }), { status: 401 });
  }
  
  const token = signSession({ adminId: admin.adminId, isSuperAdmin: admin.isSuperAdmin });
  
  // Return JSON response with cookie set - client will verify and redirect
  const response = NextResponse.json({ 
    ok: true, 
    isSuperAdmin: admin.isSuperAdmin 
  });
  
  response.cookies.set("token", token, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    secure: process.env.NODE_ENV === "production"
  });
  
  return response;
}


