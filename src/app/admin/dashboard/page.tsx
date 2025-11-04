"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import WalletConnection from "@/components/WalletConnection";

export default function Dashboard() {
  const router = useRouter();
  const [admin, setAdmin] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

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
              const statsRes = await fetch(`/api/admin/stats?admin=${data.walletAddress}`, { credentials: "include" });
              if (statsRes.ok) {
                setStats(await statsRes.json());
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
    <div style={{ 
      minHeight: "100vh", 
      background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
      padding: "24px"
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div style={{
          background: "white",
          borderRadius: "16px",
          padding: "24px",
          marginBottom: "24px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h1 style={{ margin: 0, fontSize: "28px", fontWeight: 700, color: "#1a202c" }}>Admin Dashboard</h1>
              {admin && (
                <p style={{ margin: "8px 0 0 0", color: "#718096" }}>
                  {admin.adminId} {admin.isSuperAdmin && <span style={{ 
                    background: "#667eea", 
                    color: "white", 
                    padding: "2px 8px", 
                    borderRadius: "4px", 
                    fontSize: "12px",
                    marginLeft: "8px"
                  }}>Super Admin</span>}
                </p>
              )}
            </div>
            <button
              onClick={logout}
              style={{
                padding: "10px 20px",
                background: "#ef4444",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: "14px"
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Wallet Connection */}
        <WalletConnection />

        {/* Stats Cards */}
        {stats && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px", marginBottom: "24px" }}>
            <div style={{
              background: "white",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
            }}>
              <div style={{ fontSize: "14px", color: "#718096", marginBottom: "8px" }}>Total Issued</div>
              <div style={{ fontSize: "32px", fontWeight: 700, color: "#1a202c" }}>{stats.total || 0}</div>
            </div>
            <div style={{
              background: "white",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
            }}>
              <div style={{ fontSize: "14px", color: "#718096", marginBottom: "8px" }}>Revoked</div>
              <div style={{ fontSize: "32px", fontWeight: 700, color: "#ef4444" }}>{stats.revoked || 0}</div>
            </div>
            <div style={{
              background: "white",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
            }}>
              <div style={{ fontSize: "14px", color: "#718096", marginBottom: "8px" }}>Active</div>
              <div style={{ fontSize: "32px", fontWeight: 700, color: "#10b981" }}>{(stats.total || 0) - (stats.revoked || 0)}</div>
            </div>
          </div>
        )}

        {/* Navigation Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
          {admin?.isSuperAdmin && (
            <Link href="/admin/admins" style={{ textDecoration: "none" }}>
              <div style={{
                background: "white",
                borderRadius: "12px",
                padding: "24px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                cursor: "pointer",
                transition: "transform 0.2s",
                textAlign: "center"
              }} onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}>
                <div style={{ fontSize: "24px", marginBottom: "8px" }}>👥</div>
                <div style={{ fontWeight: 600, color: "#1a202c" }}>Manage Admins</div>
              </div>
            </Link>
          )}
          <Link href="/admin/programs" style={{ textDecoration: "none" }}>
            <div style={{
              background: "white",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              cursor: "pointer",
              transition: "transform 0.2s",
              textAlign: "center"
            }} onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}>
              <div style={{ fontSize: "24px", marginBottom: "8px" }}>📚</div>
              <div style={{ fontWeight: 600, color: "#1a202c" }}>Programs</div>
            </div>
          </Link>
          <Link href="/issue" style={{ textDecoration: "none" }}>
            <div style={{
              background: "white",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              cursor: "pointer",
              transition: "transform 0.2s",
              textAlign: "center"
            }} onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}>
              <div style={{ fontSize: "24px", marginBottom: "8px" }}>🎓</div>
              <div style={{ fontWeight: 600, color: "#1a202c" }}>Issue Certificate</div>
            </div>
          </Link>
        </div>

        {/* Recent Certificates */}
        {stats && stats.recent && stats.recent.length > 0 && (
          <div style={{
            background: "white",
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
          }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "20px", fontWeight: 600, color: "#1a202c" }}>Recent Certificates</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {stats.recent.map((c: any) => (
                <div key={c._id} style={{
                  padding: "12px",
                  background: "#f7fafc",
                  borderRadius: "8px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <div>
                    <div style={{ fontWeight: 600, color: "#1a202c" }}>{c.studentName}</div>
                    <div style={{ fontSize: "14px", color: "#718096" }}>ID: {c.studentId}</div>
                  </div>
                  <div style={{ fontSize: "14px", color: "#718096" }}>
                    {new Date(c.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


