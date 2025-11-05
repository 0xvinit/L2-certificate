"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, FileText, Plus, RotateCcw, CheckCircle, Users, Shield } from "lucide-react"

export default function AppSidebar() {
  const pathname = usePathname()

  const items = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/issue", label: "Issue Certificates", icon: FileText },
    { href: "/admin/programs", label: "Add Program", icon: Plus },
    { href: "/revoke", label: "Revoke Certificate", icon: RotateCcw },
    { href: "/verify", label: "Verify", icon: CheckCircle },
    { href: "/student", label: "Student", icon: Users },
    { href: "/admin/admins", label: "Admins", icon: Shield },
  ]

  return (
    <aside className="sticky top-0 h-screen w-64 bg-gradient-to-b from-slate-50 to-slate-100 border-r border-slate-200 flex flex-col shadow-sm">
      {/* <div className="p-6 border-b border-slate-200/60">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">AC</span>
          </div>
          <h1 className="text-lg font-bold text-slate-900">Admin</h1>
        </div>
      </div> */}

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        <p className="px-3 text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">Menu</p>

        {items.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg
                transition-all duration-200 ease-out
                group relative
                ${
                  isActive
                    ? "bg-blue-50 text-blue-600 font-medium shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                }
              `}
              aria-current={isActive ? "page" : undefined}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r-full" />
              )}

              <Icon
                className={`w-5 h-5 transition-transform duration-200 ${
                  isActive ? "scale-110" : "group-hover:scale-105"
                }`}
              />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>


    </aside>
  )
}
