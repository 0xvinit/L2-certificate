import { NextRequest, NextResponse } from "next/server";
import { verifySessionEdge } from "./lib/auth-edge";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Protect admin routes and vc-dashboard routes
  if (pathname.startsWith("/admin") || pathname.startsWith("/vc-dashboard")) {
    const token = req.cookies.get("token")?.value;
    const allCookies = req.cookies.getAll();

    console.log("Middleware - Token:", token);
    console.log("Middleware - Path:", pathname, "Has token:", !!token, "Cookies:", allCookies.map(c => c.name));
    
    if (!token) {
      console.log("Middleware - No token, redirecting to home");
      const homeUrl = new URL("/", req.url);
      return NextResponse.redirect(homeUrl);
    }

    console.log("Middleware - JWT_SECRET exists:", !!process.env.JWT_SECRET);
    const session = await verifySessionEdge(token);
    console.log("Middleware - Session:", session);

    if (!session) {
      console.log("Middleware - Invalid session, redirecting to home");
      const homeUrl = new URL("/", req.url);
      return NextResponse.redirect(homeUrl);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/vc-dashboard/:path*"],
};


