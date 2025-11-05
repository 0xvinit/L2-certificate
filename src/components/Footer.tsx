import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border/60 bg-white/60 backdrop-blur dark:bg-slate-900/40">
      <div className="container py-10 grid gap-8 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-accent/40 ring-1 ring-primary/30" />
            <span className="text-sm font-semibold">ChainGrad</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground max-w-sm">
            Securely issue, verify, and manage digital certificates for your institution.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold">Product</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link className="nav-link" href="/issue">Issue Certificates</Link></li>
            <li><Link className="nav-link" href="/verify">Verify Certificate</Link></li>
            <li><Link className="nav-link" href="/revoke">Revoke Certificate</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold">Admin</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link className="nav-link" href="/admin/dashboard">Dashboard</Link></li>
            <li><Link className="nav-link" href="/admin/programs">Programs</Link></li>
            <li><Link className="nav-link" href="/admin/admins">Admins</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="container py-6 text-xs text-muted-foreground flex items-center justify-between">
          <p>© {new Date().getFullYear()} UniCerti. All rights reserved.</p>
          <div className="flex gap-4">
            <Link className="nav-link" href="#">Privacy</Link>
            <Link className="nav-link" href="#">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}


