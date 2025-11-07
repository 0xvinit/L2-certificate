import { NextRequest } from "next/server";
import { collection } from "../../../../lib/db";

// Bootstrap a Super Admin using env SUPER_ADMIN_EMAIL.
// Safe to call multiple times: only inserts if there is no super admin yet.
export async function POST(req: NextRequest) {
  const email = (process.env.SUPER_ADMIN_EMAIL || "").toLowerCase().trim();
  if (!email) {
    return new Response(JSON.stringify({ error: "SUPER_ADMIN_EMAIL not set" }), { status: 500 });
  }

  const allowCol = await collection("adminAllowlist");

  // If any super admin exists, do nothing
  const existingSuper = await allowCol.findOne({ isSuperAdmin: true });
  if (existingSuper) {
    return new Response(JSON.stringify({ ok: true, message: "Super admin already exists" }), { headers: { "content-type": "application/json" } });
  }

  const now = new Date().toISOString();
  await allowCol.updateOne(
    { email },
    {
      $set: {
        email,
        status: "active",
        isSuperAdmin: true,
        updatedAt: now,
      },
      $setOnInsert: {
        createdBy: "system",
        createdAt: now,
      },
    },
    { upsert: true }
  );

  return new Response(JSON.stringify({ ok: true, email }), { headers: { "content-type": "application/json" } });
}


