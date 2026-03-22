"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { LogOut, History, Upload as UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const isPublicPage = ["/login", "/register"].includes(pathname);

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <header className="border-b">
      <div className="container custom-container flex h-16 items-center justify-between">
        <Link href="/" className="text-2xl font-bold">
          {/* Logo */}
          <Image
            src="/logo.svg"
            alt="StudyBuddy Logo"
            width={280}
            height={60}
          />
        </Link>
        <div className="flex items-center gap-6">
          {!isPublicPage && (
            <>
              <Link href="/history">
                <Button variant="ghost" className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  History
                </Button>
              </Link>
              <Link href="/">
                <Button variant="default" className="flex items-center gap-2">
                  <UploadIcon className="h-4 w-4" />
                  Upload
                </Button>
              </Link>
              <Button
                variant="ghost"
                className="flex items-center gap-2"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
