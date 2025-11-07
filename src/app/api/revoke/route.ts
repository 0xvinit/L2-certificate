import { NextRequest } from "next/server";
import { ethers } from "ethers";
import { CERTIFICATE_REGISTRY_ABI, NEXT_PUBLIC_CERT_REGISTRY_ADDRESS } from "../../../lib/contract";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const adminKey = req.headers.get("x-admin-key");
    if (!process.env.ADMIN_KEY || adminKey !== process.env.ADMIN_KEY) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { hash } = await req.json();
    if (!hash || !process.env.ARBISCAN_API_KEY || !process.env.ISSUER_PRIVATE_KEY || !NEXT_PUBLIC_CERT_REGISTRY_ADDRESS) {
      return new Response(JSON.stringify({ error: "Missing params or config" }), { status: 400 });
    }

    const provider = new ethers.JsonRpcProvider(process.env.ARBISCAN_API_KEY);
    const wallet = new ethers.Wallet(process.env.ISSUER_PRIVATE_KEY, provider);
    const contract = new ethers.Contract(NEXT_PUBLIC_CERT_REGISTRY_ADDRESS, CERTIFICATE_REGISTRY_ABI, wallet);
    const tx = await contract.revoke(hash);
    const receipt = await tx.wait();

    return new Response(JSON.stringify({ txHash: receipt?.hash }), { headers: { "content-type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Unknown error" }), { status: 500 });
  }
}



