"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { TrendingUp, TrendingDown, Award, Users, BarChart3, AlertCircle, CheckCircle2, Clock } from "lucide-react"
import WalletConnection from "@/components/WalletConnection"
import AppShell from "@/components/AppShell"
import Sparkline from "@/components/Sparkline"
import BarChart from "@/components/BarChart"

export default function Dashboard() {
  const router = useRouter()
  const [admin, setAdmin] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [programsCount, setProgramsCount] = useState<number>(0)
  const [adminsCount, setAdminsCount] = useState<number>(0)
  const [dailyIssued, setDailyIssued] = useState<number[]>([])
  const [dailyRevoked, setDailyRevoked] = useState<number[]>([])

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" })
        if (!res.ok) {
          if (res.status === 401) {
            window.location.href = "/login"
            return
          }
        } else {
          const data = await res.json()
          setAdmin(data)
          try {
            const statsUrl = data.isSuperAdmin ? `/api/admin/stats` : `/api/admin/stats?adminId=${data.adminId}`
            const statsRes = await fetch(statsUrl, { credentials: "include" })
            if (statsRes.ok) {
              const s = await statsRes.json()
              setStats(s)
              const days = 7
              const base = new Date()
              base.setHours(0, 0, 0, 0)
              const byDayIssued: number[] = Array.from({ length: days }, () => 0)
              const byDayRevoked: number[] = Array.from({ length: days }, () => 0)
              if (Array.isArray(s.recent)) {
                s.recent.forEach((c: any) => {
                  const d = new Date(c.createdAt)
                  d.setHours(0, 0, 0, 0)
                  const diff = Math.floor((base.getTime() - d.getTime()) / (24 * 60 * 60 * 1000))
                  if (diff >= 0 && diff < days) {
                    byDayIssued[days - 1 - diff] += 1
                    if (c.revoked) byDayRevoked[days - 1 - diff] += 1
                  }
                })
              }
              setDailyIssued(byDayIssued)
              setDailyRevoked(byDayRevoked)
            }
            try {
              const progsUrl = data.isSuperAdmin ? `/api/programs` : `/api/programs?adminId=${data.adminId}`
              const progs = await fetch(progsUrl, { credentials: "include" })
              if (progs.ok) {
                const list = await progs.json()
                setProgramsCount(Array.isArray(list) ? list.length : 0)
              }
            } catch {}
            try {
              const admins = await fetch(`/api/admin/admins`, { credentials: "include" })
              if (admins.ok) {
                const list = await admins.json()
                setAdminsCount(Array.isArray(list) ? list.length : 1)
              } else {
                setAdminsCount(1)
              }
            } catch {
              setAdminsCount(1)
            }
          } catch {}
        }
      } catch (err) {
        console.error("Failed to load admin data:", err)
      }
    })()
  }, [router])

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
  }

  return (
    <AppShell>
      <div className="mb-12">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">Dashboard</h1>
            {admin && (
              <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                <span>
                  Welcome back, <span className="font-semibold text-slate-700">{admin.adminId}</span>
                </span>
                {admin.isSuperAdmin && (
                  <span className="ml-2 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600 ring-1 ring-blue-200/60">
                    <Award className="h-3.5 w-3.5" />
                    Super Admin
                  </span>
                )}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mb-12">
        <WalletConnection />
      </div>

      {stats && (
        <div className="mb-12">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Issued */}
            <div className="group relative rounded-2xl bg-gradient-to-br from-blue-50 via-white to-blue-50/40 p-6 transition-all duration-300 hover:shadow-lg border border-blue-100/40 backdrop-blur-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium text-slate-500 tracking-wide">Total Issued</p>
                  <p className="mt-3 text-3xl font-bold text-slate-900">{stats.total || 0}</p>
                </div>
                <div className="rounded-full bg-blue-100 p-2.5 text-blue-600 transition-transform duration-300 group-hover:scale-110">
                  <BarChart3 className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 h-0.5 w-full rounded-full bg-blue-100">
                <div className="h-full w-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500"></div>
              </div>
            </div>

            {/* Revoked */}
            <div className="group relative rounded-2xl bg-gradient-to-br from-red-50 via-white to-red-50/40 p-6 transition-all duration-300 hover:shadow-lg border border-red-100/40 backdrop-blur-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium text-slate-500 tracking-wide">Revoked</p>
                  <p className="mt-3 text-3xl font-bold text-red-600">{stats.revoked || 0}</p>
                </div>
                <div className="rounded-full bg-red-100 p-2.5 text-red-600 transition-transform duration-300 group-hover:scale-110">
                  <AlertCircle className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 h-0.5 w-full rounded-full bg-red-100">
                <div className="h-full w-full rounded-full bg-gradient-to-r from-red-400 to-red-600 transition-all duration-500"></div>
              </div>
            </div>

            {/* Active */}
            <div className="group relative rounded-2xl bg-gradient-to-br from-emerald-50 via-white to-emerald-50/40 p-6 transition-all duration-300 hover:shadow-lg border border-emerald-100/40 backdrop-blur-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium text-slate-500 tracking-wide">Active</p>
                  <p className="mt-3 text-3xl font-bold text-emerald-600">
                    {(stats.total || 0) - (stats.revoked || 0)}
                  </p>
                </div>
                <div className="rounded-full bg-emerald-100 p-2.5 text-emerald-600 transition-transform duration-300 group-hover:scale-110">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 h-0.5 w-full rounded-full bg-emerald-100">
                <div className="h-full w-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500"></div>
              </div>
            </div>

            {/* Programs */}
            <div className="group relative rounded-2xl bg-gradient-to-br from-amber-50 via-white to-amber-50/40 p-6 transition-all duration-300 hover:shadow-lg border border-amber-100/40 backdrop-blur-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium text-slate-500 tracking-wide">Programs</p>
                  <p className="mt-3 text-3xl font-bold text-amber-600">{programsCount}</p>
                </div>
                <div className="rounded-full bg-amber-100 p-2.5 text-amber-600 transition-transform duration-300 group-hover:scale-110">
                  <Award className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 h-0.5 w-full rounded-full bg-amber-100">
                <div className="h-full w-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-500"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {stats && (
        <div className="mb-12 grid gap-5 sm:grid-cols-3">
          {/* Admins */}
          <div className="rounded-2xl bg-gradient-to-br from-slate-50 via-white to-slate-50/40 p-6 transition-all duration-300 hover:shadow-lg border border-slate-100/40 backdrop-blur-sm">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-slate-500 tracking-wide">Admins</p>
                <p className="mt-3 text-3xl font-bold text-slate-900">{adminsCount}</p>
              </div>
              <div className="rounded-full bg-slate-100 p-2.5 text-slate-600">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Issued (7 days) */}
          <div className="rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-indigo-50/40 p-6 transition-all duration-300 hover:shadow-lg border border-indigo-100/40 backdrop-blur-sm">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-slate-500 tracking-wide">Issued (7 days)</p>
                <p className="mt-3 text-3xl font-bold text-indigo-600">
                  {Array.isArray(stats.recent)
                    ? stats.recent.filter(
                        (c: any) => Date.now() - new Date(c.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000,
                      ).length
                    : 0}
                </p>
              </div>
              <div className="rounded-full bg-indigo-100 p-2.5 text-indigo-600">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Revocation Rate */}
          <div className="rounded-2xl bg-gradient-to-br from-cyan-50 via-white to-cyan-50/40 p-6 transition-all duration-300 hover:shadow-lg border border-cyan-100/40 backdrop-blur-sm">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-slate-500 tracking-wide">Revocation Rate</p>
                <p className="mt-3 text-3xl font-bold text-cyan-600">
                  {stats.total ? Math.round(((stats.revoked || 0) / stats.total) * 100) : 0}%
                </p>
              </div>
              <div className="rounded-full bg-cyan-100 p-2.5 text-cyan-600">
                <TrendingDown className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>
      )}

      {(dailyIssued.length > 0 || dailyRevoked.length > 0) && (
        <div className="mb-12 grid gap-6 lg:grid-cols-2">
          {/* Issued Certificates Chart */}
          <div className="rounded-2xl bg-gradient-to-br from-slate-50 via-white to-slate-50/40 p-6 transition-all duration-300 hover:shadow-lg border border-slate-100/40 backdrop-blur-sm">
            <div className="flex items-start justify-between pb-4">
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900">Issued Certificates</h3>
                <p className="mt-1 text-xs text-slate-500">Last 7 days activity</p>
              </div>
              <div className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-600">
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
          <div className="rounded-2xl bg-gradient-to-br from-slate-50 via-white to-slate-50/40 p-6 transition-all duration-300 hover:shadow-lg border border-slate-100/40 backdrop-blur-sm">
            <div className="flex items-start justify-between pb-4">
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900">Revoked Certificates</h3>
                <p className="mt-1 text-xs text-slate-500">Last 7 days activity</p>
              </div>
              <div className="rounded-full bg-red-50 px-3 py-1 text-sm font-semibold text-red-600">
                {dailyRevoked.reduce((a, b) => a + b, 0)}
              </div>
            </div>
            <div className="mt-6">
              <Sparkline data={dailyRevoked} stroke="#BA1A1A" fill="rgba(186,26,26,0.18)" />
            </div>
            <div className="mt-6">
              <BarChart data={dailyRevoked} barColor="#BA1A1A" />
            </div>
          </div>
        </div>
      )}

      {stats && stats.recent && stats.recent.length > 0 && (
        <div className="rounded-2xl bg-gradient-to-br from-slate-50 via-white to-slate-50/40 p-6 transition-all duration-300 hover:shadow-lg border border-slate-100/40 backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between pb-4">
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900">Recent Certificates</h3>
              <p className="mt-1 text-xs text-slate-500">{stats.recent.length} recent issuances</p>
            </div>
            <Clock className="h-5 w-5 text-slate-400" />
          </div>
          <div className="space-y-2">
            {stats.recent.slice(0, 8).map((c: any) => (
              <div
                key={c._id}
                className="group flex items-center justify-between rounded-xl bg-white/40 px-4 py-3 transition-all duration-200 hover:bg-blue-50/50 border border-slate-100/40 hover:border-blue-200/40"
              >
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{c.studentName}</p>
                  <p className="mt-0.5 text-xs text-slate-500">ID: {c.studentId}</p>
                </div>
                <div className="flex items-center gap-3">
                  {c.revoked && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 ring-1 ring-red-200/60">
                      <AlertCircle className="h-3 w-3" />
                      Revoked
                    </span>
                  )}
                  <p className="text-right text-xs text-slate-500">{new Date(c.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </AppShell>
  )
}
