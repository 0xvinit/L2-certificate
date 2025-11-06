"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, FileText, Plus, RotateCcw, CheckCircle, Users, Shield, Menu, X } from "lucide-react"
import { useState } from "react"

export default function AppSidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

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
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 rounded-xl bg-gradient-to-br from-[#28aeec] to-sky-400 text-white shadow-lg hover:shadow-xl transition-all"
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
          fixed lg:sticky top-0 h-[calc(100vh-64px)] w-72
          bg-white/80 backdrop-blur-xl border-r-2 border-sky-100
          flex flex-col shadow-2xl shadow-sky-200/20
          transition-transform duration-300 ease-in-out z-40
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Header */}
        {/* <div className="p-6 border-b-2 border-sky-100 bg-gradient-to-br from-[#28aeec]/10 to-sky-50/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#28aeec] to-sky-400 rounded-2xl flex items-center justify-center shadow-lg">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 font-cairo uppercase">ChainGrad</h1>
              <p className="text-xs text-gray-600 font-poppins">Admin Portal</p>
            </div>
          </div>
        </div> */}

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <p className="px-4 text-xs font-bold uppercase tracking-wider text-gray-500 mb-4 font-cairo">
            Navigation
          </p>

          {items.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

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
                      ? "bg-gradient-to-r from-[#28aeec] to-sky-400 text-white font-semibold shadow-lg shadow-sky-200/50"
                      : "text-gray-700 hover:text-[#28aeec] hover:bg-sky-50/70"
                  }
                `}
                aria-current={isActive ? "page" : undefined}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1.5  rounded-r-full" />
                )}

                <div className={`
                  rounded-lg p-2 transition-all duration-300
                  ${isActive
                    ? "bg-white/20"
                    : "bg-sky-100/50 group-hover:bg-sky-100"
                  }
                `}>
                  <Icon
                    className={`size-6 transition-transform duration-300 ${
                      isActive ? "scale-110" : "group-hover:scale-110"
                    }`}
                  />
                </div>
                <span className="text-base font-semibold font-poppins">{item.label}</span>

                {/* Hover effect */}
                {!isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-[#28aeec]/5 to-sky-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t-2 border-sky-100 bg-gradient-to-br from-sky-50/50 to-[#28aeec]/10">
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
  )
}
