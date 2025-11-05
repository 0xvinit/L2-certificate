import { NextRequest } from "next/server";
import { verifySession } from "../../../../lib/auth";
import { collection } from "../../../../lib/db";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const session = verifySession(token);
  if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  // Email-based allowlist (passwordless)
  const allowCol = await collection("adminAllowlist");
  const allowed = await allowCol.findOne({ email: String(session.adminId).toLowerCase() }) as any;
  if (!allowed) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });

  return new Response(JSON.stringify({
    adminId: allowed.email,
    isSuperAdmin: !!allowed.isSuperAdmin,
    walletAddress: ""
  }), { headers: { "content-type": "application/json" } });
}

