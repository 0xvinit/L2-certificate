import { NextRequest } from "next/server";
import { verifySession } from "../../../../../lib/auth";
import { collection } from "../../../../../lib/db";
import { ethers } from "ethers";
import { NEXT_PUBLIC_CERT_REGISTRY_ADDRESS, CERTIFICATE_REGISTRY_ABI } from "../../../../../lib/contract";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const session = verifySession(token);
  if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  // Super admin check
  const allowCol = await collection("adminAllowlist");
  const me = await allowCol.findOne({ email: String(session.adminId).toLowerCase(), status: { $in: ["active", "pending"] } }) as any;
  if (!me || !me.isSuperAdmin) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });

  const { walletAddress, adminId } = await req.json();
  if (!walletAddress) return new Response(JSON.stringify({ error: "Missing walletAddress" }), { status: 400 });

  if (!process.env.NEXT_PUBLIC_RPC_URL || !process.env.OWNER_PRIVATE_KEY || !NEXT_PUBLIC_CERT_REGISTRY_ADDRESS) {
    return new Response(JSON.stringify({ error: "Server misconfigured" }), { status: 500 });
  }

  const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
  const ownerWallet = new ethers.Wallet(process.env.OWNER_PRIVATE_KEY, provider);
  const contract = new ethers.Contract(NEXT_PUBLIC_CERT_REGISTRY_ADDRESS, CERTIFICATE_REGISTRY_ABI, ownerWallet);

  try {
    // Check if already authorized
    if (contract.isAuthorizedIssuer) {
      const already = await contract.isAuthorizedIssuer(walletAddress);
      if (already) {
        // Update DB flags anyway
        const col = await collection("walletConnections");
        await col.updateMany(
          { walletAddress: String(walletAddress).toLowerCase(), ...(adminId ? { adminId } : {}) },
          { $set: { authorizedOnChain: true, pending: false, updatedAt: new Date().toISOString() } }
        );
        return new Response(JSON.stringify({ ok: true, alreadyAuthorized: true }), { headers: { "content-type": "application/json" } });
      }
    }

    const tx = await contract.authorizeIssuer(walletAddress);
    const receipt = await tx.wait();

    // Update DB flags
    const col = await collection("walletConnections");
    await col.updateMany(
      { walletAddress: String(walletAddress).toLowerCase(), ...(adminId ? { adminId } : {}) },
      { $set: { authorizedOnChain: true, pending: false, updatedAt: new Date().toISOString() } }
    );

    return new Response(JSON.stringify({ ok: true, txHash: receipt?.hash || tx.hash }), { headers: { "content-type": "application/json" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || "Failed to approve issuer" }), { status: 500 });
  }
}


