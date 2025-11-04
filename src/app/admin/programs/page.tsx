"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import WalletConnection from "@/components/WalletConnection";

type Program = {
  _id: string;
  adminAddress: string;
  name: string;
  code: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
};

export default function ProgramsPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<any>(null);
  const [items, setItems] = useState<Program[]>([]);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setAdmin(data);
        if (data.walletAddress) {
          load(data.walletAddress.toLowerCase());
        }
      }
    })();
  }, []);

  const load = async (addr: string) => {
    const res = await fetch(`/api/programs?admin=${addr}`);
    const data = await res.json();
    setItems(data || []);
  };

  const addProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admin?.walletAddress || !admin?.adminId) return;
    const res = await fetch("/api/programs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ 
        adminAddress: admin.walletAddress, 
        adminId: admin.adminId,
        name, 
        code, 
        startDate, 
        endDate 
      })
    });
    const data = await res.json();
    setName(""); setCode(""); setStartDate(""); setEndDate("");
    if (data && data._id) load(admin.walletAddress.toLowerCase());
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    await fetch("/api/programs", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, isActive: !isActive })
    });
    if (admin?.walletAddress) load(admin.walletAddress.toLowerCase());
  };

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
      padding: "24px"
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{
          background: "white",
          borderRadius: "16px",
          padding: "24px",
          marginBottom: "24px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h1 style={{ margin: 0, fontSize: "28px", fontWeight: 700, color: "#1a202c" }}>Programs</h1>
            <Link href="/admin/dashboard" style={{
              padding: "8px 16px",
              background: "#667eea",
              color: "white",
              textDecoration: "none",
              borderRadius: "8px",
              fontWeight: 600,
              fontSize: "14px"
            }}>← Back to Dashboard</Link>
          </div>

          <WalletConnection />
        </div>

        <div style={{
          background: "white",
          borderRadius: "16px",
          padding: "24px",
          marginBottom: "24px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
        }}>
          <h2 style={{ margin: "0 0 20px 0", fontSize: "20px", fontWeight: 600 }}>Create New Program</h2>
          <form onSubmit={addProgram} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
            <input 
              placeholder="Program Name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required
              style={{ padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}
            />
            <input 
              placeholder="Program Code" 
              value={code} 
              onChange={(e) => setCode(e.target.value)} 
              required
              style={{ padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}
            />
            <input 
              placeholder="Start Date (YYYY-MM-DD)" 
              type="date"
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              style={{ padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}
            />
            <input 
              placeholder="End Date (YYYY-MM-DD)" 
              type="date"
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              style={{ padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}
            />
            <button 
              type="submit" 
              disabled={!admin?.walletAddress}
              style={{
                padding: "10px 20px",
                background: admin?.walletAddress ? "#667eea" : "#cbd5e0",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontWeight: 600,
                cursor: admin?.walletAddress ? "pointer" : "not-allowed"
              }}
            >
              Add Program
            </button>
          </form>
        </div>

        <div style={{
          background: "white",
          borderRadius: "16px",
          padding: "24px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
        }}>
          <h2 style={{ margin: "0 0 20px 0", fontSize: "20px", fontWeight: 600 }}>Programs List</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                  <th align="left" style={{ padding: "12px", fontWeight: 600, color: "#1a202c" }}>Name</th>
                  <th align="left" style={{ padding: "12px", fontWeight: 600, color: "#1a202c" }}>Code</th>
                  <th align="left" style={{ padding: "12px", fontWeight: 600, color: "#1a202c" }}>Status</th>
                  <th align="left" style={{ padding: "12px", fontWeight: 600, color: "#1a202c" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p._id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "12px" }}>{p.name}</td>
                    <td style={{ padding: "12px" }}>{p.code}</td>
                    <td style={{ padding: "12px" }}>
                      <span style={{
                        padding: "4px 12px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: 600,
                        background: p.isActive ? "#d1fae5" : "#fee2e2",
                        color: p.isActive ? "#065f46" : "#991b1b"
                      }}>
                        {p.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={{ padding: "12px" }}>
                      <button 
                        onClick={() => toggleActive(p._id, p.isActive)}
                        style={{
                          padding: "6px 12px",
                          background: p.isActive ? "#ef4444" : "#10b981",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "12px",
                          fontWeight: 600
                        }}
                      >
                        {p.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}


