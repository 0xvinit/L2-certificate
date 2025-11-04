import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export type Session = { adminId: string; isSuperAdmin?: boolean };

// For Edge Runtime (middleware)
export async function verifySessionEdge(token: string): Promise<Session | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload as Session;
  } catch (err: any) {
    console.log("JWT verification error (Edge):", err?.message || err);
    return null;
  }
}

