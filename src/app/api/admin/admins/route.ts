import { NextRequest } from "next/server";
import { verifySession } from "../../../../lib/auth";
import { collection } from "../../../../lib/db";
import { hashPassword } from "../../../../lib/auth";
import { ObjectId } from "mongodb";

// GET: list admins (super admin only)
export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  
  const session = verifySession(token);
  if (!session || !session.isSuperAdmin) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  }
  
  const col = await collection("admins");
  const admins = await col.find({}).sort({ createdAt: -1 }).toArray();
  return new Response(JSON.stringify(admins.map(a => ({ 
    _id: String(a._id), 
    adminId: a.adminId, 
    university: a.university || "",
    walletAddress: a.walletAddress,
    isSuperAdmin: a.isSuperAdmin,
    createdBy: a.createdBy,
    createdAt: a.createdAt 
  }))), { headers: { "content-type": "application/json" } });
}

// POST: create admin (super admin only) - NO WALLET FIELD
export async function POST(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  
  const session = verifySession(token);
  if (!session || !session.isSuperAdmin) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  }
  
  const { adminId, password, university } = await req.json();
  if (!adminId || !password) {
    return new Response(JSON.stringify({ error: "Missing adminId or password" }), { status: 400 });
  }
  
  const col = await collection("admins");
  const existing = await col.findOne({ adminId: adminId.toLowerCase() });
  if (existing) {
    return new Response(JSON.stringify({ error: "Admin already exists" }), { status: 400 });
  }
  
  const passwordHash = await hashPassword(password);
  const now = new Date().toISOString();
  const doc = {
    adminId: adminId.toLowerCase(),
    passwordHash,
    walletAddress: "", // Empty initially, will be set when wallet is connected
    university: university || "", // University name
    isSuperAdmin: false,
    createdBy: session.adminId,
    createdAt: now,
    updatedAt: now
  };
  
  const res = await col.insertOne(doc as any);
  return new Response(JSON.stringify({ _id: String(res.insertedId), ...doc, passwordHash: undefined }), {
    headers: { "content-type": "application/json" }
  });
}

// DELETE: remove admin (super admin only)
export async function DELETE(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  
  const session = verifySession(token);
  if (!session || !session.isSuperAdmin) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  }
  
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return new Response(JSON.stringify({ error: "Missing id" }), { status: 400 });
  
  const col = await collection("admins");
  const admin = await col.findOne({ _id: new ObjectId(id) });
  if (!admin) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  if (admin.isSuperAdmin) return new Response(JSON.stringify({ error: "Cannot delete super admin" }), { status: 400 });
  
  await col.deleteOne({ _id: new ObjectId(id) });
  return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json" } });
}

