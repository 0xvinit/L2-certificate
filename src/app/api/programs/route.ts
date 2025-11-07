import { NextRequest } from "next/server";
import { collection } from "../../../lib/db";
import { verifySession } from "../../../lib/auth";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const session = token ? verifySession(token) : null;
  if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const { searchParams } = new URL(req.url);
  const queryAdminId = (searchParams.get("adminId") || "").toLowerCase();

  const allowCol = await collection("adminAllowlist");
  const me = await allowCol.findOne({ email: String(session.adminId).toLowerCase(), status: { $in: ["active", "pending"] } }) as any;
  if (!me) return new Response(JSON.stringify({ error: "Admin not found" }), { status: 404 });

  const programsCol = await collection("programs");

  // Super admin can view all or a specific admin via ?admin=
  if (me.isSuperAdmin) {
    const filter = queryAdminId ? { adminId: queryAdminId } : {};
    const items = await programsCol.find(filter).sort({ createdAt: -1 }).toArray();
    return new Response(JSON.stringify(items), { headers: { "content-type": "application/json" } });
  }

  // Regular admins can only view their own
  // Include legacy records:
  //  - adminId equal to email (new)
  //  - adminAddress equal to any connected wallet for this admin (legacy association)
  const walletCol = await collection("walletConnections");
  const wallets = await walletCol
    .find({ adminId: String(session.adminId).toLowerCase() })
    .project({ walletAddress: 1 })
    .toArray();
  const walletAddresses = wallets.map((w: any) => String(w.walletAddress || "").toLowerCase()).filter(Boolean);

  const items = await programsCol
    .find({
      $or: [
        { adminId: String(session.adminId).toLowerCase() },
        ...(walletAddresses.length > 0 ? [{ adminAddress: { $in: walletAddresses } }] : []),
      ],
    })
    .sort({ createdAt: -1 })
    .toArray();
  return new Response(JSON.stringify(items), { headers: { "content-type": "application/json" } });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const session = token ? verifySession(token) : null;
  if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const body = await req.json();
  const { adminAddress, adminId, name, code, startDate, endDate, logoUrl, signatureUrl } = body;
  if (!adminAddress || !adminId || !name || !code)
    return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });

  const allowCol = await collection("adminAllowlist");
  const me = await allowCol.findOne({ email: String(session.adminId).toLowerCase(), status: { $in: ["active", "pending"] } }) as any;
  if (!me) return new Response(JSON.stringify({ error: "Admin not found" }), { status: 404 });

  // Only super admin or the owner can create under an id
  const lowerAddr = String(adminAddress).toLowerCase();
  const lowerAdminId = String(adminId).toLowerCase();
  if (!me.isSuperAdmin && lowerAdminId !== String(session.adminId).toLowerCase()) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  }

  const col = await collection("programs");
  const now = new Date().toISOString();
  const doc = { 
    adminAddress: lowerAddr, 
    adminId: lowerAdminId,
    name, 
    code, 
    startDate, 
    endDate, 
    logoUrl: logoUrl || "",
    signatureUrl: signatureUrl || "",
    isActive: true, 
    createdAt: now, 
    updatedAt: now 
  };
  const res = await col.insertOne(doc as any);
  return new Response(JSON.stringify({ _id: String(res.insertedId), ...doc }), { headers: { "content-type": "application/json" } });
}

export async function PUT(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const session = token ? verifySession(token) : null;
  if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const body = await req.json();
  const { id, name, code, startDate, endDate, isActive } = body;
  if (!id) return new Response(JSON.stringify({ error: "Missing id" }), { status: 400 });
  const allowCol = await collection("adminAllowlist");
  const me = await allowCol.findOne({ email: String(session.adminId).toLowerCase(), status: { $in: ["active", "pending"] } }) as any;
  if (!me) return new Response(JSON.stringify({ error: "Admin not found" }), { status: 404 });

  const col = await collection("programs");
  const now = new Date().toISOString();
  
  // Build update object with only provided fields
  const updateFields: any = { updatedAt: now };
  
  if (name !== undefined) updateFields.name = name;
  if (code !== undefined) updateFields.code = code;
  if (startDate !== undefined) updateFields.startDate = startDate;
  if (endDate !== undefined) updateFields.endDate = endDate;
  if (isActive !== undefined) updateFields.isActive = isActive;
  
  // Authorization: only super or owner of program can update
  const existing = await col.findOne({ _id: new ObjectId(id) }) as any;
  if (!existing) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  if (!me.isSuperAdmin && String(existing.adminId).toLowerCase() !== String(session.adminId).toLowerCase()) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  }

  await col.updateOne({ _id: new ObjectId(id) }, { $set: updateFields });
  const updated = await col.findOne({ _id: new ObjectId(id) });
  return new Response(JSON.stringify(updated), { headers: { "content-type": "application/json" } });
}

export async function DELETE(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const session = token ? verifySession(token) : null;
  if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return new Response(JSON.stringify({ error: "Missing id" }), { status: 400 });

  const allowCol = await collection("adminAllowlist");
  const me = await allowCol.findOne({ email: String(session.adminId).toLowerCase(), status: { $in: ["active", "pending"] } }) as any;
  if (!me) return new Response(JSON.stringify({ error: "Admin not found" }), { status: 404 });

  const col = await collection("programs");
  const existing = await col.findOne({ _id: new ObjectId(id) }) as any;
  if (!existing) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  if (!me.isSuperAdmin && String(existing.adminId).toLowerCase() !== String(session.adminId).toLowerCase()) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  }

  await col.deleteOne({ _id: new ObjectId(id) });
  return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json" } });
}


