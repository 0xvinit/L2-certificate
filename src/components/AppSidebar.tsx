"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AppSidebar() {
  const pathname = usePathname();
  const items = [
    { href: "/admin/dashboard", label: "Dashboard" },
    { href: "/issue", label: "Issue Certificates" },
    { href: "/admin/programs", label: "Add Program" },
    { href: "/revoke", label: "Revoke Certificate" },
    { href: "/verify", label: "Verify" },
  ];
  return (
    <aside className="sidebar p-4">
      <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">App</div>
      <nav className="space-y-1">
        {items.map((it) => (
          <Link key={it.href} href={it.href} aria-current={pathname === it.href ? "page" : undefined}>
            {it.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}



