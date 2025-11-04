import { NextRequest } from "next/server";
import { ethers } from "ethers";
import { CERTIFICATE_REGISTRY_ABI, CERTIFICATE_REGISTRY_ADDRESS } from "../../../lib/contract";
import { collection } from "../../../lib/db";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const h = searchParams.get("h");
    if (!h || !CERTIFICATE_REGISTRY_ADDRESS) {
      return new Response(JSON.stringify({ error: "Missing params" }), { status: 400 });
    }

    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const contract = new ethers.Contract(CERTIFICATE_REGISTRY_ADDRESS, CERTIFICATE_REGISTRY_ABI, provider);

    const [valid, revoked] = await contract.isValid(h);
    const cert = await contract.getCertificate(h);

    // Get certificate details from MongoDB
    let certDetails = null;
    try {
      const certCol = await collection("certificates");
      certDetails = await certCol.findOne({ hash: h });
      if (certDetails) {
        // Get program details
        if (certDetails.programId) {
          try {
            const programCol = await collection("programs");
            const program = await programCol.findOne({ _id: new ObjectId(certDetails.programId) });
            if (program) {
              certDetails.programName = program.name;
              certDetails.programCode = program.code;
            }
          } catch {}
        }
        // Get admin/university details
        if (certDetails.adminAddress) {
          try {
            const adminCol = await collection("admins");
            const admin = await adminCol.findOne({ walletAddress: certDetails.adminAddress.toLowerCase() });
            if (admin) {
              certDetails.university = admin.university || "";
            }
          } catch {}
        }
      }
    } catch {}

    return new Response(
      JSON.stringify({
        status: valid ? "verified" : revoked ? "revoked" : "not_found",
        metadataURI: cert.metadataURI,
        issuanceTimestamp: Number(cert.issuanceTimestamp),
        revoked: Boolean(cert.revoked),
        certificate: certDetails ? {
          studentName: certDetails.studentName,
          studentId: certDetails.studentId,
          date: certDetails.date,
          programName: certDetails.programName,
          programCode: certDetails.programCode,
          university: certDetails.university,
          txHash: certDetails.txHash
        } : null
      }),
      { headers: { "content-type": "application/json" } }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Unknown error" }), { status: 500 });
  }
}


