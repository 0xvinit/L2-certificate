import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { fileBase64, filename } = await req.json();
    if (!fileBase64) return new Response(JSON.stringify({ error: "Missing fileBase64" }), { status: 400 });
    const pinataJwt = process.env.PINATA_JWT || "";
    const pinataKey = process.env.PINATA_API_KEY || "";
    const pinataSecret = process.env.PINATA_SECRET_API_KEY || "";
    const explicitUrl = process.env.IPFS_API_URL || "";
    // Prefer Pinata when its creds are present; otherwise use explicit URL or Infura add endpoint
    const apiBase = explicitUrl || (pinataJwt || (pinataKey && pinataSecret)
      ? "https://api.pinata.cloud/pinning/pinFileToIPFS"
      : "https://ipfs.infura.io:5001/api/v0/add");
    const isPinata = apiBase.includes("pinata.cloud");
    const url = isPinata ? apiBase : (apiBase.endsWith("/add") ? apiBase : `${apiBase.replace(/\/$/, "")}/add`);

    const data = Buffer.from(fileBase64, "base64");
    const form = new FormData();
    const blob = new Blob([data]);
    form.append("file", blob, filename || "file");

    const headers: any = {};
    if (pinataJwt) headers["Authorization"] = `Bearer ${pinataJwt}`;
    else if (pinataKey && pinataSecret) {
      headers["pinata_api_key"] = pinataKey;
      headers["pinata_secret_api_key"] = pinataSecret;
    } else if (process.env.IPFS_AUTH) {
      headers["Authorization"] = process.env.IPFS_AUTH as string;
    }

    const resp = await fetch(isPinata ? url : `${url}?pin=true`, {
      method: "POST",
      headers,
      body: form as any,
    });
    const text = await resp.text();
    if (!resp.ok) {
      return new Response(JSON.stringify({ error: text || "Upload failed" }), { status: resp.status });
    }
    let cid = "";
    try {
      const parsed = JSON.parse(text);
      cid = parsed.IpfsHash || parsed.Hash || parsed.cid || parsed.Cid || "";
    } catch {
      const last = text.trim().split("\n").pop() || "{}";
      try {
        const parsed = JSON.parse(last);
        cid = parsed.IpfsHash || parsed.Hash || parsed.cid || parsed.Cid || "";
      } catch {}
    }
    if (!cid) return new Response(JSON.stringify({ error: "No CID returned" }), { status: 500 });
    return new Response(JSON.stringify({ cid, uri: `ipfs://${cid}` }), { headers: { "content-type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Failed" }), { status: 500 });
  }
}


