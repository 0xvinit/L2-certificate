"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import WalletConnection from "@/components/WalletConnection";

export default function AdminsPage() {
  const router = useRouter();
  const [admins, setAdmins] = useState<any[]>([]);
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [university, setUniversity] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const res = await fetch("/api/admin/admins", { credentials: "include" });
    if (res.status === 403) {
      router.push("/login");
      return;
    }
    const data = await res.json();
    setAdmins(data || []);
  };

  const createAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ adminId, password, university })
      });
      if (res.ok) {
        setAdminId("");
        setPassword("");
        setUniversity("");
        await load();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to create admin");
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteAdmin = async (id: string, adminId: string) => {
    if (!confirm(`Delete admin ${adminId}?`)) return;
    const res = await fetch(`/api/admin/admins?id=${id}`, { 
      method: "DELETE",
      credentials: "include"
    });
    if (res.ok) await load();
    else alert("Failed to delete");
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
            <h1 style={{ margin: 0, fontSize: "28px", fontWeight: 700, color: "#1a202c" }}>Manage Admins</h1>
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
          <h2 style={{ margin: "0 0 20px 0", fontSize: "20px", fontWeight: 600, color: "#1a202c" }}>Create New Admin</h2>
          <form onSubmit={createAdmin} style={{ display: "grid", gap: "16px", maxWidth: "500px" }}>
            <div>
              <label style={{ 
                display: "block", 
                marginBottom: "8px", 
                fontSize: "14px", 
                fontWeight: 600,
                color: "#1a202c"
              }}>
                Admin ID
              </label>
              <input 
                placeholder="Enter Admin ID" 
                value={adminId} 
                onChange={(e) => setAdminId(e.target.value)} 
                required
                style={{ 
                  width: "100%",
                  padding: "12px 16px", 
                  borderRadius: "8px", 
                  border: "2px solid #e2e8f0",
                  fontSize: "14px",
                  color: "#1a202c",
                  boxSizing: "border-box"
                }}
              />
            </div>
            <div>
              <label style={{ 
                display: "block", 
                marginBottom: "8px", 
                fontSize: "14px", 
                fontWeight: 600,
                color: "#1a202c"
              }}>
                Password
              </label>
              <input 
                type="password" 
                placeholder="Enter Password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required
                style={{ 
                  width: "100%",
                  padding: "12px 16px", 
                  borderRadius: "8px", 
                  border: "2px solid #e2e8f0",
                  fontSize: "14px",
                  color: "#1a202c",
                  boxSizing: "border-box"
                }}
              />
            </div>
            <div>
              <label style={{ 
                display: "block", 
                marginBottom: "8px", 
                fontSize: "14px", 
                fontWeight: 600,
                color: "#1a202c"
              }}>
                University
              </label>
              <input 
                placeholder="Enter University Name" 
                value={university} 
                onChange={(e) => setUniversity(e.target.value)} 
                required
                style={{ 
                  width: "100%",
                  padding: "12px 16px", 
                  borderRadius: "8px", 
                  border: "2px solid #e2e8f0",
                  fontSize: "14px",
                  color: "#1a202c",
                  boxSizing: "border-box"
                }}
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              style={{
                padding: "10px 20px",
                background: loading ? "#cbd5e0" : "#667eea",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer"
              }}
            >
              {loading ? "Creating..." : "Create Admin"}
            </button>
          </form>
        </div>

        <div style={{
          background: "white",
          borderRadius: "16px",
          padding: "24px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
        }}>
          <h2 style={{ margin: "0 0 20px 0", fontSize: "20px", fontWeight: 600 }}>Admins List</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                  <th align="left" style={{ padding: "12px", fontWeight: 600, color: "#1a202c" }}>Admin ID</th>
                  <th align="left" style={{ padding: "12px", fontWeight: 600, color: "#1a202c" }}>University</th>
                  <th align="left" style={{ padding: "12px", fontWeight: 600, color: "#1a202c" }}>Wallet</th>
                  <th align="left" style={{ padding: "12px", fontWeight: 600, color: "#1a202c" }}>Role</th>
                  <th align="left" style={{ padding: "12px", fontWeight: 600, color: "#1a202c" }}>Created By</th>
                  <th align="left" style={{ padding: "12px", fontWeight: 600, color: "#1a202c" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((a) => (
                  <tr key={a._id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "12px", color: "#1a202c", fontWeight: 500 }}>{a.adminId}</td>
                    <td style={{ padding: "12px", color: "#1a202c" }}>{a.university || "-"}</td>
                    <td style={{ padding: "12px", fontFamily: "monospace", fontSize: "12px" }}>
                      {a.walletAddress ? `${a.walletAddress.slice(0, 6)}...${a.walletAddress.slice(-4)}` : "-"}
                    </td>
                    <td style={{ padding: "12px" }}>
                      {a.isSuperAdmin ? (
                        <span style={{
                          padding: "4px 12px",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: 600,
                          background: "#667eea",
                          color: "white"
                        }}>
                          Super Admin
                        </span>
                      ) : (
                        <span style={{
                          padding: "4px 12px",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: 600,
                          background: "#e2e8f0",
                          color: "#1a202c"
                        }}>
                          Admin
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "12px", color: "#718096" }}>{a.createdBy || "-"}</td>
                    <td style={{ padding: "12px" }}>
                      {!a.isSuperAdmin && (
                        <button 
                          onClick={() => deleteAdmin(a._id, a.adminId)}
                          style={{
                            padding: "6px 12px",
                            background: "#ef4444",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "12px",
                            fontWeight: 600
                          }}
                        >
                          Delete
                        </button>
                      )}
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

