import { NextRequest } from "next/server";
import { verifySession } from "../../../../lib/auth";
import { collection } from "../../../../lib/db";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  
  const session = verifySession(token);
  if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  
  const { walletAddress, chainId, walletType } = await req.json();
  if (!walletAddress) return new Response(JSON.stringify({ error: "Missing walletAddress" }), { status: 400 });
  
  const col = await collection("walletConnections");
  const now = new Date().toISOString();
  
  // Upsert wallet connection
  await col.updateOne(
    { adminId: session.adminId, walletAddress: walletAddress.toLowerCase() },
    {
      $set: {
        chainId: chainId || null,
        walletType: walletType || "privy",
        lastActiveAt: now,
        // New flags for approval flow
        pending: true, // default pending until super admin approves on-chain
        authorizedOnChain: false
      },
      $setOnInsert: {
        connectedAt: now
      }
    },
    { upsert: true }
  );
  
  // Also update admin record with wallet address
  const allowCol = await collection("adminAllowlist");
  await allowCol.updateOne(
    { email: session.adminId.toLowerCase() },
    { $set: { walletAddress: walletAddress.toLowerCase(), updatedAt: now } }
  );
  
  return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json" } });
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  
  const session = verifySession(token);
  if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  
  const col = await collection("walletConnections");
  const connections = await col.find({ adminId: session.adminId }).sort({ lastActiveAt: -1 }).toArray();
  
  return new Response(JSON.stringify(connections.map((c: any) => ({
    _id: String(c._id),
    walletAddress: c.walletAddress,
    chainId: c.chainId,
    walletType: c.walletType,
    connectedAt: c.connectedAt,
    lastActiveAt: c.lastActiveAt,
    pending: !!c.pending,
    authorizedOnChain: !!c.authorizedOnChain
  }))), { headers: { "content-type": "application/json" } });
}

