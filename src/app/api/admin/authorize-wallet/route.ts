import { NextRequest } from "next/server";
import { verifySession } from "../../../../lib/auth";
import { collection } from "../../../../lib/db";
import { ethers } from "ethers";
import { NEXT_PUBLIC_CERT_REGISTRY_ADDRESS } from "../../../../lib/contract";

const CERTIFICATE_REGISTRY_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "newIssuer", "type": "address"}],
    "name": "authorizeIssuer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "addr", "type": "address"}],
    "name": "isAuthorizedIssuer",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "", "type": "address"}],
    "name": "authorizedIssuers",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export async function POST(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const session = verifySession(token);
  if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  // Only super admins can authorize issuers
  const allowCol = await collection("adminAllowlist");
  const me = await allowCol.findOne({ email: String(session.adminId).toLowerCase(), status: { $in: ["active", "pending"] } }) as any;
  if (!me || !me.isSuperAdmin) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });

  const { walletAddress } = await req.json();
  if (!walletAddress) return new Response(JSON.stringify({ error: "Missing walletAddress" }), { status: 400 });

  // Verify target wallet belongs to an allowed admin (optional soft check)
  const walletCol = await collection("walletConnections");
  const existing = await walletCol.findOne({ walletAddress: String(walletAddress).toLowerCase() }) as any;
  if (!existing) return new Response(JSON.stringify({ error: "Wallet not found" }), { status: 404 });

  // Check if wallet is already authorized on-chain
  if (!process.env.RPC_URL || !NEXT_PUBLIC_CERT_REGISTRY_ADDRESS) {
    return new Response(JSON.stringify({ error: "Server misconfigured" }), { status: 500 });
  }

  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const contract = new ethers.Contract(NEXT_PUBLIC_CERT_REGISTRY_ADDRESS, CERTIFICATE_REGISTRY_ABI, provider);

  try {
    const isAuthorized = await contract.isAuthorizedIssuer(walletAddress);
    if (isAuthorized) {
      // Update DB flags anyway
      await walletCol.updateMany(
        { walletAddress: String(walletAddress).toLowerCase() },
        { $set: { authorizedOnChain: true, pending: false, updatedAt: new Date().toISOString() } }
      );
      return new Response(JSON.stringify({ ok: true, alreadyAuthorized: true }), { headers: { "content-type": "application/json" } });
    }

    // Authorize wallet on-chain (requires owner's private key)
    if (!process.env.OWNER_PRIVATE_KEY) {
      return new Response(JSON.stringify({ error: "Owner private key not configured" }), { status: 500 });
    }

    const wallet = new ethers.Wallet(process.env.OWNER_PRIVATE_KEY, provider);
    const contractWithSigner = new ethers.Contract(NEXT_PUBLIC_CERT_REGISTRY_ADDRESS, CERTIFICATE_REGISTRY_ABI, wallet);
    
    const tx = await contractWithSigner.authorizeIssuer(walletAddress);
    await tx.wait();

    // Update DB flags
    await walletCol.updateMany(
      { walletAddress: String(walletAddress).toLowerCase() },
      { $set: { authorizedOnChain: true, pending: false, updatedAt: new Date().toISOString() } }
    );

    return new Response(JSON.stringify({ ok: true, txHash: tx.hash }), { headers: { "content-type": "application/json" } });
  } catch (err: any) {
    console.error("Error authorizing wallet:", err);
    return new Response(JSON.stringify({ error: err?.message || "Failed to authorize wallet" }), { status: 500 });
  }
}

