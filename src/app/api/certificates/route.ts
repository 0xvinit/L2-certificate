import { NextRequest } from "next/server";
import { collection } from "../../../lib/db";
import { verifySession } from "../../../lib/auth";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const studentId = (searchParams.get("studentId") || "").trim();
  if (!studentId) {
    return new Response(JSON.stringify({ error: "Missing studentId" }), { status: 400 });
  }
  const certsCol = await collection("certificates");
  const programsCol = await collection("programs");
  const adminsCol = await collection("admins");
  const certs = await certsCol
    .find({ studentId, revoked: { $ne: true } })
    .sort({ createdAt: -1 })
    .toArray();
  const results = await Promise.all(
    certs.map(async (c: any) => {
      let program: any = null;
      let admin: any = null;
      try {
        program = c.programId ? await programsCol.findOne({ _id: new ObjectId(String(c.programId)) }) : null;
        if (c.adminId) {
          admin = await adminsCol.findOne({ adminId: c.adminId });
        }
      } catch {}
      return {
        _id: String(c._id),
        adminId: c.adminId || "",
        programId: c.programId || "",
        studentName: c.studentName,
        studentId: c.studentId,
        date: c.date,
        hash: c.hash,
        txHash: c.txHash || "",
        verifyUrl: c.verifyUrl || "",
        createdAt: c.createdAt,
        programName: program?.name || "",
        programCode: program?.code || "",
        programLogoUrl: program?.logoUrl || "",
        programSignatureUrl: program?.signatureUrl || "",
        universityName: admin?.university || "",
        signatoryName: program?.signatoryName || "",
        signatoryTitle: program?.signatoryTitle || "",
        pdfBase64: c.pdfBase64 || "",
      };
    })
  );
  return new Response(JSON.stringify(results), { headers: { "content-type": "application/json" } });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { adminAddress, adminId, programId, studentName, studentId, date, hash, txHash, verifyUrl, pdfBase64, finalPdfHash } = body;
  if (!adminAddress || !programId || !studentName || !studentId || !date || !hash) {
    return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });
  }
  
  // Get adminId from session if not provided
  let finalAdminId = adminId;
  if (!finalAdminId) {
    const token = req.cookies.get("token")?.value;
    if (token) {
      const session = verifySession(token);
      if (session) {
        finalAdminId = session.adminId;
      }
    }
  }
  // Authorization: Only allow issuing for a program owned by the admin (unless super admin)
  const token = req.cookies.get("token")?.value;
  const session = token ? verifySession(token) : null;
  if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  const adminsCol = await collection("admins");
  const me = await adminsCol.findOne({ adminId: session.adminId });
  if (!me) return new Response(JSON.stringify({ error: "Admin not found" }), { status: 404 });
  const programsCol = await collection("programs");
  const program = await programsCol.findOne({ _id: new (await import("mongodb")).ObjectId(programId) });
  if (!program) return new Response(JSON.stringify({ error: "Program not found" }), { status: 404 });
  const isOwner = String(program.adminId).toLowerCase() === String(me.adminId).toLowerCase();
  if (!me.isSuperAdmin && !isOwner) {
    return new Response(JSON.stringify({ error: "Forbidden: cannot issue for this program" }), { status: 403 });
  }
  
  const col = await collection("certificates");
  const now = new Date().toISOString();
  const doc = { 
    adminAddress: adminAddress.toLowerCase(), 
    adminId: finalAdminId || "",
    programId, 
    studentName, 
    studentId, 
    date, 
    hash, 
    txHash: txHash || "", 
    verifyUrl: verifyUrl || "", 
    pdfBase64: pdfBase64 || "",
    finalPdfHash: finalPdfHash || "",
    revoked: false, 
    createdAt: now 
  };
  const res = await col.insertOne(doc as any);
  return new Response(JSON.stringify({ _id: String(res.insertedId), ...doc }), { headers: { "content-type": "application/json" } });
}


