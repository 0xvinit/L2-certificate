import { NextRequest } from "next/server";
import { verifySession } from "../../../../lib/auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const allCookies = req.cookies.getAll();
  
  return new Response(JSON.stringify({
    hasToken: !!token,
    tokenValue: token ? token.substring(0, 20) + "..." : null,
    allCookies: allCookies.map(c => ({ name: c.name, value: c.value.substring(0, 20) + "..." })),
    session: token ? verifySession(token) : null
  }), { headers: { "content-type": "application/json" } });
}

