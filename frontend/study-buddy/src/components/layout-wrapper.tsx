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
      <main className="md:ml-[250px] min-h-screen bg-[#f6f5f7] dark:bg-[#0f0f1a]">
        {children}
      </main>
    </>
  );
}
