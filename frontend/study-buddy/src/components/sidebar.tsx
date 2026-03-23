"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  History,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  ChevronRight,
  User,
} from "lucide-react";
import { useTheme } from "next-themes";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    setMounted(true);
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      setUserName(
        user.firstname
          ? `${user.firstname} ${user.lastname || ""}`
          : user.email || "User"
      );
    } catch {
      setUserName("User");
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/login");
  };

  const navItems: NavItem[] = [
    {
      label: "Upload",
      href: "/",
      icon: <Upload className="w-5 h-5" />,
    },
    {
      label: "History",
      href: "/history",
      icon: <History className="w-5 h-5" />,
    },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 pt-6 pb-8">
        <Link href="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
          <Image
            src="/logo.svg"
            alt="StudyBuddy Logo"
            width={160}
            height={36}
            style={{ filter: "brightness(0) invert(1)" }}
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1.5">
        <p className="px-3 mb-3 text-[10px] font-semibold uppercase tracking-[2px] text-white/30">
          Menu
        </p>
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
            >
              <motion.div
                whileHover={{ x: 4 }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group cursor-pointer ${
                  active
                    ? "bg-[#7c3aed] text-white shadow-lg shadow-[#7c3aed]/25"
                    : "text-white/60 hover:text-white hover:bg-white/8"
                }`}
              >
                <span className={active ? "text-white" : "text-white/50 group-hover:text-white"}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
                {active && (
                  <ChevronRight className="w-4 h-4 ml-auto" />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-3 pb-6 space-y-2">
        {/* Theme toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/8 transition-all duration-200 cursor-pointer"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5 text-white/50" />
            ) : (
              <Moon className="w-5 h-5 text-white/50" />
            )}
            <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
          </button>
        )}

        {/* Divider */}
        <div className="mx-3 h-px bg-white/10" />

        {/* User section */}
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-9 h-9 rounded-full bg-[#7c3aed] flex items-center justify-center text-white text-sm font-bold shrink-0">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{userName}</p>
            <p className="text-[10px] text-white/40">Student</p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-[250px] bg-[#1a1a2e] border-r border-white/5 z-40 flex-col">
        {sidebarContent}
      </aside>

      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl bg-[#1a1a2e] text-white flex items-center justify-center shadow-lg cursor-pointer"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="md:hidden fixed left-0 top-0 bottom-0 w-[250px] bg-[#1a1a2e] z-50 flex flex-col"
            >
              {/* Close button */}
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
