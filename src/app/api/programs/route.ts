import { NextRequest } from "next/server";
import { collection } from "../../../lib/db";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const admin = (searchParams.get("admin") || "").toLowerCase();
  if (!admin) return new Response(JSON.stringify({ error: "Missing admin" }), { status: 400 });
  const col = await collection("programs");
  const items = await col.find({ adminAddress: admin }).sort({ createdAt: -1 }).toArray();
  return new Response(JSON.stringify(items), { headers: { "content-type": "application/json" } });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { adminAddress, adminId, name, code, startDate, endDate } = body;
  if (!adminAddress || !adminId || !name || !code) return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });
  const col = await collection("programs");
  const now = new Date().toISOString();
  const doc = { 
    adminAddress: adminAddress.toLowerCase(), 
    adminId: adminId.toLowerCase(),
    name, 
    code, 
    startDate, 
    endDate, 
    isActive: true, 
    createdAt: now, 
    updatedAt: now 
  };
  const res = await col.insertOne(doc as any);
  return new Response(JSON.stringify({ _id: String(res.insertedId), ...doc }), { headers: { "content-type": "application/json" } });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, name, code, startDate, endDate, isActive } = body;
  if (!id) return new Response(JSON.stringify({ error: "Missing id" }), { status: 400 });
  
  const col = await collection("programs");
  const now = new Date().toISOString();
  
  // Build update object with only provided fields
  const updateFields: any = { updatedAt: now };
  
  if (name !== undefined) updateFields.name = name;
  if (code !== undefined) updateFields.code = code;
  if (startDate !== undefined) updateFields.startDate = startDate;
  if (endDate !== undefined) updateFields.endDate = endDate;
  if (isActive !== undefined) updateFields.isActive = isActive;
  
  await col.updateOne({ _id: new ObjectId(id) }, { $set: updateFields });
  const updated = await col.findOne({ _id: new ObjectId(id) });
  return new Response(JSON.stringify(updated), { headers: { "content-type": "application/json" } });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return new Response(JSON.stringify({ error: "Missing id" }), { status: 400 });
  const col = await collection("programs");
  await col.deleteOne({ _id: new ObjectId(id) });
  return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json" } });
}


