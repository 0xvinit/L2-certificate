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

type AuthorizeWalletPayload = {
  walletAddress?: string;
  adminId?: string;
};

export async function POST(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const session = verifySession(token);
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const { walletAddress, adminId }: AuthorizeWalletPayload = await req.json();
  if (!walletAddress || typeof walletAddress !== "string") {
    return new Response(JSON.stringify({ error: "Missing walletAddress" }), { status: 400 });
  }

  let checksumAddress: string;
  try {
    checksumAddress = ethers.getAddress(walletAddress);
  } catch (err) {
    return new Response(JSON.stringify({ error: "Invalid wallet address" }), { status: 400 });
  }

  const sessionAdminId = String(session.adminId).toLowerCase();
  const rawRequestedAdminId = adminId ? String(adminId) : undefined;
  const requestedAdminId = rawRequestedAdminId ? rawRequestedAdminId.toLowerCase() : undefined;
  const targetAdminId = session.isSuperAdmin && requestedAdminId ? requestedAdminId : sessionAdminId;
  const isSelfRequest = targetAdminId === sessionAdminId;

  if (!session.isSuperAdmin && !isSelfRequest) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  }

  const allowCol = await collection("adminAllowlist");
  const allowlisted = await allowCol.findOne({
    email: targetAdminId,
    status: { $in: ["active", "pending"] }
  }) as any;

  if (!allowlisted) {
    return new Response(JSON.stringify({ error: "Admin is not allowlisted" }), { status: 403 });
  }

  const normalizedAddress = checksumAddress.toLowerCase();
  const walletCol = await collection("walletConnections");
  const adminIdCandidates = Array.from(
    new Set(
      [targetAdminId, session.adminId, rawRequestedAdminId]
        .filter((val): val is string => !!val)
    )
  );

  let walletRecord = await walletCol.findOne({
    adminId: { $in: adminIdCandidates },
    walletAddress: normalizedAddress
  }) as any;

  if (!walletRecord) {
    const now = new Date().toISOString();

    const insertDoc = {
      adminId: targetAdminId,
      walletAddress: normalizedAddress,
      chainId: null,
      walletType: "auto",
      connectedAt: now,
      lastActiveAt: now,
      pending: true,
      authorizedOnChain: false,
      createdAt: now,
      updatedAt: now
    } as any;

    const inserted = await walletCol.insertOne(insertDoc);

    walletRecord = {
      _id: inserted.insertedId,
      ...insertDoc
    };

    try {
      await allowCol.updateOne(
        { email: targetAdminId },
        {
          $set: {
            walletAddress: normalizedAddress,
            updatedAt: now
          }
        }
      );
    } catch (adminUpdateErr) {
      console.warn("Failed to update allowlist record for wallet", adminUpdateErr);
    }
  }

  if (!process.env.NEXT_PUBLIC_RPC_URL || !NEXT_PUBLIC_CERT_REGISTRY_ADDRESS) {
    return new Response(JSON.stringify({ error: "Server misconfigured" }), { status: 500 });
  }

  if (!process.env.OWNER_PRIVATE_KEY) {
    return new Response(JSON.stringify({ error: "Owner private key not configured" }), { status: 500 });
  }

  const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
  const ownerWallet = new ethers.Wallet(process.env.OWNER_PRIVATE_KEY, provider);
  const contract = new ethers.Contract(
    NEXT_PUBLIC_CERT_REGISTRY_ADDRESS,
    CERTIFICATE_REGISTRY_ABI,
    ownerWallet
  );

  try {
    let isAuthorized = false;
    if (typeof contract.isAuthorizedIssuer === "function") {
      isAuthorized = await contract.isAuthorizedIssuer(checksumAddress);
    } else if (typeof (contract as any).authorizedIssuers === "function") {
      isAuthorized = await (contract as any).authorizedIssuers(checksumAddress);
    }

    if (isAuthorized) {
      await walletCol.updateMany(
        { adminId: { $in: adminIdCandidates }, walletAddress: normalizedAddress },
        { $set: { authorizedOnChain: true, pending: false, updatedAt: new Date().toISOString() } }
      );
      return new Response(
        JSON.stringify({ ok: true, alreadyAuthorized: true }),
        { headers: { "content-type": "application/json" } }
      );
    }

    const tx = await contract.authorizeIssuer(checksumAddress);
    const receipt = await tx.wait();

    await walletCol.updateMany(
      { adminId: { $in: adminIdCandidates }, walletAddress: normalizedAddress },
      { $set: { authorizedOnChain: true, pending: false, updatedAt: new Date().toISOString() } }
    );

    return new Response(
      JSON.stringify({ ok: true, txHash: receipt?.hash || tx.hash, autoAuthorized: isSelfRequest && !session.isSuperAdmin }),
      { headers: { "content-type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Error authorizing wallet:", err);
    return new Response(
      JSON.stringify({ error: err?.message || "Failed to authorize wallet" }),
      { status: 500 }
    );
  }
}

