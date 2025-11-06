"use client";
import { ReactNode } from "react";
import AppSidebar from "@/components/AppSidebar";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-white via-sky-50/30 to-blue-50/20 pt-16">
      <AppSidebar />
      <main className="flex-1 p-6 md:p-8 lg:p-10 overflow-x-hidden">
        <div className="w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}



