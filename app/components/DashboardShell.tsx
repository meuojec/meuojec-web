"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/app/components/Sidebar";
import TopbarClient from "@/app/components/TopbarClient";

type NavPerms = {
  dash: boolean; miembros: boolean; asist: boolean; eventos: boolean;
  fin: boolean; inv: boolean; ded: boolean; reportes?: boolean; admin: boolean;
  ministerios?: boolean; visitantes?: boolean; pastoral?: boolean;
  anuncios?: boolean; agenda?: boolean;
};

export default function DashboardShell({
  navPerms,
  children,
}: {
  navPerms: NavPerms;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (window.innerWidth >= 1024) setOpen(true);
  }, []);

  const toggle = () => setOpen((o) => !o);
  const close  = () => setOpen(false);

  if (!mounted) {
    return (
      <div className="flex min-h-screen">
        <div className="hidden lg:block w-72 shrink-0">
          <Sidebar navPerms={navPerms} />
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <TopbarClient onMenuToggle={toggle} sidebarOpen={false} />
          <main className="p-4 md:p-6">{children}</main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={close}
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          "fixed inset-y-0 left-0 z-40 w-72 transition-transform duration-300",
          "lg:relative lg:translate-x-0 lg:z-auto lg:shrink-0",
          open ? "translate-x-0" : "-translate-x-full",
          !open ? "lg:hidden" : "",
        ].join(" ")}
      >
        <div className="h-full">
          <Sidebar navPerms={navPerms} />
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopbarClient onMenuToggle={toggle} sidebarOpen={open} />
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
