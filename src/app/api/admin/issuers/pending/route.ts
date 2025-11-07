import { NextRequest } from "next/server";
import { verifySession } from "../../../../../lib/auth";
import { collection } from "../../../../../lib/db";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const session = verifySession(token);
  if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  // Super admin check
  const allowCol = await collection("adminAllowlist");
  const me = await allowCol.findOne({ email: String(session.adminId).toLowerCase(), status: { $in: ["active", "pending"] } }) as any;
  if (!me || !me.isSuperAdmin) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });

  const walletsCol = await collection("walletConnections");
  const pending = await walletsCol
    .find({ $or: [{ authorizedOnChain: { $ne: true } }, { pending: true }] } as any)
    .sort({ connectedAt: -1 })
    .toArray();

  return new Response(JSON.stringify(pending.map((w: any) => ({
    _id: String(w._id),
    adminId: w.adminId,
    walletAddress: w.walletAddress,
    chainId: w.chainId,
    walletType: w.walletType,
    pending: !!w.pending,
    authorizedOnChain: !!w.authorizedOnChain,
    connectedAt: w.connectedAt,
    lastActiveAt: w.lastActiveAt,
  }))), { headers: { "content-type": "application/json" } });
}


