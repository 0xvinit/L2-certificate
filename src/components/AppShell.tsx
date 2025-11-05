"use client";
import { ReactNode } from "react";
import AppSidebar from "@/components/AppSidebar";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="container max-w-7xl py-6">
      <div className="flex gap-6">
        <AppSidebar />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}



