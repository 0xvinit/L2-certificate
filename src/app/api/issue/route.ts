import { NextRequest } from "next/server";
import { ethers } from "ethers";
import { CERTIFICATE_REGISTRY_ABI, CERTIFICATE_REGISTRY_ADDRESS } from "../../../../src/lib/contract";
import QRCode from "qrcode";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const adminKey = req.headers.get("x-admin-key");
    if (!process.env.ADMIN_KEY || adminKey !== process.env.ADMIN_KEY) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    if (!process.env.RPC_URL || !process.env.ISSUER_PRIVATE_KEY || !CERTIFICATE_REGISTRY_ADDRESS) {
      return new Response(JSON.stringify({ error: "Server misconfigured" }), { status: 500 });
    }

    const body = await req.json();
    const { name, id, program, date } = body as { name: string; id: string; program: string; date: string };
    if (!name || !id || !program || !date) {
      return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });
    }

    // 1) Build simple PDF with visible fields and QR
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const titleSize = 24;
    const textSize = 12;

    page.drawText("Certificate of Completion", { x: 160, y: 780, size: titleSize, font, color: rgb(0, 0, 0) });
    page.drawText(`Name: ${name}`, { x: 80, y: 720, size: textSize, font });
    page.drawText(`ID: ${id}`, { x: 80, y: 700, size: textSize, font });
    page.drawText(`Program: ${program}`, { x: 80, y: 680, size: textSize, font });
    page.drawText(`Date: ${date}`, { x: 80, y: 660, size: textSize, font });

    // We’ll fill QR after we compute the hash
    const pdfBytesPre = await pdfDoc.save();

    // 2) Compute SHA-256 over PDF bytes
    const hashHex = crypto.createHash("sha256").update(Buffer.from(pdfBytesPre)).digest("hex");
    const hashBytes32 = "0x" + hashHex; // bytes32 will be parsed by ethers from hex string

    // 3) Create verification URL and embed QR
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const verifyUrl = `${baseUrl}/verify?h=${hashBytes32}`;
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 160 });
    const qrBase64 = qrDataUrl.split(",")[1];
    const qrImage = await pdfDoc.embedPng(Buffer.from(qrBase64, "base64"));
    const { width, height } = qrImage.size();
    const page2 = pdfDoc.getPage(0);
    page2.drawImage(qrImage, { x: 400, y: 640, width, height });

    const pdfBytes = await pdfDoc.save();

    // 4) On-chain register with metadataURI placeholder (you can swap with IPFS later)
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(process.env.ISSUER_PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CERTIFICATE_REGISTRY_ADDRESS, CERTIFICATE_REGISTRY_ABI, wallet);

    const metadataURI = ""; // Optional: upload pdfBytes to IPFS and use ipfs://CID
    const tx = await contract.register(hashBytes32, metadataURI);
    const receipt = await tx.wait();

    return new Response(
      JSON.stringify({
        hash: hashBytes32,
        txHash: receipt?.hash,
        verifyUrl,
        pdfBase64: Buffer.from(pdfBytes).toString("base64")
      }),
      { headers: { "content-type": "application/json" }, status: 200 }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Unknown error" }), { status: 500 });
  }
}



