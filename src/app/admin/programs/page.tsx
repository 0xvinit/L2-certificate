"use client"
import { useEffect, useState } from "react"
import type React from "react"

import { useRouter } from "next/navigation"
import { useWallets } from "@privy-io/react-auth"
import WalletConnection from "@/components/WalletConnection"
import AppShell from "@/components/AppShell"
import { Plus, Settings2, ToggleRight, ToggleLeft, AlertCircle } from "lucide-react"

type Program = {
  _id: string
  adminAddress: string
  name: string
  code: string
  startDate?: string
  endDate?: string
  isActive: boolean
  logoUrl?: string
  signatureUrl?: string
}

export default function ProgramsPage() {
  const router = useRouter()
  const { wallets } = useWallets()
  const [admin, setAdmin] = useState<any>(null)
  const [items, setItems] = useState<Program[]>([])
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [logoUrl, setLogoUrl] = useState("")
  const [signatureUrl, setSignatureUrl] = useState("")
  const [error, setError] = useState<string>("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    ;(async () => {
      const res = await fetch("/api/auth/me", { credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        setAdmin(data)
        if (data.adminId) {
          load(data.adminId.toLowerCase())
        }
      }
    })()
  }, [])

  const load = async (addr: string) => {
    const res = await fetch(`/api/programs?adminId=${addr}`, { credentials: "include" })
    const data = await res.json().catch(() => null)
    if (Array.isArray(data)) setItems(data)
    else if (data && Array.isArray(data.items)) setItems(data.items)
    else setItems([])
  }

  const addProgram = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    
    try {
      if (!admin?.adminId) {
        setError("Admin ID not found. Please refresh the page.")
        setLoading(false)
        return
      }

      // Get wallet address from connected wallets or use empty string
      const walletAddress = wallets.length > 0 ? wallets[0].address : (admin.walletAddress || "")

      const res = await fetch("/api/programs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          adminAddress: walletAddress,
          adminId: admin.adminId,
          name,
          code,
          startDate,
          endDate,
          logoUrl,
          signatureUrl,
        }),
      })

      const data = await res.json()
      
      if (!res.ok) {
        setError(data.error || "Failed to create program")
        setLoading(false)
        return
      }

      // Clear form
      setName("")
      setCode("")
      setStartDate("")
      setEndDate("")
      setLogoUrl("")
      setSignatureUrl("")
      
      // Reload programs list
      if (data && data._id) {
        await load(admin.adminId.toLowerCase())
      }
    } catch (err: any) {
      setError(err?.message || "Failed to create program")
    } finally {
      setLoading(false)
    }
  }

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch("/api/programs", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, isActive: !isActive }),
      })
      if (res.ok && admin?.adminId) {
        await load(admin.adminId.toLowerCase())
      }
    } catch (err) {
      console.error("Failed to toggle program status:", err)
    }
  }

  return (
    <AppShell>
      <div className="mb-12">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">Programs</h1>
          <p className="mt-2 text-slate-500">Manage your certificate programs</p>
        </div>
      </div>


      {/* Create Program Section */}
      <div className="mb-8 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-slate-50/40 p-8 transition-all duration-300 hover:shadow-lg border border-slate-100/40 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-full bg-blue-50 p-2.5">
            <Plus className="h-5 w-5 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900">Create New Program</h2>
        </div>

        <form onSubmit={addProgram} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Program Name</label>
              <input
                className="w-full h-11 rounded-xl border border-slate-200/80 bg-white/50 px-4 text-sm outline-none transition-all focus:border-blue-300 focus:ring-4 focus:ring-blue-100/50"
                placeholder="e.g., Python Basics"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Program Code</label>
              <input
                className="w-full h-11 rounded-xl border border-slate-200/80 bg-white/50 px-4 text-sm outline-none transition-all focus:border-blue-300 focus:ring-4 focus:ring-blue-100/50"
                placeholder="e.g., PYT-001"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Start Date</label>
              <input
                className="w-full h-11 rounded-xl border border-slate-200/80 bg-white/50 px-4 text-sm outline-none transition-all focus:border-blue-300 focus:ring-4 focus:ring-blue-100/50"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">End Date</label>
              <input
                className="w-full h-11 rounded-xl border border-slate-200/80 bg-white/50 px-4 text-sm outline-none transition-all focus:border-blue-300 focus:ring-4 focus:ring-blue-100/50"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Logo</label>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const f = e.target.files?.[0]
                  if (!f) return
                  const b = await f.arrayBuffer()
                  const base64 = btoa(String.fromCharCode(...new Uint8Array(b)))
                  const up = await fetch("/api/ipfs/upload", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ fileBase64: base64, filename: f.name }),
                  })
                  const d = await up.json()
                  if (up.ok) setLogoUrl(d.uri)
                }}
                className="w-full h-11 rounded-xl border border-slate-200/80 bg-white/50 px-4 text-xs outline-none transition-all focus:border-blue-300 focus:ring-4 focus:ring-blue-100/50"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Signature</label>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const f = e.target.files?.[0]
                  if (!f) return
                  const b = await f.arrayBuffer()
                  const base64 = btoa(String.fromCharCode(...new Uint8Array(b)))
                  const up = await fetch("/api/ipfs/upload", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ fileBase64: base64, filename: f.name }),
                  })
                  const d = await up.json()
                  if (up.ok) setSignatureUrl(d.uri)
                }}
                className="w-full h-11 rounded-xl border border-slate-200/80 bg-white/50 px-4 text-xs outline-none transition-all focus:border-blue-300 focus:ring-4 focus:ring-blue-100/50"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-xl bg-gradient-to-br from-red-50 to-red-50/40 p-4 border border-red-200/60 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* Preview uploaded files */}
          {(logoUrl || signatureUrl) && (
            <div className="flex items-center gap-4 pt-2 pb-4 border-t border-slate-200/40">
              {logoUrl && (
                <div className="flex flex-col items-center gap-2">
                  <img
                    alt="logo"
                    className="h-12 w-12 rounded-lg border border-slate-200 object-contain bg-white p-1"
                    src={
                      logoUrl.startsWith("ipfs://")
                        ? (process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://ipfs.io/ipfs/") +
                          logoUrl.replace("ipfs://", "")
                        : logoUrl
                    }
                  />
                  <p className="text-xs text-slate-500">Logo</p>
                </div>
              )}
              {signatureUrl && (
                <div className="flex flex-col items-center gap-2">
                  <img
                    alt="signature"
                    className="h-12 rounded-lg border border-slate-200 object-contain bg-white p-1"
                    src={
                      signatureUrl.startsWith("ipfs://")
                        ? (process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://ipfs.io/ipfs/") +
                          signatureUrl.replace("ipfs://", "")
                        : signatureUrl
                    }
                  />
                  <p className="text-xs text-slate-500">Signature</p>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !admin?.adminId}
            className="w-full h-11 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-blue-200/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {loading ? "Adding Program..." : "Add Program"}
          </button>
        </form>
      </div>

      {/* Programs List */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-50 via-white to-slate-50/40 p-8 transition-all duration-300 hover:shadow-lg border border-slate-100/40 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-full bg-slate-100 p-2.5">
            <Settings2 className="h-5 w-5 text-slate-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900">Your Programs</h2>
        </div>

        {items.length === 0 ? (
          <div className="rounded-xl border border-slate-200/40 bg-white/30 p-8 text-center">
            <p className="text-slate-500">No programs yet. Create your first program above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="space-y-3">
              {items.map((p) => (
                <div
                  key={p._id}
                  className="group rounded-xl border border-slate-200/40 bg-white/40 p-4 transition-all duration-300 hover:bg-blue-50/40 hover:border-blue-200/40"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-slate-900">{p.name}</h3>
                        <code className="text-xs font-mono text-slate-500 bg-slate-100/50 px-2.5 py-1 rounded-lg">
                          {p.code}
                        </code>
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                        {p.startDate && <p>Start: {new Date(p.startDate).toLocaleDateString()}</p>}
                        {p.endDate && <p>End: {new Date(p.endDate).toLocaleDateString()}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${p.isActive ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60" : "bg-slate-100 text-slate-600 ring-1 ring-slate-200/60"}`}
                      >
                        {p.isActive ? "Active" : "Inactive"}
                      </div>
                      <button
                        onClick={() => toggleActive(p._id, p.isActive)}
                        className="rounded-lg px-3 py-2 transition-all duration-200 hover:scale-105"
                      >
                        {p.isActive ? (
                          <ToggleRight className="h-5 w-5 text-emerald-600" />
                        ) : (
                          <ToggleLeft className="h-5 w-5 text-slate-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
