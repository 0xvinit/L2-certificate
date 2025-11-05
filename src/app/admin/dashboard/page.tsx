"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import WalletConnection from "@/components/WalletConnection";
import AppShell from "@/components/AppShell";
import Sparkline from "@/components/Sparkline";
import BarChart from "@/components/BarChart";

export default function Dashboard() {
  const router = useRouter();
  const [admin, setAdmin] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [programsCount, setProgramsCount] = useState<number>(0);
  const [adminsCount, setAdminsCount] = useState<number>(0);
  const [dailyIssued, setDailyIssued] = useState<number[]>([]);
  const [dailyRevoked, setDailyRevoked] = useState<number[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!res.ok) {
          if (res.status === 401) {
            window.location.href = "/login";
            return;
          }
        } else {
          const data = await res.json();
          setAdmin(data);
          if (data.walletAddress) {
            try {
              const statsUrl = data.isSuperAdmin
                ? `/api/admin/stats`
                : `/api/admin/stats?adminId=${data.adminId}`;
              const statsRes = await fetch(statsUrl, { credentials: "include" });
              if (statsRes.ok) {
                const s = await statsRes.json();
                setStats(s);
                // derive last 7 days from recent
                const days = 7;
                const base = new Date();
                base.setHours(0,0,0,0);
                const byDayIssued: number[] = Array.from({ length: days }, () => 0);
                const byDayRevoked: number[] = Array.from({ length: days }, () => 0);
                if (Array.isArray(s.recent)) {
                  s.recent.forEach((c: any) => {
                    const d = new Date(c.createdAt);
                    d.setHours(0,0,0,0);
                    const diff = Math.floor((base.getTime() - d.getTime()) / (24*60*60*1000));
                    if (diff >= 0 && diff < days) {
                      byDayIssued[days - 1 - diff] += 1;
                      if (c.revoked) byDayRevoked[days - 1 - diff] += 1;
                    }
                  });
                }
                setDailyIssued(byDayIssued);
                setDailyRevoked(byDayRevoked);
              }
              // Load programs count
              try {
                const progsUrl = data.isSuperAdmin
                  ? `/api/programs`
                  : `/api/programs?adminId=${data.adminId}`;
                const progs = await fetch(progsUrl, { credentials: "include" });
                if (progs.ok) {
                  const list = await progs.json();
                  setProgramsCount(Array.isArray(list) ? list.length : 0);
                }
              } catch {}
              // Load admins count (super admins might see all; otherwise just 1)
              try {
                const admins = await fetch(`/api/admin/admins`, { credentials: "include" });
                if (admins.ok) {
                  const list = await admins.json();
                  setAdminsCount(Array.isArray(list) ? list.length : 1);
                } else {
                  setAdminsCount(1);
                }
              } catch {
                setAdminsCount(1);
              }
            } catch {}
          }
        }
      } catch (err) {
        console.error("Failed to load admin data:", err);
      }
    })();
  }, [router]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <AppShell>
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
            {admin && (
              <p className="mt-1 text-sm text-muted-foreground">
                {admin.adminId}
                {admin.isSuperAdmin && (
                  <span className="ml-2 rounded-md bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">Super Admin</span>
                )}
              </p>
            )}
          </div>
          {/* Logout moved to Navbar via Privy */}
        </div>
      </div>

      <div className="mt-6">
        <WalletConnection />
      </div>

      {stats && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card p-5">
            <div className="text-xs text-muted-foreground">Total Issued</div>
            <div className="mt-1 text-3xl font-bold">{stats.total || 0}</div>
          </div>
          <div className="card p-5">
            <div className="text-xs text-muted-foreground">Revoked</div>
            <div className="mt-1 text-3xl font-bold text-red-600">{stats.revoked || 0}</div>
          </div>
          <div className="card p-5">
            <div className="text-xs text-muted-foreground">Active</div>
            <div className="mt-1 text-3xl font-bold text-emerald-600">{(stats.total || 0) - (stats.revoked || 0)}</div>
          </div>
          <div className="card p-5">
            <div className="text-xs text-muted-foreground">Programs</div>
            <div className="mt-1 text-3xl font-bold">{programsCount}</div>
          </div>
          <div className="card p-5">
            <div className="text-xs text-muted-foreground">Admins</div>
            <div className="mt-1 text-3xl font-bold">{adminsCount}</div>
          </div>
          <div className="card p-5">
            <div className="text-xs text-muted-foreground">Issued (7 days)</div>
            <div className="mt-1 text-3xl font-bold">{Array.isArray(stats.recent) ? stats.recent.filter((c: any) => Date.now() - new Date(c.createdAt).getTime() < 7*24*60*60*1000).length : 0}</div>
          </div>
          <div className="card p-5">
            <div className="text-xs text-muted-foreground">Revocation Rate</div>
            <div className="mt-1 text-3xl font-bold">{(stats.total ? Math.round(((stats.revoked || 0) / stats.total) * 100) : 0)}%</div>
          </div>
        </div>
      )}

      {(dailyIssued.length > 0 || dailyRevoked.length > 0) && (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="card p-5">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-semibold">Issued — last 7 days</div>
              <div className="text-xs text-muted-foreground">Total {dailyIssued.reduce((a,b)=>a+b,0)}</div>
            </div>
            <Sparkline data={dailyIssued} />
            <div className="mt-3">
              <BarChart data={dailyIssued} />
            </div>
          </div>
          <div className="card p-5">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-semibold">Revoked — last 7 days</div>
              <div className="text-xs text-muted-foreground">Total {dailyRevoked.reduce((a,b)=>a+b,0)}</div>
            </div>
            <Sparkline data={dailyRevoked} stroke="#BA1A1A" fill="rgba(186,26,26,0.18)" />
            <div className="mt-3">
              <BarChart data={dailyRevoked} barColor="#BA1A1A" />
            </div>
          </div>
        </div>
      )}

      {stats && stats.recent && stats.recent.length > 0 && (
        <div className="mt-6 card p-6">
          <h3 className="text-lg font-semibold">Recent Certificates</h3>
          <div className="mt-3 flex flex-col gap-2">
            {stats.recent.map((c: any) => (
              <div key={c._id} className="flex items-center justify-between rounded-md border bg-muted px-3 py-2">
                <div>
                  <div className="font-semibold">{c.studentName}</div>
                  <div className="text-xs text-muted-foreground">ID: {c.studentId}</div>
                </div>
                <div className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </AppShell>
  );
}


