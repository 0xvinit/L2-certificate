import { NextRequest } from "next/server";
import { collection } from "../../../lib/db";
import { verifySession } from "../../../lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { adminAddress, adminId, programId, studentName, studentId, date, hash, txHash, verifyUrl } = body;
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
    revoked: false, 
    createdAt: now 
  };
  const res = await col.insertOne(doc as any);
  return new Response(JSON.stringify({ _id: String(res.insertedId), ...doc }), { headers: { "content-type": "application/json" } });
}


