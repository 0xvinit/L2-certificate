"use client"
import { useEffect, useState } from "react"
import type React from "react"

import { useRouter } from "next/navigation"
import { Trash2, Plus } from "lucide-react"
import AppShell from "@/components/AppShell"

type Allowed = {
  _id: string;
  email: string;
  status: string;
  isSuperAdmin?: boolean;
  createdBy?: string;
  createdAt?: string;
};

export default function AdminsPage() {
  const router = useRouter()
  const [admins, setAdmins] = useState<Allowed[]>([])
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState("active")
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    setError("")
    try {
      const res = await fetch("/api/admin/allowlist", { credentials: "include" })
      if (res.status === 401 || res.status === 403) {
        router.push("/login")
        return
      }
      const data = await res.json()
      setAdmins(Array.isArray(data) ? data : [])
    } catch (e: any) {
      setError(e?.message || "Failed to load admins")
    }
  }

  const createAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/admin/allowlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, status, isSuperAdmin }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to add email")
      }
      setEmail("")
      setStatus("active")
      setIsSuperAdmin(false)
      await load()
    } catch (e: any) {
      setError(e?.message || "Failed to add email")
    } finally {
      setLoading(false)
    }
  }

  const deleteAdmin = async (email: string) => {
    if (!confirm(`Remove ${email} from admin allowlist?`)) return
    try {
      const res = await fetch(`/api/admin/allowlist?email=${encodeURIComponent(email)}`, {
        method: "DELETE",
        credentials: "include",
      })
      if (!res.ok) throw new Error("Failed to remove email")
      await load()
    } catch (e: any) {
      alert(e?.message || "Failed to remove")
    }
  }

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">Manage Admins</h1>
          <p className="text-lg text-slate-600">Add emails that can sign in with Google (Privy) and access admin dashboard</p>
        </div>

    

        {/* Create Admin Section */}
        <div className="rounded-2xl bg-gradient-to-br from-slate-50 via-white to-slate-50/40 p-8 transition-all duration-300 hover:shadow-lg border border-slate-100/40 backdrop-blur-sm">
          <h2 className="text-2xl font-semibold text-slate-900 mb-6 flex items-center gap-2">
            <Plus className="w-6 h-6 text-blue-600" />
            Add Admin Email
          </h2>

          <form onSubmit={createAdmin} className="space-y-5 max-w-lg">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
              <input
                type="email"
                placeholder="prof@example.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg bg-slate-50/50 border border-slate-200/60 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm font-medium"
              />
            </div>

            <div className="flex items-center gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="px-4 py-3 rounded-lg bg-slate-50/50 border border-slate-200/60 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm font-medium"
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              <label className="flex items-center gap-2 mt-8">
                <input
                  type="checkbox"
                  checked={isSuperAdmin}
                  onChange={(e) => setIsSuperAdmin(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-semibold text-slate-700">Super Admin</span>
              </label>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200 transform ${
                loading
                  ? "bg-slate-300 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-lg hover:scale-105 active:scale-95"
              }`}
            >
              {loading ? "Adding..." : "Add Admin Email"}
            </button>
          </form>
        </div>

        {/* Admins List Section */}
        <div className="rounded-2xl bg-gradient-to-br from-slate-50 via-white to-slate-50/40 p-8 transition-all duration-300 hover:shadow-lg border border-slate-100/40 backdrop-blur-sm">
          <h2 className="text-2xl font-semibold text-slate-900 mb-6">Admin Emails</h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200/60">
                  <th className="text-left px-6 py-4 font-semibold text-slate-700 text-sm">Email</th>
                  <th className="text-left px-6 py-4 font-semibold text-slate-700 text-sm">Status</th>
                  <th className="text-left px-6 py-4 font-semibold text-slate-700 text-sm">Role</th>
                  <th className="text-left px-6 py-4 font-semibold text-slate-700 text-sm">Created By</th>
                  <th className="text-left px-6 py-4 font-semibold text-slate-700 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((a) => (
                  <tr key={a._id} className="border-b border-slate-100/40 hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-4 text-slate-900 font-medium text-sm font-mono">{a.email}</td>
                    <td className="px-6 py-4 text-slate-600 text-sm">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        a.status === "active" 
                          ? "bg-emerald-100/60 text-emerald-700 border border-emerald-200/60"
                          : "bg-amber-100/60 text-amber-700 border border-amber-200/60"
                      }`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {a.isSuperAdmin ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 border border-blue-200/60">
                          Super Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100/60 text-slate-700 border border-slate-200/60">
                          Admin
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm">{a.createdBy || "-"}</td>
                    <td className="px-6 py-4">
                      {!a.isSuperAdmin && (
                        <button
                          onClick={() => deleteAdmin(a.email)}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50/60 text-red-600 hover:bg-red-100/80 transition-all duration-200 text-sm font-medium border border-red-200/40 hover:border-red-300/60 hover:shadow-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {admins.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-500 text-sm">No admins yet. Add an email to get started.</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
