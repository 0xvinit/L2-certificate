import { NextRequest } from "next/server";
import { create as createIpfsClient } from "ipfs-http-client";

export async function POST(req: NextRequest) {
  try {
    const { fileBase64, filename } = await req.json();
    if (!fileBase64) return new Response(JSON.stringify({ error: "Missing fileBase64" }), { status: 400 });
    const projectUrl = process.env.IPFS_API_URL || "https://ipfs.infura.io:5001/api/v0";
    const auth = process.env.IPFS_AUTH || ""; // e.g., Basic base64(user:pass) or Bearer token
    const client = createIpfsClient({ url: projectUrl, headers: auth ? { Authorization: auth } : undefined as any });
    const data = Buffer.from(fileBase64, "base64");
    const { cid } = await client.add({ content: data, path: filename || "file" });
    return new Response(JSON.stringify({ cid: cid.toString(), uri: `ipfs://${cid.toString()}` }), { headers: { "content-type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Failed" }), { status: 500 });
  }
}


