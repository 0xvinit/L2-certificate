"use client";
import Link from "next/link";
import {
  Home,
  FileText,
  RotateCcw,
  CheckCircle,
  Shield,
  Mail,
  Github,
  Twitter,
  Linkedin,
} from "lucide-react";
import { useState } from "react";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setStatus("error");
      setMessage("Please enter your email");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setMessage(data.message || "Successfully subscribed!");
        setEmail("");

        // Reset success message after 5 seconds
        setTimeout(() => {
          setStatus("idle");
          setMessage("");
        }, 5000);
      } else {
        setStatus("error");
        setMessage(data.error || "Failed to subscribe");

        // Reset error message after 5 seconds
        setTimeout(() => {
          setStatus("idle");
          setMessage("");
        }, 5000);
      }
    } catch (error) {
      setStatus("error");
      setMessage("Network error. Please try again.");

      // Reset error message after 5 seconds
      setTimeout(() => {
        setStatus("idle");
        setMessage("");
      }, 5000);
    }
  };

  return (
    <footer className="w-full bg-linear-to-br from-[#2d4b59] via-[#1e3a47] to-[#2d4b59] relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[10%] right-[15%] w-[300px] h-[300px] bg-[#28aeec]/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[20%] left-[10%] w-[250px] h-[250px] bg-sky-400/10 blur-[100px] rounded-full animate-pulse delay-700" />
        <div className="absolute top-[50%] left-[45%] w-[200px] h-[200px] bg-[#28aeec]/5 blur-[80px] rounded-full animate-pulse delay-1000" />
      </div>

      {/* Decorative linear line at top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-transparent via-[#28aeec] to-transparent opacity-60" />

      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Main content area */}
        <div className="pt-16 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Brand section - Larger and more prominent */}
            <div className="lg:col-span-5 space-y-6">
              <div className="flex items-center gap-3">
                
                <div>
                  <span className="text-2xl font-bold bg-linear-to-r from-white via-sky-200 to-sky-400 bg-clip-text text-transparent font-major-mono block">
                    Patram
                  </span>
                  <span className="text-xs text-sky-300 font-poppins">
                    Blockchain Certification
                  </span>
                </div>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed font-poppins">
                Revolutionizing digital credentials with blockchain technology.
                Secure, transparent, and verifiable certificates for the modern
                world.
              </p>

              {/* Social Media Links */}
              {/* <div className="flex gap-3">
                <Link
                  href="#"
                  className="h-10 w-10 rounded-lg bg-white/5 hover:bg-[#28aeec]/20 border border-white/10 hover:border-[#28aeec]/50 flex items-center justify-center text-slate-300 hover:text-[#28aeec] transition-all duration-300 group"
                >
                  <Twitter className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </Link>
                <Link
                  href="#"
                  className="h-10 w-10 rounded-lg bg-white/5 hover:bg-[#28aeec]/20 border border-white/10 hover:border-[#28aeec]/50 flex items-center justify-center text-slate-300 hover:text-[#28aeec] transition-all duration-300 group"
                >
                  <Linkedin className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </Link>
                <Link
                  href="#"
                  className="h-10 w-10 rounded-lg bg-white/5 hover:bg-[#28aeec]/20 border border-white/10 hover:border-[#28aeec]/50 flex items-center justify-center text-slate-300 hover:text-[#28aeec] transition-all duration-300 group"
                >
                  <Github className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </Link>
                <Link
                  href="#"
                  className="h-10 w-10 rounded-lg bg-white/5 hover:bg-[#28aeec]/20 border border-white/10 hover:border-[#28aeec]/50 flex items-center justify-center text-slate-300 hover:text-[#28aeec] transition-all duration-300 group"
                >
                  <Mail className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </Link>
              </div> */}
            </div>

            {/* Product links */}
            <div className="lg:col-span-3 space-y-5">
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wider font-cairo mb-1">
                  Product
                </h3>
                <div className="h-0.5 w-12 bg-linear-to-r from-[#28aeec] to-transparent" />
              </div>
              <ul className="space-y-3 text-sm font-poppins">
                <li>
                  <Link
                    href="/verify"
                    className="flex items-center gap-2 text-slate-300 hover:text-[#28aeec] hover:translate-x-1 transition-all duration-200 group"
                  >
                    <CheckCircle className="w-4 h-4 group-hover:scale-110 transition-transform text-[#28aeec]" />
                    Verify Certificate
                  </Link>
                </li>
                <li>
                  <Link
                    href="/revoke"
                    className="flex items-center gap-2 text-slate-300 hover:text-[#28aeec] hover:translate-x-1 transition-all duration-200 group"
                  >
                    <RotateCcw className="w-4 h-4 group-hover:scale-110 transition-transform text-[#28aeec]" />
                    Revoke Certificate
                  </Link>
                </li>
              </ul>
            </div>

            {/* Newsletter section - More prominent */}
            <div className="lg:col-span-4 space-y-5">
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wider font-cairo mb-1">
                  Stay Connected
                </h3>
                <div className="h-0.5 w-12 bg-linear-to-r from-[#28aeec] to-transparent" />
              </div>
              <p className="text-sm text-slate-300 font-poppins">
                Subscribe to get the latest updates, news, and insights about
                blockchain certification.
              </p>
              <form onSubmit={handleSubscribe} className="space-y-3">
                <div className="relative">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={status === "loading"}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#28aeec] focus:border-transparent transition-all shadow-lg font-poppins disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full cursor-pointer px-4 py-3 rounded-xl bg-linear-to-r from-[#28aeec] to-sky-400 text-white text-sm font-semibold hover:shadow-xl hover:shadow-[#28aeec]/40 transition-all duration-300 active:scale-[0.98] font-poppins group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg"
                >
                  <span className="flex items-center justify-center gap-2">
                    {status === "loading" ? "Subscribing..." : "Subscribe Now"}
                    {status !== "loading" && (
                      <svg
                        className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    )}
                  </span>
                </button>
                {message && (
                  <div
                    className={`text-sm font-poppins text-center p-2 rounded-lg ${
                      status === "success"
                        ? "bg-green-500/20 text-green-300 border border-green-500/30"
                        : "bg-red-500/20 text-red-300 border border-red-500/30"
                    }`}
                  >
                    {message}
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* Divider with linear */}
        <div className="relative h-px">
          <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent" />
        </div>

        {/* Bottom section */}
        <div className="py-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-sm text-slate-400 text-center md:text-left font-poppins">
            © {new Date().getFullYear()}{" "}
            <span className="text-[#28aeec] font-semibold">Patram</span>. All
            rights reserved. Built with blockchain technology.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-poppins">
            <Link
              href="#"
              className="text-slate-300 hover:text-[#28aeec] transition-colors duration-200 hover:underline underline-offset-4"
            >
              Privacy Policy
            </Link>
            <span className="text-slate-600">•</span>
            <Link
              href="#"
              className="text-slate-300 hover:text-[#28aeec] transition-colors duration-200 hover:underline underline-offset-4"
            >
              Terms of Service
            </Link>
            <span className="text-slate-600">•</span>
            <Link
              href="#"
              className="text-slate-300 hover:text-[#28aeec] transition-colors duration-200 hover:underline underline-offset-4"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
