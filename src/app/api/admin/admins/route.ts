import { NextRequest } from "next/server";
import { verifySession } from "../../../../lib/auth";
import { collection } from "../../../../lib/db";

// GET: list admins from allowlist (super admin only)
export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  
  const session = verifySession(token);
  if (!session || !session.isSuperAdmin) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  }
  
  const col = await collection("adminAllowlist");
  const admins = await col.find({}).sort({ createdAt: -1 }).toArray();
  return new Response(JSON.stringify(admins.map((a: any) => ({ 
    _id: String(a._id), 
    email: a.email, 
    status: a.status || "active",
    isSuperAdmin: !!a.isSuperAdmin,
    createdBy: a.createdBy,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt
  }))), { headers: { "content-type": "application/json" } });
}

// POST: add admin email to allowlist (super admin only)
export async function POST(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  
  const session = verifySession(token);
  if (!session || !session.isSuperAdmin) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  }
  
  const { email, status, isSuperAdmin } = await req.json();
  if (!email) {
    return new Response(JSON.stringify({ error: "Missing email" }), { status: 400 });
  }
  
  const col = await collection("adminAllowlist");
  const existing = await col.findOne({ email: String(email).toLowerCase() });
  if (existing) {
    return new Response(JSON.stringify({ error: "Email already in allowlist" }), { status: 400 });
  }
  
  const now = new Date().toISOString();
  const doc = {
    email: String(email).toLowerCase(),
    status: status || "active",
    isSuperAdmin: !!isSuperAdmin,
    createdBy: session.adminId,
    createdAt: now,
    updatedAt: now
  };
  
  const res = await col.insertOne(doc as any);
  return new Response(JSON.stringify({ _id: String(res.insertedId), ...doc }), {
    headers: { "content-type": "application/json" }
  });
}

// DELETE: remove admin from allowlist (super admin only)
export async function DELETE(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  
  const session = verifySession(token);
  if (!session || !session.isSuperAdmin) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  }
  
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  if (!email) return new Response(JSON.stringify({ error: "Missing email" }), { status: 400 });
  
  const col = await collection("adminAllowlist");
  const admin = await col.findOne({ email: String(email).toLowerCase() }) as any;
  if (!admin) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  if (admin.isSuperAdmin) return new Response(JSON.stringify({ error: "Cannot delete super admin" }), { status: 400 });
  
  await col.deleteOne({ email: String(email).toLowerCase() });
  return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json" } });
}

