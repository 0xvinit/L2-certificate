"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import WalletConnection from "@/components/WalletConnection";
import AppShell from "@/components/AppShell";

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
    const res = await fetch(`/api/programs?adminId=${addr}`, { credentials: 'include' });
    const data = await res.json();
    setItems(data || []);
  };

  const addProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admin?.walletAddress || !admin?.adminId) return;
    const res = await fetch("/api/programs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: 'include',
      body: JSON.stringify({ 
        adminAddress: admin.walletAddress, 
        adminId: admin.adminId,
        name, 
        code, 
        startDate, 
        endDate,
        logoUrl,
        signatureUrl
      })
    });
    const data = await res.json();
    setName(""); setCode(""); setStartDate(""); setEndDate("");
    setLogoUrl(""); setSignatureUrl("");
    if (data && data._id) load(admin.walletAddress.toLowerCase());
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    await fetch("/api/programs", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      credentials: 'include',
      body: JSON.stringify({ id, isActive: !isActive })
    });
    if (admin?.walletAddress) load(admin.walletAddress.toLowerCase());
  };

  return (
    <AppShell>
      <div className="card p-6">
        <WalletConnection />
      </div>

      <div className="mt-6 card p-6">
        <h2 className="text-base font-semibold">Create New Program</h2>
        <form onSubmit={addProgram} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <input
            className="h-11 rounded-md border px-3 text-sm outline-none focus:ring-2"
            placeholder="Program Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            className="h-11 rounded-md border px-3 text-sm outline-none focus:ring-2"
            placeholder="Program Code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
          <input
            className="h-11 rounded-md border px-3 text-sm outline-none focus:ring-2"
            placeholder="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <input
            className="h-11 rounded-md border px-3 text-sm outline-none focus:ring-2"
            placeholder="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <label className="text-xs">Logo</label>
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const b = await f.arrayBuffer();
                const base64 = btoa(String.fromCharCode(...new Uint8Array(b)));
                const up = await fetch('/api/ipfs/upload', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ fileBase64: base64, filename: f.name }) });
                const d = await up.json();
                if (up.ok) setLogoUrl(d.uri);
              }}
              className="h-11 w-full rounded-md border px-3 text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs">Signature</label>
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const b = await f.arrayBuffer();
                const base64 = btoa(String.fromCharCode(...new Uint8Array(b)));
                const up = await fetch('/api/ipfs/upload', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ fileBase64: base64, filename: f.name }) });
                const d = await up.json();
                if (up.ok) setSignatureUrl(d.uri);
              }}
              className="h-11 w-full rounded-md border px-3 text-xs"
            />
          </div>
          <button type="submit" disabled={!admin?.walletAddress} className="btn btn-primary h-11">
            Add Program
          </button>
        </form>
        {(logoUrl || signatureUrl) && (
          <div className="mt-3 flex items-center gap-6">
            {logoUrl && <img alt="logo" className="h-10 w-10 rounded-md border object-contain bg-white" src={(logoUrl.startsWith('ipfs://') ? (process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://ipfs.io/ipfs/') + logoUrl.replace('ipfs://','') : logoUrl)} />}
            {signatureUrl && <img alt="signature" className="h-10 rounded-md border object-contain bg-white" src={(signatureUrl.startsWith('ipfs://') ? (process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://ipfs.io/ipfs/') + signatureUrl.replace('ipfs://','') : signatureUrl)} />}
          </div>
        )}
      </div>

      <div className="mt-6 card p-6">
        <h2 className="text-base font-semibold">Programs List</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-3 py-2 text-left font-semibold">Name</th>
                <th className="px-3 py-2 text-left font-semibold">Code</th>
                <th className="px-3 py-2 text-left font-semibold">Status</th>
                <th className="px-3 py-2 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p._id} className="border-b">
                  <td className="px-3 py-2">{p.name}</td>
                  <td className="px-3 py-2 font-mono">{p.code}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${p.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {p.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => toggleActive(p._id, p.isActive)}
                      className={`h-9 rounded-md px-3 text-xs font-semibold text-white ${p.isActive ? 'bg-red-600' : 'bg-emerald-600'}`}
                    >
                      {p.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}


