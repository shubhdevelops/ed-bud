"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/sidebar";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/register";

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <>
      <Sidebar />
      {/* Main content area — pushed right on desktop to make room for sidebar */}
      <main className="md:ml-[260px] min-h-screen bg-[#f5f3ff] dark:bg-[#0a0a14] dot-pattern transition-colors duration-300">
        {children}
      </main>
    </>
  );
}
