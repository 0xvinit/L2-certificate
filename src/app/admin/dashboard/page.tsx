"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  TrendingDown,
  Award,
  Users,
  BarChart3,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
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
          try {
            const statsUrl = data.isSuperAdmin
              ? `/api/admin/stats`
              : `/api/admin/stats?adminId=${data.adminId}`;
            const statsRes = await fetch(statsUrl, { credentials: "include" });
            if (statsRes.ok) {
              const s = await statsRes.json();
              setStats(s);
              const days = 7;
              const base = new Date();
              base.setHours(0, 0, 0, 0);
              const byDayIssued: number[] = Array.from(
                { length: days },
                () => 0
              );
              const byDayRevoked: number[] = Array.from(
                { length: days },
                () => 0
              );
              if (Array.isArray(s.recent)) {
                s.recent.forEach((c: any) => {
                  const d = new Date(c.createdAt);
                  d.setHours(0, 0, 0, 0);
                  const diff = Math.floor(
                    (base.getTime() - d.getTime()) / (24 * 60 * 60 * 1000)
                  );
                  if (diff >= 0 && diff < days) {
                    byDayIssued[days - 1 - diff] += 1;
                    if (c.revoked) byDayRevoked[days - 1 - diff] += 1;
                  }
                });
              }
              setDailyIssued(byDayIssued);
              setDailyRevoked(byDayRevoked);
            }
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
            try {
              const admins = await fetch(`/api/admin/admins`, {
                credentials: "include",
              });
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
      {/* Background linear overlays */}
      <div className="absolute top-[10%] left-[5%] w-[300px] h-[300px] bg-sky-400/20 blur-3xl opacity-100 rounded-full z-0 pointer-events-none" />
      <div className="absolute bottom-[20%] right-[8%] w-[250px] h-[250px] bg-blue-400/25 blur-3xl opacity-100 rounded-full z-0 pointer-events-none" />

      <div className="mb-12 relative z-10">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 font-cairo uppercase">
              Dashboard
            </h1>
            {admin && (
              <p className="mt-4 flex items-center gap-3 text-base font-poppins">
                <span className="text-gray-700">
                  Welcome back,{" "}
                  <span className="font-semibold text-gray-900">
                    {admin.adminId}
                  </span>
                </span>
                {admin.isSuperAdmin && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-[#28aeec] to-sky-400 px-4 py-1.5 text-sm font-bold text-white shadow-lg">
                    <Award className="h-4 w-4" />
                    Super Admin
                  </span>
                )}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mb-12 relative z-10">
        <div className="rounded-3xl bg-white/60 backdrop-blur-xl border-2 border-sky-100 p-6 transition-all duration-500 hover:shadow-2xl hover:shadow-sky-200/30">
          <WalletConnection />
        </div>
      </div>

      {stats && (
        <div className="mb-12 relative z-10">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Issued */}
            <div className="group relative rounded-3xl bg-white/60 backdrop-blur-xl border-2 border-sky-100 p-6 transition-all duration-500 hover:shadow-2xl hover:shadow-sky-200/30 hover:border-[#28aeec]">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-600 tracking-wide font-cairo uppercase">
                    Total Issued
                  </p>
                  <p className="mt-4 text-4xl font-bold text-gray-900 font-cairo">
                    {stats.total || 0}
                  </p>
                </div>
                <div className="rounded-full bg-linear-to-br from-[#28aeec] to-sky-400 p-3 text-white shadow-lg transition-transform duration-300 group-hover:scale-110">
                  <BarChart3 className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-5 h-1 w-full rounded-full bg-sky-100">
                <div className="h-full w-full rounded-full bg-linear-to-r from-[#28aeec] to-sky-400 transition-all duration-500"></div>
              </div>
            </div>

            {/* Revoked */}
            <div className="group relative rounded-3xl bg-white/60 backdrop-blur-xl border-2 border-sky-100 p-6 transition-all duration-500 hover:shadow-2xl hover:shadow-sky-200/30 hover:border-red-400">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-600 tracking-wide font-cairo uppercase">
                    Revoked
                  </p>
                  <p className="mt-4 text-4xl font-bold text-red-600 font-cairo">
                    {stats.revoked || 0}
                  </p>
                </div>
                <div className="rounded-full bg-linear-to-br from-red-400 to-red-500 p-3 text-white shadow-lg transition-transform duration-300 group-hover:scale-110">
                  <AlertCircle className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-5 h-1 w-full rounded-full bg-red-100">
                <div className="h-full w-full rounded-full bg-linear-to-r from-red-400 to-red-600 transition-all duration-500"></div>
              </div>
            </div>

            {/* Active */}
            <div className="group relative rounded-3xl bg-white/60 backdrop-blur-xl border-2 border-sky-100 p-6 transition-all duration-500 hover:shadow-2xl hover:shadow-sky-200/30 hover:border-emerald-400">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-600 tracking-wide font-cairo uppercase">
                    Active
                  </p>
                  <p className="mt-4 text-4xl font-bold text-emerald-600 font-cairo">
                    {(stats.total || 0) - (stats.revoked || 0)}
                  </p>
                </div>
                <div className="rounded-full bg-linear-to-br from-emerald-400 to-emerald-500 p-3 text-white shadow-lg transition-transform duration-300 group-hover:scale-110">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-5 h-1 w-full rounded-full bg-emerald-100">
                <div className="h-full w-full rounded-full bg-linear-to-r from-emerald-400 to-emerald-600 transition-all duration-500"></div>
              </div>
            </div>

            {/* Programs */}
            <div className="group relative rounded-3xl bg-white/60 backdrop-blur-xl border-2 border-sky-100 p-6 transition-all duration-500 hover:shadow-2xl hover:shadow-sky-200/30 hover:border-amber-400">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-600 tracking-wide font-cairo uppercase">
                    Programs
                  </p>
                  <p className="mt-4 text-4xl font-bold text-amber-600 font-cairo">
                    {programsCount}
                  </p>
                </div>
                <div className="rounded-full bg-linear-to-br from-amber-400 to-amber-500 p-3 text-white shadow-lg transition-transform duration-300 group-hover:scale-110">
                  <Award className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-5 h-1 w-full rounded-full bg-amber-100">
                <div className="h-full w-full rounded-full bg-linear-to-r from-amber-400 to-amber-600 transition-all duration-500"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {stats && (
        <div className="mb-12 grid gap-6 sm:grid-cols-3 relative z-10">
          {/* Admins */}
          <div className="group relative rounded-3xl bg-white/60 backdrop-blur-xl border-2 border-sky-100 p-6 transition-all duration-500 hover:shadow-2xl hover:shadow-sky-200/30 hover:border-slate-400">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-600 tracking-wide font-cairo uppercase">
                  Admins
                </p>
                <p className="mt-4 text-4xl font-bold text-slate-900 font-cairo">
                  {adminsCount}
                </p>
              </div>
              <div className="rounded-full bg-linear-to-br from-slate-400 to-slate-500 p-3 text-white shadow-lg transition-transform duration-300 group-hover:scale-110">
                <Users className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-5 h-1 w-full rounded-full bg-slate-100">
              <div className="h-full w-full rounded-full bg-linear-to-r from-slate-400 to-slate-600 transition-all duration-500"></div>
            </div>
          </div>

          {/* Issued (7 days) */}
          <div className="group relative rounded-3xl bg-white/60 backdrop-blur-xl border-2 border-sky-100 p-6 transition-all duration-500 hover:shadow-2xl hover:shadow-sky-200/30 hover:border-indigo-400">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-600 tracking-wide font-cairo uppercase">
                  Issued (7 days)
                </p>
                <p className="mt-4 text-4xl font-bold text-indigo-600 font-cairo">
                  {Array.isArray(stats.recent)
                    ? stats.recent.filter(
                        (c: any) =>
                          Date.now() - new Date(c.createdAt).getTime() <
                          7 * 24 * 60 * 60 * 1000
                      ).length
                    : 0}
                </p>
              </div>
              <div className="rounded-full bg-linear-to-br from-indigo-400 to-indigo-500 p-3 text-white shadow-lg transition-transform duration-300 group-hover:scale-110">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-5 h-1 w-full rounded-full bg-indigo-100">
              <div className="h-full w-full rounded-full bg-linear-to-r from-indigo-400 to-indigo-600 transition-all duration-500"></div>
            </div>
          </div>

          {/* Revocation Rate */}
          <div className="group relative rounded-3xl bg-white/60 backdrop-blur-xl border-2 border-sky-100 p-6 transition-all duration-500 hover:shadow-2xl hover:shadow-sky-200/30 hover:border-cyan-400">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-600 tracking-wide font-cairo uppercase">
                  Revocation Rate
                </p>
                <p className="mt-4 text-4xl font-bold text-cyan-600 font-cairo">
                  {stats.total
                    ? Math.round(((stats.revoked || 0) / stats.total) * 100)
                    : 0}
                  %
                </p>
              </div>
              <div className="rounded-full bg-linear-to-br from-cyan-400 to-cyan-500 p-3 text-white shadow-lg transition-transform duration-300 group-hover:scale-110">
                <TrendingDown className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-5 h-1 w-full rounded-full bg-cyan-100">
              <div className="h-full w-full rounded-full bg-linear-to-r from-cyan-400 to-cyan-600 transition-all duration-500"></div>
            </div>
          </div>
        </div>
      )}

      {(dailyIssued.length > 0 || dailyRevoked.length > 0) && (
        <div className="mb-12 grid gap-6 lg:grid-cols-2 relative z-10">
          {/* Issued Certificates Chart */}
          <div className="rounded-3xl bg-white/60 backdrop-blur-xl border-2 border-sky-100 p-8 transition-all duration-500 hover:shadow-2xl hover:shadow-sky-200/30">
            <div className="flex items-start justify-between pb-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 font-cairo uppercase">
                  Issued Certificates
                </h3>
                <p className="mt-2 text-sm text-gray-600 font-poppins">
                  Last 7 days activity
                </p>
              </div>
              <div className="rounded-full bg-linear-to-r from-[#28aeec] to-sky-400 px-4 py-2 text-base font-bold text-white shadow-lg">
                {dailyIssued.reduce((a, b) => a + b, 0)}
              </div>
            </div>
            <div className="mt-6">
              <Sparkline data={dailyIssued} />
            </div>
            <div className="mt-6">
              <BarChart data={dailyIssued} />
            </div>
          </div>

          {/* Revoked Certificates Chart */}
          <div className="rounded-3xl bg-white/60 backdrop-blur-xl border-2 border-sky-100 p-8 transition-all duration-500 hover:shadow-2xl hover:shadow-sky-200/30">
            <div className="flex items-start justify-between pb-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 font-cairo uppercase">
                  Revoked Certificates
                </h3>
                <p className="mt-2 text-sm text-gray-600 font-poppins">
                  Last 7 days activity
                </p>
              </div>
              <div className="rounded-full bg-linear-to-r from-red-500 to-red-600 px-4 py-2 text-base font-bold text-white shadow-lg">
                {dailyRevoked.reduce((a, b) => a + b, 0)}
              </div>
            </div>
            <div className="mt-6">
              <Sparkline
                data={dailyRevoked}
                stroke="#BA1A1A"
                fill="rgba(186,26,26,0.18)"
              />
            </div>
            <div className="mt-6">
              <BarChart data={dailyRevoked} barColor="#BA1A1A" />
            </div>
          </div>
        </div>
      )}

      {stats && stats.recent && stats.recent.length > 0 && (
        <div className="rounded-3xl bg-white/60 backdrop-blur-xl border-2 border-sky-100 p-8 transition-all duration-500 hover:shadow-2xl hover:shadow-sky-200/30 relative z-10">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 font-cairo uppercase">
                Recent Certificates
              </h3>
              <p className="mt-2 text-sm text-gray-600 font-poppins">
                {stats.recent.length} recent issuances
              </p>
            </div>
            <div className="rounded-full bg-sky-100 p-3">
              <Clock className="h-6 w-6 text-[#28aeec]" />
            </div>
          </div>
          <div className="space-y-3">
            {stats.recent.slice(0, 8).map((c: any) => (
              <div
                key={c._id}
                className="group flex items-center justify-between rounded-2xl bg-white/70 backdrop-blur-sm px-5 py-4 transition-all duration-300 hover:shadow-lg hover:shadow-sky-200/30 border-2 border-sky-100 hover:border-[#28aeec]"
              >
                <div className="flex-1">
                  <p className="font-bold text-gray-900 font-poppins">
                    {c.studentName}
                  </p>
                  <p className="mt-1 text-sm text-gray-600 font-poppins">
                    ID: {c.studentId}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {c.revoked && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1.5 text-sm font-bold text-red-600 border-2 border-red-200">
                      <AlertCircle className="h-4 w-4" />
                      Revoked
                    </span>
                  )}
                  <p className="text-right text-sm text-gray-600 font-poppins">
                    {new Date(c.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </AppShell>
  );
}
