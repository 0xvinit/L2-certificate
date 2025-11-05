"use client";
import { useState } from "react";

export default function LoginPage() {
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      const res = await fetch("/api/auth/login", { 
        method: "POST", 
        headers: { "content-type": "application/json" }, 
        body: JSON.stringify({ adminId, password }),
        credentials: "include"
      });
      
      const data = await res.json();
      
      if (res.ok && data.ok) {
        setTimeout(() => {
          window.location.replace("/admin/dashboard");
        }, 200);
      } else {
        setError(data.error || "Invalid credentials");
        setLoading(false);
      }
    } catch (err: any) {
      setError(err?.message || "Login failed");
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-md py-16">
      <div className="card p-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Admin Login</h1>
          <p className="mt-2 text-sm text-muted-foreground">Enter your Admin ID and password</p>
        </div>
        <form onSubmit={submit} className="mt-8 grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Admin ID</label>
            <input
              className="h-11 rounded-lg border border-border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-color-ring"
              placeholder="Enter Admin ID"
              value={adminId}
              onChange={(e) => setAdminId(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Password</label>
            <input
              type="password"
              className="h-11 rounded-lg border border-border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-color-ring"
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary h-11">
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-700">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}


