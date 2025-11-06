"use client";
import { useEffect, useState } from "react";
import type React from "react";

import { useRouter } from "next/navigation";
import WalletConnection from "@/components/WalletConnection";
import AppShell from "@/components/AppShell";
import { Plus, Settings2, ToggleRight, ToggleLeft } from "lucide-react";

type Program = {
  _id: string;
  adminAddress: string;
  name: string;
  code: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  logoUrl?: string;
  signatureUrl?: string;
};

export default function ProgramsPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<any>(null);
  const [items, setItems] = useState<Program[]>([]);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [signatureUrl, setSignatureUrl] = useState("");

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setAdmin(data);
        if (data.adminId) {
          load(data.adminId.toLowerCase());
        }
      }
    })();
  }, []);

  const load = async (addr: string) => {
    const res = await fetch(`/api/programs?adminId=${addr}`, {
      credentials: "include",
    });
    const data = await res.json().catch(() => null);
    if (Array.isArray(data)) setItems(data);
    else if (data && Array.isArray(data.items)) setItems(data.items);
    else setItems([]);
  };

  const addProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admin?.walletAddress || !admin?.adminId) return;
    const res = await fetch("/api/programs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        adminAddress: admin.walletAddress,
        adminId: admin.adminId,
        name,
        code,
        startDate,
        endDate,
        logoUrl,
        signatureUrl,
      }),
    });
    const data = await res.json();
    setName("");
    setCode("");
    setStartDate("");
    setEndDate("");
    setLogoUrl("");
    setSignatureUrl("");
    if (data && data._id) load(admin.walletAddress.toLowerCase());
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    await fetch("/api/programs", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id, isActive: !isActive }),
    });
    if (admin?.walletAddress) load(admin.walletAddress.toLowerCase());
  };

  return (
    <AppShell>
      {/* Background linear overlays */}
      <div className="absolute top-[10%] left-[5%] w-[300px] h-[300px] bg-sky-400/20 blur-3xl opacity-100 rounded-full z-0 pointer-events-none" />
      <div className="absolute bottom-[20%] right-[8%] w-[250px] h-[250px] bg-blue-400/25 blur-3xl opacity-100 rounded-full z-0 pointer-events-none" />

      <div className="mb-12 relative z-10">
        <div className="text-center">
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 font-cairo uppercase">
            Programs
          </h1>
          <p className="mt-4 text-lg text-gray-700 font-poppins max-w-2xl mx-auto">
            Create and manage your certificate programs
          </p>
        </div>
      </div>

      {/* Create Program Section */}
      <div className="mb-8 rounded-3xl bg-white/60 backdrop-blur-xl border-2 border-sky-100 p-8 transition-all duration-500 hover:shadow-2xl hover:shadow-sky-200/30 relative z-10">
        <div className="flex items-center gap-4 mb-8">
          <div className="rounded-full bg-linear-to-br from-[#28aeec] to-sky-400 p-4 shadow-lg">
            <Plus className="h-7 w-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 font-cairo uppercase">
              Create New Program
            </h2>
            <p className="text-base text-gray-700 mt-1 font-poppins">
              Add a new certificate program
            </p>
          </div>
        </div>

        <form onSubmit={addProgram} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 font-cairo uppercase">
                Program Name
              </label>
              <input
                className="w-full h-14 rounded-xl border-2 border-sky-100 bg-white px-4 text-base outline-none transition-all focus:border-[#28aeec] focus:ring-4 focus:ring-sky-100/50 font-poppins"
                placeholder="e.g., Python Basics"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 font-cairo uppercase">
                Program Code
              </label>
              <input
                className="w-full h-14 rounded-xl border-2 border-sky-100 bg-white px-4 text-base outline-none transition-all focus:border-[#28aeec] focus:ring-4 focus:ring-sky-100/50 font-poppins"
                placeholder="e.g., PYT-001"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 font-cairo uppercase">
                Start Date
              </label>
              <input
                className="w-full h-14 rounded-xl border-2 border-sky-100 bg-white px-4 text-base outline-none transition-all focus:border-[#28aeec] focus:ring-4 focus:ring-sky-100/50 font-poppins"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 font-cairo uppercase">
                End Date
              </label>
              <input
                className="w-full h-14 rounded-xl border-2 border-sky-100 bg-white px-4 text-base outline-none transition-all focus:border-[#28aeec] focus:ring-4 focus:ring-sky-100/50 font-poppins"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 font-cairo uppercase">
                Logo
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const b = await f.arrayBuffer();
                  const base64 = btoa(
                    String.fromCharCode(...new Uint8Array(b))
                  );
                  const up = await fetch("/api/ipfs/upload", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({
                      fileBase64: base64,
                      filename: f.name,
                    }),
                  });
                  const d = await up.json();
                  if (up.ok) setLogoUrl(d.uri);
                }}
                className="w-full h-14 rounded-xl border-2 border-sky-100 bg-white px-3 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-linear-to-r file:from-[#28aeec] file:to-sky-400 file:px-5 file:py-2.5 file:text-xs file:font-semibold file:text-white hover:file:shadow-lg transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 font-cairo uppercase">
                Signature
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const b = await f.arrayBuffer();
                  const base64 = btoa(
                    String.fromCharCode(...new Uint8Array(b))
                  );
                  const up = await fetch("/api/ipfs/upload", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({
                      fileBase64: base64,
                      filename: f.name,
                    }),
                  });
                  const d = await up.json();
                  if (up.ok) setSignatureUrl(d.uri);
                }}
                className="w-full h-14 rounded-xl border-2 border-sky-100 bg-white px-3 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-linear-to-r file:from-[#28aeec] file:to-sky-400 file:px-5 file:py-2.5 file:text-xs file:font-semibold file:text-white hover:file:shadow-lg transition-all"
              />
            </div>
          </div>

          {/* Preview uploaded files */}
          {(logoUrl || signatureUrl) && (
            <div className="flex items-center gap-4 pt-4 pb-2 border-t-2 border-sky-100">
              {logoUrl && (
                <div className="flex flex-col items-center gap-2">
                  <img
                    alt="logo"
                    className="h-16 w-16 rounded-xl border-2 border-sky-100 object-contain bg-white p-2 shadow-sm"
                    src={
                      logoUrl.startsWith("ipfs://")
                        ? (process.env.NEXT_PUBLIC_IPFS_GATEWAY ||
                            "https://ipfs.io/ipfs/") +
                          logoUrl.replace("ipfs://", "")
                        : logoUrl
                    }
                  />
                  <p className="text-xs text-gray-600 font-poppins font-semibold">
                    Logo
                  </p>
                </div>
              )}
              {signatureUrl && (
                <div className="flex flex-col items-center gap-2">
                  <img
                    alt="signature"
                    className="h-16 rounded-xl border-2 border-sky-100 object-contain bg-white p-2 shadow-sm"
                    src={
                      signatureUrl.startsWith("ipfs://")
                        ? (process.env.NEXT_PUBLIC_IPFS_GATEWAY ||
                            "https://ipfs.io/ipfs/") +
                          signatureUrl.replace("ipfs://", "")
                        : signatureUrl
                    }
                  />
                  <p className="text-xs text-gray-600 font-poppins font-semibold">
                    Signature
                  </p>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={!admin?.walletAddress}
            className="w-full h-14 rounded-xl bg-linear-to-r from-[#28aeec] to-sky-400 text-white font-bold transition-all duration-300 hover:shadow-xl hover:shadow-sky-200/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-poppins text-lg uppercase hover:scale-105"
          >
            <Plus className="h-6 w-6" />
            Add Program
          </button>
        </form>
      </div>

      {/* Programs List */}
      <div className="rounded-3xl bg-white/60 backdrop-blur-xl border-2 border-sky-100 p-8 transition-all duration-500 hover:shadow-2xl hover:shadow-sky-200/30 relative z-10">
        <div className="flex items-center gap-4 mb-8">
          <div className="rounded-full bg-linear-to-br from-slate-400 to-slate-500 p-4 shadow-lg">
            <Settings2 className="h-7 w-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 font-cairo uppercase">
              Your Programs
            </h2>
            <p className="text-base text-gray-700 mt-1 font-poppins">
              Manage existing programs
            </p>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="rounded-2xl border-2 border-sky-100 bg-white/70 backdrop-blur-sm p-12 text-center">
            <div className="rounded-full bg-sky-100 w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <Settings2 className="h-10 w-10 text-[#28aeec]" />
            </div>
            <p className="text-lg text-gray-700 font-poppins">
              No programs yet. Create your first program above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="space-y-4">
              {items.map((p) => (
                <div
                  key={p._id}
                  className="group rounded-2xl border-2 border-sky-100 bg-white/70 backdrop-blur-sm p-6 transition-all duration-300 hover:shadow-lg hover:shadow-sky-200/30 hover:border-[#28aeec]"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <h3 className="text-xl font-bold text-gray-900 font-cairo uppercase">
                          {p.name}
                        </h3>
                        <code className="text-sm font-mono text-gray-700 bg-sky-100 px-3 py-1.5 rounded-lg font-semibold">
                          {p.code}
                        </code>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 font-poppins">
                        {p.startDate && (
                          <p className="flex items-center gap-2">
                            <span className="font-semibold">Start:</span>{" "}
                            {new Date(p.startDate).toLocaleDateString()}
                          </p>
                        )}
                        {p.endDate && (
                          <p className="flex items-center gap-2">
                            <span className="font-semibold">End:</span>{" "}
                            {new Date(p.endDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div
                        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold border-2 ${
                          p.isActive
                            ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {p.isActive ? "Active" : "Inactive"}
                      </div>
                      <button
                        onClick={() => toggleActive(p._id, p.isActive)}
                        className="rounded-xl px-4 py-3 transition-all duration-300 hover:scale-110 hover:bg-sky-50"
                      >
                        {p.isActive ? (
                          <ToggleRight className="h-7 w-7 text-emerald-600" />
                        ) : (
                          <ToggleLeft className="h-7 w-7 text-slate-400" />
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
  );
}
