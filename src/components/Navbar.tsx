"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useEffect, useState } from "react";

const links = [{ href: "/", label: "Home" }];

export default function Navbar() {
  const pathname = usePathname();
  const { authenticated, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const addr = wallets?.[0]?.address || "";
  const short = addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";
  const [menuOpen, setMenuOpen] = useState(false);
  const [hasAdminSession, setHasAdminSession] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        setHasAdminSession(res.ok);
      } catch {
        setHasAdminSession(false);
      }
    })();
  }, []);

  const handleAdminLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {}
    window.location.href = "/login";
  };
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-white/80 backdrop-blur dark:bg-slate-900/60">
      <div className="container h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-accent/40 ring-1 ring-primary/30" />
          <span className="text-base font-semibold tracking-tight">ChainGrad</span>
        </Link>
        {/* <nav className="hidden md:flex items-center gap-6">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`nav-link ${pathname === l.href ? "text-foreground" : ""}`}
            >
              {l.label}
            </Link>
          ))}
        </nav> */}
        <div className="relative flex items-center gap-3">
          {/* Wallet controls */}
          {!authenticated ? (
            <button onClick={login} className="btn btn-primary h-9 px-4">Connect Wallet</button>
          ) : (
            <>
              {addr && (
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  className="rounded-md border border-border bg-white px-2 py-1 text-xs font-mono text-foreground dark:bg-slate-900"
                >
                  {short}
                </button>
              )}
              {menuOpen && (
                <div className="absolute right-0 top-10 z-50 w-44 rounded-md border bg-white p-1 text-sm shadow-sm dark:bg-slate-900">
                  <button
                    className="w-full rounded px-2 py-1 text-left hover:bg-muted/60"
                    onClick={() => { setMenuOpen(false); logout(); }}
                  >
                    Disconnect Wallet
                  </button>
                </div>
              )}
            </>
          )}

          {/* Admin session logout shown only if admin session exists */}
          {hasAdminSession && (
            <button onClick={handleAdminLogout} className="btn btn-ghost h-9 px-4">Logout</button>
          )}
        </div>
      </div>
    </header>
  );
}


