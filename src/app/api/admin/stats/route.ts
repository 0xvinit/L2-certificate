import { NextRequest } from "next/server";
import { collection } from "../../../../lib/db";
import { verifySession } from "../../../../lib/auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const allCookies = req.cookies.getAll();
  
  console.log("Stats API - Token:", token ? "exists" : "undefined");
  console.log("Stats API - All cookies:", allCookies.map(c => c.name));
  
  const session = token ? verifySession(token) : null;
  if (!session) {
    console.log("Stats API - No valid session");
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const queryAdminId = (searchParams.get("adminId") || "").toLowerCase();

  // Determine requester (email-based allowlist)
  const allowCol = await collection("adminAllowlist");
  const me = await allowCol.findOne({ email: String(session.adminId).toLowerCase(), status: { $in: ["active", "pending"] } });
  if (!me) return new Response(JSON.stringify({ error: "Admin not found" }), { status: 404 });

  const certs = await collection("certificates");

  // Super admin: all stats or specific admin if provided
  if ((me as any).isSuperAdmin) {
    const filter = queryAdminId ? { adminId: queryAdminId } : {};
    const total = await certs.countDocuments(filter);
    const revoked = await certs.countDocuments({ ...filter, revoked: true } as any);
    const recent = await certs.find(filter).sort({ createdAt: -1 }).limit(10).toArray();
    return new Response(JSON.stringify({ total, revoked, recent }), { headers: { "content-type": "application/json" } });
  }

  // Regular admin: only their own
  const myAdminId = String(session.adminId).toLowerCase();
  const total = await certs.countDocuments({ adminId: myAdminId });
  const revoked = await certs.countDocuments({ adminId: myAdminId, revoked: true });
  const recent = await certs.find({ adminId: myAdminId }).sort({ createdAt: -1 }).limit(10).toArray();
  return new Response(JSON.stringify({ total, revoked, recent }), { headers: { "content-type": "application/json" } });
}


