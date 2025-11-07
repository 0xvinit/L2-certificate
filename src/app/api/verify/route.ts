import { NextRequest } from "next/server";
import { ethers } from "ethers";
import { CERTIFICATE_REGISTRY_ABI, NEXT_PUBLIC_CERT_REGISTRY_ADDRESS } from "../../../lib/contract";
import { collection } from "../../../lib/db";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const h = searchParams.get("h");
    if (!h || !NEXT_PUBLIC_CERT_REGISTRY_ADDRESS) {
      return new Response(JSON.stringify({ error: "Missing params" }), { status: 400 });
    }

    let valid = false;
    let revoked = false;
    let cert: any = { metadataURI: "", issuanceTimestamp: 0, revoked: false };
    try {
      const provider = new ethers.JsonRpcProvider(process.env.ARBISCAN_API_KEY);
      const contract = new ethers.Contract(NEXT_PUBLIC_CERT_REGISTRY_ADDRESS, CERTIFICATE_REGISTRY_ABI, provider);
      const statusTuple = await contract.isValid(h);
      valid = Boolean(statusTuple[0]);
      revoked = Boolean(statusTuple[1]);
      cert = await contract.getCertificate(h);
      console.log("cert", cert)
      console.log("valid", valid)
      console.log("revoked", revoked)
    } catch (chainErr) {
      // Chain not reachable or wrong network; continue with DB fallback
      console.warn("Chain verification failed:", chainErr);
    }

    // Get certificate details from MongoDB
    let certDetails: any = null;
    try {
      const certCol = await collection("certificates");
      // Allow lookup by either on-chain hash or final PDF hash (uploaded file case)
      certDetails = await certCol.findOne({ $or: [{ hash: h }, { finalPdfHash: h }] });
      // If matched by finalPdfHash, use the on-chain hash for chain verification
      const chainHash = certDetails?.hash || h;
      if (certDetails) {
        // Get program details
        if (certDetails.programId) {
          try {
            const programCol = await collection("programs");
            const program = await programCol.findOne({ _id: new ObjectId(certDetails.programId) }) as any;
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
            const admin = await adminCol.findOne({ walletAddress: certDetails.adminAddress.toLowerCase() }) as any;
            if (admin) {
              certDetails.university = admin.university || "";
            }
          } catch {}
        }
      }
      // If we didn't have a valid/ revoked status yet, or chain said not found, try again with the chainHash
      if (!valid && !revoked && chainHash) {
        try {
          const provider2 = new ethers.JsonRpcProvider(process.env.ARBISCAN_API_KEY);
          const contract2 = new ethers.Contract(NEXT_PUBLIC_CERT_REGISTRY_ADDRESS, CERTIFICATE_REGISTRY_ABI, provider2);
          const statusTuple2 = await contract2.isValid(chainHash);
          valid = Boolean(statusTuple2[0]);
          revoked = Boolean(statusTuple2[1]);
          cert = await contract2.getCertificate(chainHash);
        } catch {}
      }
    } catch {}

    // If chain says not found but DB has a record (issued and saved), treat as verified fallback
    const finalStatus = valid ? "verified" : revoked ? "revoked" : (certDetails ? "verified" : "not_found");
    const finalMetadata = cert?.metadataURI || certDetails?.verifyUrl || "";
    const finalIssuanceTs = cert?.issuanceTimestamp ? Number(cert.issuanceTimestamp) : undefined;

    return new Response(
      JSON.stringify({
        status: finalStatus,
        metadataURI: finalMetadata,
        issuanceTimestamp: finalIssuanceTs,
        revoked: Boolean(revoked),
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


