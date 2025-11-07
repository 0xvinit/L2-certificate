"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import {
  LayoutDashboard,
  FileText,
  Plus,
  RotateCcw,
  CheckCircle,
  Users,
  Shield,
  UserCheck,
  Menu,
  X,
} from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";

type UserInfo = {
  adminId: string;
  isSuperAdmin: boolean;
  walletAddress?: string;
};

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { ready, authenticated } = usePrivy();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const hadUserInfoRef = useRef(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setUserInfo(data);
          hadUserInfoRef.current = true;
        } else {
          const hadUserInfo = hadUserInfoRef.current;
          setUserInfo(null);
          hadUserInfoRef.current = false;
          // If we're on an admin page and lost authentication (not initial load), redirect
          if (hadUserInfo && pathname.startsWith("/admin")) {
            router.push("/login");
          }
        }
      } catch {
        const hadUserInfo = hadUserInfoRef.current;
        setUserInfo(null);
        hadUserInfoRef.current = false;
        if (hadUserInfo && pathname.startsWith("/admin")) {
          router.push("/login");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [pathname, ready, authenticated, router]);

  // All possible menu items
  const allItems = [
    {
      href: "/admin/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      requiresAuth: true,
    },
    {
      href: "/issue",
      label: "Issue Certificates",
      icon: FileText,
      requiresAuth: true,
    },
    {
      href: "/admin/programs",
      label: "Add Program",
      icon: Plus,
      requiresAuth: true,
    },
    {
      href: "/revoke",
      label: "Revoke Certificate",
      icon: RotateCcw,
      requiresAuth: true,
    },
    {
      href: "/verify",
      label: "Verify",
      icon: CheckCircle,
      requiresAuth: false,
    },
    { href: "/student", label: "Student", icon: Users, requiresAuth: false },
    {
      href: "/admin/admins",
      label: "Admins",
      icon: Shield,
      requiresAuth: true,
      requiresSuperAdmin: true,
    },
  ];

  // Filter items based on user role
  const getVisibleItems = () => {
    // If user is not authenticated (not in allowlist or no session), show only public routes
    if (!userInfo) {
      return allItems.filter((item) => !item.requiresAuth);
    }

    // If user is super admin, show all items
    if (userInfo.isSuperAdmin) {
      return allItems;
    }

    // If user is admin (not super admin), show all except allowlist
    return allItems.filter((item) => {
      if (item.requiresSuperAdmin) return false; // Hide allowlist for regular admins
      return true; // Show all other items
    });
  };

  const items = getVisibleItems();

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 rounded-xl bg-linear-to-br from-[#28aeec] to-sky-400 text-white shadow-lg hover:shadow-xl transition-all"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 h-screen lg:h-[calc(100vh-64px)] w-72
          bg-white/80 backdrop-blur-xl border-r-2 border-sky-100
          flex flex-col shadow-2xl shadow-sky-200/20
          transition-transform duration-300 ease-in-out z-40
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <p className="px-4 text-xs font-bold uppercase tracking-wider text-gray-500 mb-4 font-cairo">
            Navigation
          </p>

          {loading ? (
            <div className="space-y-2">
              {/* Skeleton Loader - Multiple items */}
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 px-4 py-3.5 rounded-xl animate-pulse"
                >
                  {/* Skeleton Icon */}
                  <div className="rounded-lg p-2 bg-sky-100/50">
                    <div className="w-5 h-5 bg-linear-to-r from-sky-200 to-sky-300 rounded" />
                  </div>
                  {/* Skeleton Text */}
                  <div className="flex-1">
                    <div className="h-4 bg-linear-to-r from-sky-200 to-sky-300 rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center gap-4 px-4 py-3.5 rounded-xl
                    transition-all duration-300 ease-out
                    group relative overflow-hidden
                    ${
                      isActive
                        ? "bg-linear-to-r from-[#28aeec] to-sky-400 text-white font-semibold shadow-lg shadow-sky-200/50"
                        : "text-gray-700 hover:text-[#28aeec] hover:bg-sky-50/70"
                    }
                  `}
                  aria-current={isActive ? "page" : undefined}
                >
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-r-full" />
                  )}

                  <div
                    className={`
                    rounded-lg p-2 transition-all duration-300
                    ${
                      isActive
                        ? "bg-white/20"
                        : "bg-sky-100/50 group-hover:bg-sky-100"
                    }
                  `}
                  >
                    <Icon
                      className={`w-5 h-5 transition-transform duration-300 ${
                        isActive ? "scale-110" : "group-hover:scale-110"
                      }`}
                    />
                  </div>
                  <span className="text-base font-semibold font-poppins">
                    {item.label}
                  </span>

                  {/* Hover effect */}
                  {!isActive && (
                    <div className="absolute inset-0 bg-linear-to-r from-[#28aeec]/5 to-sky-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                  )}
                </Link>
              );
            })
          )}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t-2 border-sky-100 bg-linear-to-br from-sky-50/50 to-[#28aeec]/10">
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-sky-100">
            <p className="text-xs font-bold text-gray-900 mb-1 font-cairo uppercase">
              Need Help?
            </p>
            <p className="text-xs text-gray-600 font-poppins">
              Contact support for assistance
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
