import { NextRequest } from "next/server";
import { collection } from "../../../../lib/db";
import { hashPassword } from "../../../../lib/auth";

// Initialize first super admin (only if no super admin exists)
export async function POST(req: NextRequest) {
  const { adminId, password } = await req.json();
  if (!adminId || !password) {
    return new Response(JSON.stringify({ error: "Missing adminId or password" }), { status: 400 });
  }
  
  const col = await collection("admins");
  const existing = await col.findOne({ isSuperAdmin: true });
  if (existing) {
    return new Response(JSON.stringify({ error: "Super admin already exists" }), { status: 400 });
  }
  
  const passwordHash = await hashPassword(password);
  const now = new Date().toISOString();
  const doc = {
    adminId: adminId.toLowerCase(),
    passwordHash,
    walletAddress: "",
    isSuperAdmin: true,
    createdBy: "system",
    createdAt: now,
    updatedAt: now
  };
  
  const res = await col.insertOne(doc as any);
  return new Response(JSON.stringify({ _id: String(res.insertedId), adminId: doc.adminId, isSuperAdmin: true }), {
    headers: { "content-type": "application/json" }
  });
}

