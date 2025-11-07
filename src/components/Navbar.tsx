"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
// @ts-ignore - provided by Alchemy Account Kit at runtime
import { useUser } from "@account-kit/react";
import { useEffect, useState } from "react";
import { LogOut, Home } from "lucide-react";

const links = [{ href: "/", label: "Home" }];

export default function Navbar() {
  const pathname = usePathname();
  const user = useUser(); // Alchemy user
  const [menuOpen, setMenuOpen] = useState(false);
  const [hasAdminSession, setHasAdminSession] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        setHasAdminSession(res.ok);
      } catch {
        setHasAdminSession(false);
      }
    })();
  }, []);

  // Only clear session cookie if admin session exists but Alchemy user is gone
  // This handles the case where user logs out from Alchemy
  useEffect(() => {
    if (!user && hasAdminSession) {
      // User logged out from Alchemy - clear session cookie
      fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      }).catch(() => {});
      setHasAdminSession(false);
    }
  }, [user, hasAdminSession]);

  const handleAdminLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {}
    window.location.href = "/login";
  };

  return (
    <></>
    // <header className="sticky top-0 z-40 w-full bg-linear-to-b from-white/95 to-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm">
    //   <div className="container max-w-7xl h-16 flex items-center justify-between px-6">
    //     <Link href="/" className="flex items-center gap-3 group">
    //       <div className="h-9 w-9 rounded-xl bg-linear-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30 flex items-center justify-center group-hover:shadow-blue-500/50 transition-all duration-300">
    //         <Home className="w-5 h-5 text-white" />
    //       </div>
    //       <div className="flex flex-col">
    //         <span className="text-base font-bold tracking-tight text-slate-900">
    //           Patram
    //         </span>
    //         <span className="text-xs text-slate-500 font-medium">
    //           Certificate System
    //         </span>
    //       </div>
    //     </Link>

    //     <div className="relative flex items-center gap-3">
    //       {hasAdminSession && (
    //         <button
    //           onClick={handleAdminLogout}
    //           className="flex items-center gap-2 px-4 py-2 h-10 rounded-xl bg-linear-to-br from-red-50 to-red-100/50 hover:from-red-100 hover:to-red-100 text-red-600 font-medium text-sm transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20 border border-red-200/50 hover:border-red-300/50 active:scale-95"
    //         >
    //           <LogOut className="w-4 h-4" />
    //           <span>Logout</span>
    //         </button>
    //       )}
    //     </div>
    //   </div>
    // </header>
  );
}
