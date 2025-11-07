"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Allowed = {
  _id: string;
  email: string;
  status: string;
  isSuperAdmin?: boolean;
  createdBy?: string;
  createdAt?: string;
};

export default function AllowlistPage() {
  const router = useRouter();
  const [list, setList] = useState<Allowed[]>([]);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("active");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    try {
      const res = await fetch("/api/admin/allowlist", {
        credentials: "include",
      });
      if (res.status === 401 || res.status === 403) {
        router.push("/");
        return;
      }
      const data = await res.json();
      setList(data || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load allowlist");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const addEmail = async (e: React.FormEvent) => {
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

  const removeEmail = async (addr: string) => {
    if (!confirm(`Remove ${addr} from allowlist?`)) return;
    try {
      const res = await fetch(
        `/api/admin/allowlist?email=${encodeURIComponent(addr)}`,
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
    <div
      style={{
        minHeight: "100vh",
        background: "linear-linear(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        padding: "24px",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div
          style={{
            background: "white",
            borderRadius: "16px",
            padding: "24px",
            marginBottom: "24px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 700,
              color: "#1a202c",
            }}
          >
            Admin Allowlist
          </h1>
          <p style={{ marginTop: 8, color: "#4a5568", fontSize: 14 }}>
            Add emails that can sign in with Google and access admin
            dashboard.
          </p>
        </div>

        <div
          style={{
            background: "white",
            borderRadius: "16px",
            padding: "24px",
            marginBottom: "24px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          }}
        >
          <h2 style={{ margin: "0 0 16px 0", fontSize: 18, fontWeight: 600 }}>
            Add Email
          </h2>
          <form
            onSubmit={addEmail}
            style={{ display: "grid", gap: 12, maxWidth: 560 }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 6,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Email
              </label>
              <input
                type="email"
                placeholder="prof@example.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "2px solid #e2e8f0",
                  fontSize: 14,
                }}
              />
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: 6,
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "2px solid #e2e8f0",
                    fontSize: 14,
                  }}
                >
                  <option value="active">active</option>
                  <option value="pending">pending</option>
                </select>
              </div>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 28,
                  fontSize: 14,
                }}
              >
                <input
                  type="checkbox"
                  checked={isSuperAdmin}
                  onChange={(e) => setIsSuperAdmin(e.target.checked)}
                />
                Super Admin
              </label>
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "10px 16px",
                background: loading ? "#cbd5e0" : "#667eea",
                color: "white",
                border: "none",
                borderRadius: 8,
                fontWeight: 600,
                width: 180,
              }}
            >
              {loading ? "Adding..." : "Add Email"}
            </button>
            {error && (
              <div style={{ color: "#b91c1c", fontSize: 13 }}>{error}</div>
            )}
          </form>
        </div>

        <div
          style={{
            background: "white",
            borderRadius: "16px",
            padding: "24px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          }}
        >
          <h2 style={{ margin: "0 0 16px 0", fontSize: 18, fontWeight: 600 }}>
            Allowed Emails
          </h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                  <th align="left" style={{ padding: 12 }}>
                    Email
                  </th>
                  <th align="left" style={{ padding: 12 }}>
                    Status
                  </th>
                  <th align="left" style={{ padding: 12 }}>
                    Role
                  </th>
                  <th align="left" style={{ padding: 12 }}>
                    Created By
                  </th>
                  <th align="left" style={{ padding: 12 }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.map((a) => (
                  <tr key={a._id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td
                      style={{
                        padding: 12,
                        fontFamily: "monospace",
                        fontSize: 13,
                      }}
                    >
                      {a.email}
                    </td>
                    <td style={{ padding: 12 }}>{a.status}</td>
                    <td style={{ padding: 12 }}>
                      {a.isSuperAdmin ? "Super Admin" : "Admin"}
                    </td>
                    <td style={{ padding: 12, color: "#718096" }}>
                      {a.createdBy || "-"}
                    </td>
                    <td style={{ padding: 12 }}>
                      <button
                        onClick={() => removeEmail(a.email)}
                        style={{
                          padding: "6px 10px",
                          background: "#ef4444",
                          color: "white",
                          border: "none",
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        Remove
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
