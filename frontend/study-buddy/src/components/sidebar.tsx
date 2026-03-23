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
  MessageCircle,
  Calendar,
  Brain,
  Sparkles,
  LayoutDashboard,
} from "lucide-react";
import { useTheme } from "next-themes";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
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
      label: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="w-[18px] h-[18px]" />,
    },
    {
      label: "Upload",
      href: "/",
      icon: <Upload className="w-[18px] h-[18px]" />,
    },
    {
      label: "AI Tutor",
      href: "/tutor",
      icon: <MessageCircle className="w-[18px] h-[18px]" />,
      badge: "AI",
    },
    {
      label: "Study Planner",
      href: "/planner",
      icon: <Calendar className="w-[18px] h-[18px]" />,
    },
    {
      label: "Practice",
      href: "/practice",
      icon: <Brain className="w-[18px] h-[18px]" />,
      badge: "New",
    },
    {
      label: "History",
      href: "/history",
      icon: <History className="w-[18px] h-[18px]" />,
    },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 pt-6 pb-6">
        <Link href="/" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#6366f1] flex items-center justify-center shadow-lg shadow-[#7c3aed]/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-[17px] font-bold text-white tracking-tight">StudyBuddy</span>
            <span className="block text-[9px] font-medium text-white/30 uppercase tracking-[3px]">AI Platform</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        <p className="px-3 mb-3 text-[10px] font-semibold uppercase tracking-[2px] text-white/25">
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
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 group cursor-pointer relative ${
                  active
                    ? "bg-gradient-to-r from-[#7c3aed] to-[#6366f1] text-white shadow-lg shadow-[#7c3aed]/20"
                    : "text-white/55 hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                <span className={`transition-colors ${active ? "text-white" : "text-white/40 group-hover:text-white/80"}`}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`ml-auto px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                    active
                      ? "bg-white/20 text-white"
                      : "bg-[#7c3aed]/15 text-[#a78bfa]"
                  }`}>
                    {item.badge}
                  </span>
                )}
                {active && !item.badge && (
                  <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-60" />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-3 pb-5 space-y-1.5">
        {/* Theme toggle */}
        {mounted && (
          <motion.button
            whileHover={{ x: 3 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-medium text-white/55 hover:text-white hover:bg-white/[0.06] transition-all duration-200 cursor-pointer"
          >
            {theme === "dark" ? (
              <Sun className="w-[18px] h-[18px] text-amber-400/70" />
            ) : (
              <Moon className="w-[18px] h-[18px] text-white/40" />
            )}
            <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
          </motion.button>
        )}

        {/* Divider */}
        <div className="mx-3 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* User section */}
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#6366f1] flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-md shadow-[#7c3aed]/20">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-white truncate">{userName}</p>
            <p className="text-[10px] text-white/30 font-medium">Student</p>
          </div>
        </div>

        {/* Logout */}
        <motion.button
          whileHover={{ x: 3 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-medium text-red-400/60 hover:text-red-400 hover:bg-red-500/8 transition-all duration-200 cursor-pointer"
        >
          <LogOut className="w-[18px] h-[18px]" />
          <span>Logout</span>
        </motion.button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-[260px] bg-gradient-to-b from-[#0f0f23] via-[#12122a] to-[#0d0d20] border-r border-white/[0.04] z-40 flex-col">
        {/* Subtle gradient glow at top */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#7c3aed]/8 to-transparent pointer-events-none" />
        {sidebarContent}
      </aside>

      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl bg-[#0f0f23] text-white flex items-center justify-center shadow-lg shadow-black/20 cursor-pointer border border-white/5"
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
              className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -270 }}
              animate={{ x: 0 }}
              exit={{ x: -270 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="md:hidden fixed left-0 top-0 bottom-0 w-[260px] bg-gradient-to-b from-[#0f0f23] via-[#12122a] to-[#0d0d20] z-50 flex flex-col"
            >
              {/* Close button */}
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/8 text-white flex items-center justify-center cursor-pointer hover:bg-white/12 transition"
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
