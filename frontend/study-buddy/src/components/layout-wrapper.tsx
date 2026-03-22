"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/navbar";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/register";

  return (
    <>
      {!isAuthPage && <Navbar />}
      {children}
    </>
  );
}
