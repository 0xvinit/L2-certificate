"use client";
import { useEffect, useRef, useState } from "react";
import { usePrivy, useIdentityToken } from "@privy-io/react-auth";
import Link from "next/link";
import { Home, Shield, CheckCircle, Lock } from "lucide-react";

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
    <div className="min-h-screen bg-linear-to-br from-[#2d4b59] via-[#1e3a47] to-[#2d4b59] relative overflow-hidden flex items-center justify-center">
      {/* Animated background elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] bg-[#28aeec]/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[15%] left-[15%] w-[350px] h-[350px] bg-sky-400/15 blur-[100px] rounded-full animate-pulse delay-700" />
        <div className="absolute top-[50%] left-[50%] w-[300px] h-[300px] bg-[#28aeec]/10 blur-[80px] rounded-full animate-pulse delay-1000" />
      </div>

      {/* Decorative linear line at top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-transparent via-[#28aeec] to-transparent opacity-60" />

      {/* Back to Home Button */}
      <Link
        href="/"
        className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#28aeec]/50 text-slate-300 hover:text-[#28aeec] transition-all duration-300 font-poppins text-sm backdrop-blur-sm"
      >
        <Home className="w-4 h-4" />
        Back to Home
      </Link>

      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-md px-6">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 md:p-10 shadow-2xl">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-2xl bg-linear-to-br from-[#28aeec] to-sky-400 shadow-xl shadow-[#28aeec]/40 flex items-center justify-center animate-pulse">
                <Shield className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white font-cairo mb-2">
              Admin Login
            </h1>
            <p className="text-slate-300 text-sm md:text-base font-poppins">
              Secure access to your certificate management dashboard
            </p>
          </div>

          {/* Features List */}
          <div className="mb-8 space-y-3">
            <div className="flex items-center gap-3 text-slate-300 text-sm font-poppins">
              <CheckCircle className="w-5 h-5 text-[#28aeec] shrink-0" />
              <span>Blockchain-secured certificate management</span>
            </div>
            <div className="flex items-center gap-3 text-slate-300 text-sm font-poppins">
              <CheckCircle className="w-5 h-5 text-[#28aeec] shrink-0" />
              <span>Real-time verification and tracking</span>
            </div>
            <div className="flex items-center gap-3 text-slate-300 text-sm font-poppins">
              <Lock className="w-5 h-5 text-[#28aeec] shrink-0" />
              <span>Secure Google OAuth authentication</span>
            </div>
          </div>

          {/* Divider */}
          <div className="relative h-px mb-8">
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent" />
          </div>

          {/* Login Button */}
          <button
            onClick={signInWithGoogle}
            disabled={loading}
            className="w-full px-6 py-4 rounded-xl bg-linear-to-r from-[#28aeec] to-sky-400 text-white font-semibold text-base font-poppins hover:shadow-2xl hover:shadow-[#28aeec]/50 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg flex items-center justify-center gap-3 group"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>Continue with Google</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>

          {/* Error Message */}
          {error && (
            <div className="mt-6 rounded-xl border border-red-400/50 bg-red-500/20 px-4 py-3 text-center text-sm text-red-200 font-poppins backdrop-blur-sm animate-shake">
              {error}
            </div>
          )}

          {/* Footer Note */}
          <p className="mt-6 text-center text-xs text-slate-400 font-poppins">
            By signing in, you agree to our secure authentication process
          </p>
        </div>

        {/* Bottom Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-400 font-poppins">
            Need access? Contact your system administrator
          </p>
        </div>
      </div>

      {/* Decorative linear line at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-transparent via-[#28aeec] to-transparent opacity-60" />
    </div>
  );
}


