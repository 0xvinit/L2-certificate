import { NextRequest } from "next/server";
import { ethers } from "ethers";
import { CERTIFICATE_REGISTRY_ABI, NEXT_PUBLIC_CERT_REGISTRY_ADDRESS } from "../../../lib/contract";
import { collection } from "../../../lib/db";
import { verifySession } from "../../../lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // Require authenticated admin session (email allowlist based)
    const token = req.cookies.get("token")?.value;
    const session = token ? verifySession(token) : null;
    if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    const allowCol = await collection("adminAllowlist");
    const me = await allowCol.findOne({ email: String(session.adminId).toLowerCase(), status: { $in: ["active", "pending"] } }) as any;
    if (!me) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });

    const { hash, syncOnly } = await req.json();
    if (!hash) {
      return new Response(JSON.stringify({ error: "Missing params" }), { status: 400 });
    }

    // If syncOnly is set, only update DB status without on-chain tx (used after client-side revoke)
    if (syncOnly) {
      try {
        const certs = await collection("certificates");
        const now = new Date().toISOString();
        const res = await certs.updateMany(
          { $or: [ { hash: String(hash) }, { finalPdfHash: String(hash) } ] } as any,
          { $set: { revoked: true, revokedAt: now, updatedAt: now } }
        );
        return new Response(JSON.stringify({ ok: true, updated: res.modifiedCount }), { headers: { "content-type": "application/json" } });
      } catch (e: any) {
        return new Response(JSON.stringify({ error: e?.message || "DB update failed" }), { status: 500 });
      }
    }

    if (!process.env.ARBISCAN_API_KEY || !process.env.ISSUER_PRIVATE_KEY || !NEXT_PUBLIC_CERT_REGISTRY_ADDRESS) {
      return new Response(JSON.stringify({ error: "Missing params or config" }), { status: 400 });
    }

    const provider = new ethers.JsonRpcProvider(process.env.ARBISCAN_API_KEY);
    const wallet = new ethers.Wallet(process.env.ISSUER_PRIVATE_KEY, provider);
    const contract = new ethers.Contract(NEXT_PUBLIC_CERT_REGISTRY_ADDRESS, CERTIFICATE_REGISTRY_ABI, wallet);
    const tx = await contract.revoke(hash);
    const receipt = await tx.wait();

    // Best-effort: mark revoked in Mongo for dashboard stats
    try {
      const certs = await collection("certificates");
      const now = new Date().toISOString();
      await certs.updateMany(
        { $or: [ { hash: String(hash) }, { finalPdfHash: String(hash) } ] } as any,
        { $set: { revoked: true, revokedAt: now, updatedAt: now } }
      );
    } catch (dbErr) {
      console.warn("Failed to update revoked status in DB", dbErr);
    }

    return new Response(JSON.stringify({ txHash: receipt?.hash }), { headers: { "content-type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Unknown error" }), { status: 500 });
  }
}



