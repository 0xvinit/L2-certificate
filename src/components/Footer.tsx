import Link from "next/link";
import { Home, FileText, RotateCcw, CheckCircle, Shield } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full bg-linear-to-b from-slate-50/80 to-white/60 backdrop-blur-sm border-t border-slate-200/50">
      <div className="container max-w-7xl px-6">
        {/* Main content area */}
        <div className="py-12 grid gap-8 md:grid-cols-4">
          {/* Brand section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-linear-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/20 flex items-center justify-center">
                <span className="text-white font-bold text-sm">CG</span>
              </div>
              <span className="text-sm font-bold text-slate-900">
                ChainGrad
              </span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed max-w-xs">
              Securely issue, verify, and manage digital certificates for your
              institution with blockchain technology.
            </p>
          </div>

          {/* Product links */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Product</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/issue"
                  className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors duration-200 group"
                >
                  <FileText className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  Issue Certificates
                </Link>
              </li>
              <li>
                <Link
                  href="/verify"
                  className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors duration-200 group"
                >
                  <CheckCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  Verify Certificate
                </Link>
              </li>
              <li>
                <Link
                  href="/revoke"
                  className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors duration-200 group"
                >
                  <RotateCcw className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  Revoke Certificate
                </Link>
              </li>
            </ul>
          </div>

          {/* Admin links */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Admin</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/admin/dashboard"
                  className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors duration-200 group"
                >
                  <Home className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/programs"
                  className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors duration-200 group"
                >
                  <FileText className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  Programs
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/admins"
                  className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors duration-200 group"
                >
                  <Shield className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  Admins
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Stay Updated</h3>
            <p className="text-sm text-slate-600">
              Get the latest updates and news.
            </p>
            <div className="flex flex-col gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="px-3 py-2 rounded-lg bg-white/60 border border-slate-200 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <button className="px-3 py-2 rounded-lg bg-linear-to-br from-blue-500 to-blue-600 text-white text-sm font-medium hover:shadow-lg hover:shadow-blue-500/30 transition-all active:scale-95">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-200/50" />

        {/* Bottom section */}
        <div className="py-6 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} ChainGrad. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs">
            <Link
              href="#"
              className="text-slate-600 hover:text-slate-900 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="#"
              className="text-slate-600 hover:text-slate-900 transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              href="#"
              className="text-slate-600 hover:text-slate-900 transition-colors"
            >
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
