"use client";
// @ts-ignore - provided by Alchemy Account Kit at runtime
import { useAuthModal, useSignerStatus, useUser } from "@account-kit/react";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, CheckCircle, Lock, Home as HomeIcon } from "lucide-react";

export default function LoginPage() {
  const user = useUser();
  const { openAuthModal } = useAuthModal();
  const signerStatus = useSignerStatus();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const processedUserRef = useRef<string | null>(null);

  const signInWithGoogle = async () => {
    try {
      setError("");
      openAuthModal();
      // Loading will be managed by useEffect when user authenticates
    } catch (err: any) {
      setError(err?.message || "Failed to open authentication modal");
      setLoading(false);
    }
  };

  useEffect(() => {
    // Reset loading if user logs out or modal is closed without authentication
    if (!user) {
      setLoading(false);
      processedUserRef.current = null;
    }
  }, [user]);

  useEffect(() => {
    (async () => {
      if (!user || !user.email) return;
      
      // Prevent duplicate requests for the same user
      if (processedUserRef.current === user.email) return;
      
      // Create app session cookie as soon as user logs in with Alchemy
      try {
        processedUserRef.current = user.email;
        setLoading(true);
        setError("");
        
        const resp = await fetch("/api/auth/alchemy", {
          method: "POST",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email: user.email }),
        });
        
        if (resp.ok) {
          // Wait longer to ensure cookie is fully set and persisted in browser
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Verify cookie was set by checking /api/auth/me
          const verifyResp = await fetch("/api/auth/me", {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          });
          
          if (verifyResp.ok) {
            // Cookie is verified, wait a bit more to ensure it's persisted
            await new Promise(resolve => setTimeout(resolve, 200));
            // Use window.location.href for full page reload to ensure cookie is available
            window.location.href = "/admin/dashboard";
          } else {
            // Cookie verification failed, wait more and try again
            console.warn("Cookie verification failed, waiting longer...");
            await new Promise(resolve => setTimeout(resolve, 500));
            window.location.href = "/admin/dashboard";
          }
        } else {
          const data = await resp.json();
          setError(data?.error || "Authentication failed");
          processedUserRef.current = null; // Reset on error so user can retry
          setLoading(false);
        }
      } catch (err: any) {
        setError(err?.message || "Failed to authenticate");
        processedUserRef.current = null; // Reset on error so user can retry
        setLoading(false);
      }
    })();
  }, [user]);

  return (
    <div className="min-h-screen bg-linear-to-b from-white to-sky-50/30 relative overflow-hidden flex items-center justify-center">
      {/* Background blur circles */}
      <div className="absolute top-[8%] left-[5%] w-[240px] h-[240px] bg-sky-400/30 blur-3xl rounded-full z-0" />
      <div className="absolute bottom-[15%] right-[8%] w-[220px] h-[220px] bg-sky-500/40 blur-3xl rounded-full z-0" />
      <div className="absolute top-[45%] right-[12%] w-[180px] h-[180px] bg-blue-400/35 blur-3xl rounded-full z-0" />
      <div className="absolute bottom-[40%] left-[15%] w-[160px] h-[160px] bg-sky-300/40 blur-3xl rounded-full z-0" />

      {/* Back to Home Button */}
      <Link
        href="/"
        className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/60 hover:bg-white border-2 border-sky-100 hover:border-[#28aeec]/50 text-gray-700 hover:text-[#28aeec] transition-all duration-300 font-poppins text-sm backdrop-blur-xl shadow-lg"
      >
        <HomeIcon className="w-4 h-4" />
        Back to Home
      </Link>

      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-md px-6">
        <div className="bg-white/60 backdrop-blur-xl border-2 border-sky-100 rounded-3xl p-8 md:p-10 shadow-2xl hover:shadow-sky-200/30 transition-all duration-500">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-2xl bg-linear-to-br from-[#28aeec] to-sky-400 shadow-xl shadow-sky-300/50 flex items-center justify-center">
                <Shield className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 font-cairo mb-2 uppercase">
              Admin Login
            </h1>
            <p className="text-gray-700 text-sm md:text-base font-poppins">
              Secure access to your certificate management dashboard
            </p>
          </div>

          {/* Features List */}
          <div className="mb-8 space-y-3">
            <div className="flex items-center gap-3 text-gray-700 text-sm font-poppins">
              <CheckCircle className="w-5 h-5 text-[#28aeec] shrink-0" />
              <span>Blockchain-secured certificate management</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700 text-sm font-poppins">
              <CheckCircle className="w-5 h-5 text-[#28aeec] shrink-0" />
              <span>Real-time verification and tracking</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700 text-sm font-poppins">
              <Lock className="w-5 h-5 text-[#28aeec] shrink-0" />
              <span>Secure Google OAuth authentication</span>
            </div>
          </div>

          {/* Divider */}
          <div className="relative h-px mb-8">
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-sky-200 to-transparent" />
          </div>

          {/* Login Button */}
          <button
            onClick={signInWithGoogle}
            disabled={loading}
            className="w-full cursor-pointer px-6 py-4 rounded-xl bg-linear-to-r from-[#28aeec] to-sky-400 text-white font-semibold text-base font-poppins hover:shadow-2xl hover:shadow-[#28aeec]/50 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg flex items-center justify-center gap-3 group"
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
            <div className="mt-6 rounded-xl border-2 border-red-400/50 bg-red-50/80 px-4 py-3 text-center text-sm text-red-700 font-poppins backdrop-blur-sm shadow-lg">
              {error}
            </div>
          )}

          {/* Footer Note */}
          <p className="mt-6 text-center text-xs text-gray-600 font-poppins">
            By signing in, you agree to our secure authentication process
          </p>
        </div>

        {/* Bottom Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-700 font-poppins">
            Need access? Contact your system administrator
          </p>
        </div>
      </div>
    </div>
  );
}
