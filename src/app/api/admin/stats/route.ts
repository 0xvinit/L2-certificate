import { NextRequest } from "next/server";
import { collection } from "../../../../lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const admin = (searchParams.get("admin") || "").toLowerCase();
  if (!admin) return new Response(JSON.stringify({ error: "Missing admin" }), { status: 400 });
  const col = await collection("certificates");
  const total = await col.countDocuments({ adminAddress: admin });
  const revoked = await col.countDocuments({ adminAddress: admin, revoked: true });
  const recent = await col.find({ adminAddress: admin }).sort({ createdAt: -1 }).limit(10).toArray();
  return new Response(JSON.stringify({ total, revoked, recent }), { headers: { "content-type": "application/json" } });
}


