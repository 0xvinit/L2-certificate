import { NextRequest } from "next/server";
import { verifySession } from "../../../../lib/auth";
import { collection } from "../../../../lib/db";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  
  const session = verifySession(token);
  if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  
  const col = await collection("admins");
  const admin = await col.findOne({ adminId: session.adminId });
  if (!admin) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  
  return new Response(JSON.stringify({ 
    adminId: admin.adminId, 
    isSuperAdmin: admin.isSuperAdmin,
    walletAddress: admin.walletAddress 
  }), { headers: { "content-type": "application/json" } });
}

