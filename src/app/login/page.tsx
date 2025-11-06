"use client";
import { useEffect, useRef, useState } from "react";
import { usePrivy, useIdentityToken } from "@privy-io/react-auth";

export default function LoginPage() {
  const { login, getAccessToken, authenticated, ready } = usePrivy();
  const { identityToken } = useIdentityToken();
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const exchangedRef = useRef(false);

  const signInWithGoogle = async () => {
    try {
      setError("");
      setLoading(true);
      await login();
      // After redirect back, the effect below will complete the exchange
    } catch (e: any) {
      setError(e?.message || "Login failed");
      setLoading(false);
    }
  };

  // On return from Google (Privy adds privy_oauth_* params), complete the token exchange automatically
  useEffect(() => {
    (async () => {
      if (!ready) return;
      if (!authenticated) return;
      if (exchangedRef.current) return;
      try {
        // Retry a few times in case access token isn't ready immediately
        for (let i = 0; i < 12; i++) {
          const token = identityToken || (await getAccessToken());
          console.log("[login] attempt", i + 1, "authenticated=", authenticated, "idToken?", !!identityToken, identityToken ? `len=${identityToken.length}` : "", "sentTokenLen=", token ? token.length : 0);
          if (identityToken) {
            const res = await fetch("/api/auth/privy", {
              method: "POST",
              headers: { "privy-id-token": identityToken },
              credentials: "include",
            });
            const text = await res.text();
            let data: any = {};
            try { data = JSON.parse(text); } catch {}
            console.log("[login] /api/auth/privy ->", res.status, text);
            if (res.ok && (data as any).ok) {
              exchangedRef.current = true;
              window.location.replace("/admin/dashboard");
              return;
            }
            // If user is not in allowlist (403), redirect to student page
            if (res.status === 403) {
              exchangedRef.current = true;
              console.log("[login] User not in allowlist, redirecting to student page");
              window.location.replace("/student");
              return;
            }
            // If unauthorized or invalid token, wait and retry
          }
          await new Promise(r => setTimeout(r, 400));
        }
        setError("Could not complete sign-in. Please try again.");
        setLoading(false);
      } catch (e: any) {
        setError(e?.message || "Login failed");
        setLoading(false);
      }
    })();
  }, [ready, authenticated, getAccessToken]);

  return (
    <div className="container max-w-md py-16">
      <div className="card p-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Admin Login</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in with Google (Privy)</p>
        </div>
        <div className="mt-6 grid gap-3">
          <button onClick={signInWithGoogle} disabled={loading} className="btn btn-primary h-11">
            {loading ? "Signing in..." : "Continue with Google"}
          </button>
        </div>
        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-700">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}


