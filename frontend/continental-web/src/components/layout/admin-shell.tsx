"use client";

import { ReactNode, useState } from "react";

import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

import type { SessionUser } from "@/types/auth";

type AdminShellProps = {
  user: SessionUser;
  children: ReactNode;
};

export function AdminShell({
  user,
  children,
}: AdminShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <Sidebar
        user={user}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="min-h-screen lg:pl-[280px]">
        <Topbar
          user={user}
          onOpenMenu={() => setIsSidebarOpen(true)}
        />

        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}