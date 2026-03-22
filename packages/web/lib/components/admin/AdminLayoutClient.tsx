"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { AdminSidebar } from "./AdminSidebar";

interface AdminLayoutClientProps {
  children: React.ReactNode;
  adminName: string;
}

/**
 * AdminLayoutClient - Responsive admin layout shell
 *
 * Desktop (md+): Fixed 220px sidebar on left, content offset by ml-[220px]
 * Mobile (<md): Compact top bar with hamburger, sidebar opens as overlay
 *
 * Content area: bg-gray-50 / dark:bg-gray-950 with p-6 md:p-8 padding
 */
export function AdminLayoutClient({
  children,
  adminName,
}: AdminLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function openSidebar() {
    setSidebarOpen(true);
  }

  function closeSidebar() {
    setSidebarOpen(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar (desktop: always visible, mobile: overlay) */}
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={closeSidebar}
        adminName={adminName}
      />

      {/* Mobile top bar (hidden on desktop) */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-gray-900 flex items-center px-4 gap-3">
        <button
          onClick={openSidebar}
          className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          aria-label="Open navigation"
          aria-expanded={sidebarOpen}
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="text-sm font-semibold text-white">Decoded Admin</span>
      </div>

      {/* Main content area */}
      <div className="md:ml-[220px]">
        {/* Mobile top bar spacer */}
        <div className="h-14 md:hidden" aria-hidden="true" />

        {/* Page content */}
        <main className="p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
