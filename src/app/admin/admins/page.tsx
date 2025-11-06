"use client";
import { useEffect, useState } from "react";
import type React from "react";

import { useRouter } from "next/navigation";
import { Trash2, Plus } from "lucide-react";
import AppShell from "@/components/AppShell";

type Allowed = {
  _id: string;
  email: string;
  status: string;
  isSuperAdmin?: boolean;
  createdBy?: string;
  createdAt?: string;
};

export default function AdminsPage() {
  const router = useRouter();
  const [admins, setAdmins] = useState<Allowed[]>([]);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("active");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setError("");
    try {
      const res = await fetch("/api/admin/allowlist", {
        credentials: "include",
      });
      if (res.status === 401 || res.status === 403) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setAdmins(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load admins");
    }
  };

  const createAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/allowlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, status, isSuperAdmin }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to add email");
      }
      setEmail("");
      setStatus("active");
      setIsSuperAdmin(false);
      await load();
    } catch (e: any) {
      setError(e?.message || "Failed to add email");
    } finally {
      setLoading(false);
    }
  };

  const deleteAdmin = async (email: string) => {
    if (!confirm(`Remove ${email} from admin allowlist?`)) return;
    try {
      const res = await fetch(
        `/api/admin/allowlist?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      if (!res.ok) throw new Error("Failed to remove email");
      await load();
    } catch (e: any) {
      alert(e?.message || "Failed to remove");
    }
  };

  return (
    <AppShell>
      {/* Background linear overlays */}
      <div className="absolute top-[10%] left-[5%] w-[300px] h-[300px] bg-sky-400/20 blur-3xl opacity-100 rounded-full z-0 pointer-events-none" />
      <div className="absolute bottom-[20%] right-[8%] w-[250px] h-[250px] bg-blue-400/25 blur-3xl opacity-100 rounded-full z-0 pointer-events-none" />

      <div className="space-y-8 relative z-10">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 font-cairo uppercase">
            Manage Admins
          </h1>
          <p className="mt-4 text-lg text-gray-700 font-poppins max-w-2xl mx-auto">
            Add emails that can sign in with Google (Privy) and access admin
            dashboard
          </p>
        </div>

        {/* Create Admin Section */}
        <div className="rounded-3xl bg-white/60 backdrop-blur-xl border-2 border-sky-100 p-8 transition-all duration-500 hover:shadow-2xl hover:shadow-sky-200/30">
          <div className="flex items-center gap-4 mb-8">
            <div className="rounded-full bg-linear-to-br from-[#28aeec] to-sky-400 p-4 shadow-lg">
              <Plus className="h-7 w-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 font-cairo uppercase">
                Add Admin Email
              </h2>
              <p className="text-base text-gray-700 mt-1 font-poppins">
                Grant admin access to new users
              </p>
            </div>
          </div>

          <form onSubmit={createAdmin} className="space-y-6 max-w-2xl">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 font-cairo uppercase">
                Email Address
              </label>
              <input
                type="email"
                placeholder="prof@example.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-14 rounded-xl border-2 border-sky-100 bg-white px-4 text-base outline-none transition-all focus:border-[#28aeec] focus:ring-4 focus:ring-sky-100/50 font-poppins"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6">
              <div className="flex-1">
                <label className="block text-sm font-bold text-gray-700 mb-2 font-cairo uppercase">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full h-14 rounded-xl border-2 border-sky-100 bg-white px-4 text-base outline-none transition-all focus:border-[#28aeec] focus:ring-4 focus:ring-sky-100/50 font-poppins"
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              <label className="flex items-center gap-3 h-14 px-4 rounded-xl border-2 border-sky-100 bg-white hover:bg-sky-50 transition-all cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSuperAdmin}
                  onChange={(e) => setIsSuperAdmin(e.target.checked)}
                  className="w-5 h-5 rounded border-sky-300 text-[#28aeec] focus:ring-[#28aeec]"
                />
                <span className="text-sm font-bold text-gray-700 font-cairo uppercase">
                  Super Admin
                </span>
              </label>
            </div>

            {error && (
              <div className="rounded-2xl bg-linear-to-br from-red-50 to-red-50/40 p-6 border-2 border-red-200/60 flex items-start gap-4">
                <div className="rounded-full bg-red-100 p-2 shrink-0">
                  <svg
                    className="w-6 h-6 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-red-900 font-cairo text-lg uppercase">
                    Error
                  </p>
                  <p className="text-base text-red-700 mt-2 font-poppins">
                    {error}
                  </p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full h-14 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 font-poppins text-lg uppercase ${
                loading
                  ? "bg-slate-300 cursor-not-allowed text-slate-600"
                  : "bg-linear-to-r from-[#28aeec] to-sky-400 text-white hover:shadow-xl hover:shadow-sky-200/50 hover:scale-105"
              }`}
            >
              <Plus className="h-6 w-6" />
              {loading ? "Adding..." : "Add Admin Email"}
            </button>
          </form>
        </div>

        {/* Admins List Section */}
        <div className="rounded-3xl bg-white/60 backdrop-blur-xl border-2 border-sky-100 p-8 transition-all duration-500 hover:shadow-2xl hover:shadow-sky-200/30">
          <div className="flex items-center gap-4 mb-8">
            <div className="rounded-full bg-linear-to-br from-slate-400 to-slate-500 p-4 shadow-lg">
              <svg
                className="h-7 w-7 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 font-cairo uppercase">
                Admin Emails
              </h2>
              <p className="text-base text-gray-700 mt-1 font-poppins">
                Manage admin access
              </p>
            </div>
          </div>

          {admins.length === 0 ? (
            <div className="rounded-2xl border-2 border-sky-100 bg-white/70 backdrop-blur-sm p-12 text-center">
              <div className="rounded-full bg-sky-100 w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="h-10 w-10 text-[#28aeec]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <p className="text-lg text-gray-700 font-poppins">
                No admins yet. Add an email to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {admins.map((a) => (
                <div
                  key={a._id}
                  className="rounded-2xl border-2 border-sky-100 bg-white/70 backdrop-blur-sm p-6 transition-all duration-300 hover:shadow-lg hover:shadow-sky-200/30 hover:border-[#28aeec]"
                >
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-lg font-bold text-gray-900 font-mono bg-sky-50 px-3 py-1.5 rounded-lg">
                          {a.email}
                        </p>
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold border-2 ${
                            a.status === "active"
                              ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                              : "bg-amber-100 text-amber-700 border-amber-200"
                          }`}
                        >
                          {a.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 font-poppins">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">Role:</span>
                          {a.isSuperAdmin ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-linear-to-r from-[#28aeec] to-sky-400 text-white border-2 border-sky-200 shadow-sm">
                              Super Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border-2 border-slate-200">
                              Admin
                            </span>
                          )}
                        </div>
                        {a.createdBy && (
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">Created By:</span>
                            <span>{a.createdBy}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      {!a.isSuperAdmin && (
                        <button
                          onClick={() => deleteAdmin(a.email)}
                          className="inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-linear-to-r from-red-500 to-red-600 text-white font-bold hover:shadow-xl hover:shadow-red-200/50 transition-all duration-300 font-poppins uppercase hover:scale-105"
                        >
                          <Trash2 className="w-5 h-5" />
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
