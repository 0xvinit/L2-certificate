"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function InitPage() {
  const router = useRouter();
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);
    
    try {
      const res = await fetch("/api/admin/init-super-admin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ adminId, password })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 2000);
      } else {
        setError(data.error || "Failed to create super admin");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to create super admin");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px"
    }}>
      <div style={{
        background: "white",
        borderRadius: "16px",
        padding: "40px",
        maxWidth: "450px",
        width: "100%",
        boxShadow: "0 10px 40px rgba(0,0,0,0.2)"
      }}>
        <h1 style={{ 
          margin: "0 0 8px 0", 
          fontSize: "28px", 
          fontWeight: 700, 
          color: "#1a202c",
          textAlign: "center"
        }}>
          Initialize Super Admin
        </h1>
        <p style={{ 
          margin: "0 0 32px 0", 
          color: "#718096", 
          textAlign: "center",
          fontSize: "14px"
        }}>
          Create the first super admin account
        </p>
        
        {success && (
          <div style={{ 
            marginBottom: "24px",
            padding: "12px",
            background: "#d1fae5",
            color: "#065f46",
            borderRadius: "8px",
            fontSize: "14px",
            textAlign: "center"
          }}>
            ✓ Super admin created successfully! Redirecting to login...
          </div>
        )}
        
        {error && (
          <div style={{ 
            marginBottom: "24px",
            padding: "12px",
            background: "#fee2e2",
            color: "#991b1b",
            borderRadius: "8px",
            fontSize: "14px",
            textAlign: "center"
          }}>
            {error}
          </div>
        )}
        
        <form onSubmit={submit} style={{ display: "grid", gap: "16px" }}>
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
              disabled={loading || success}
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
              disabled={loading || success}
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
            disabled={loading || success}
            style={{
              padding: "14px 24px",
              background: (loading || success) ? "#cbd5e0" : "#667eea",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontWeight: 600,
              fontSize: "16px",
              cursor: (loading || success) ? "not-allowed" : "pointer",
              transition: "background 0.2s"
            }}
          >
            {loading ? "Creating..." : success ? "Created!" : "Create Super Admin"}
          </button>
        </form>
        
        {success && (
          <div style={{ 
            marginTop: "16px",
            padding: "12px",
            background: "#eff6ff",
            borderRadius: "8px",
            fontSize: "12px",
            color: "#1e40af",
            textAlign: "center"
          }}>
            You will be redirected to the login page shortly...
          </div>
        )}
      </div>
    </div>
  );
}

