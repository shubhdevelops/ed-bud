"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login } from "@/lib/api";
import { motion } from "framer-motion";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const data = await login(email, password);
      localStorage.setItem("user", JSON.stringify(data.user));
      router.push("/");
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An error occurred during login");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f6f5f7] p-4">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[900px] min-h-[480px] bg-white rounded-[25px] shadow-[0_14px_50px_rgba(0,0,0,0.12)] overflow-hidden flex flex-col md:flex-row relative"
      >
        {/* ====== LEFT SIDE — Sign In Form ====== */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 py-10 md:px-12 order-2 md:order-1">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="w-full max-w-[340px]"
          >
            <h1 className="text-[32px] font-bold text-[#1a1a2e] mb-1 tracking-tight">
              Sign In
            </h1>
            <p className="text-[13px] text-gray-400 mb-8">
              Welcome back! Sign in to your account
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 text-red-600 text-xs px-4 py-2.5 rounded-lg border border-red-100"
                >
                  {error}
                </motion.div>
              )}

              {/* Email */}
              <div
                className={`flex items-center gap-2.5 bg-[#f3f0ff] rounded-lg px-3.5 py-2.5 transition-all duration-200 border-2 ${
                  focusedField === "email"
                    ? "border-[#7c3aed] shadow-[0_0_0_3px_rgba(124,58,237,0.1)]"
                    : "border-transparent"
                }`}
              >
                <Mail className="w-4 h-4 text-[#7c3aed]/50 shrink-0" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="Email"
                  className="w-full bg-transparent text-sm text-[#1a1a2e] placeholder-gray-400 outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                />
              </div>

              {/* Password */}
              <div
                className={`flex items-center gap-2.5 bg-[#f3f0ff] rounded-lg px-3.5 py-2.5 transition-all duration-200 border-2 ${
                  focusedField === "password"
                    ? "border-[#7c3aed] shadow-[0_0_0_3px_rgba(124,58,237,0.1)]"
                    : "border-transparent"
                }`}
              >
                <Lock className="w-4 h-4 text-[#7c3aed]/50 shrink-0" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="Password"
                  className="w-full bg-transparent text-sm text-[#1a1a2e] placeholder-gray-400 outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-[#7c3aed] transition-colors shrink-0"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Forgot password link */}
              <div className="text-right">
                <span className="text-xs text-gray-400 hover:text-[#7c3aed] transition-colors cursor-pointer">
                  Forgot Your Password?
                </span>
              </div>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 rounded-xl bg-[#7c3aed] text-white text-sm font-bold uppercase tracking-wider hover:bg-[#6d28d9] transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <motion.div
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full mx-auto"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                ) : (
                  "SIGN IN"
                )}
              </motion.button>
            </form>

            {/* Mobile-only signup link */}
            <p className="text-center text-sm text-gray-400 mt-6 md:hidden">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="text-[#7c3aed] font-semibold hover:underline"
              >
                Sign Up
              </Link>
            </p>
          </motion.div>
        </div>

        {/* ====== RIGHT SIDE — Purple Welcome Panel ====== */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="md:w-[42%] bg-gradient-to-br from-[#7c3aed] via-[#6d28d9] to-[#5b21b6] flex flex-col items-center justify-center px-10 py-12 text-center text-white relative overflow-hidden order-1 md:order-2 md:rounded-l-[80px] min-h-[200px] md:min-h-0"
        >
          {/* Decorative circles */}
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full border border-white/10" />
          <div className="absolute -bottom-20 -left-20 w-56 h-56 rounded-full border border-white/10" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full border border-white/5" />

          {/* Floating dots */}
          <motion.div
            className="absolute top-[20%] left-[15%] w-2 h-2 rounded-full bg-white/20"
            animate={{ y: [0, -15, 0], opacity: [0.2, 0.6, 0.2] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-[25%] right-[20%] w-1.5 h-1.5 rounded-full bg-white/20"
            animate={{ y: [0, -10, 0], opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />
          <motion.div
            className="absolute top-[60%] left-[70%] w-2.5 h-2.5 rounded-full bg-white/15"
            animate={{ y: [0, -12, 0], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          />

          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <h2 className="text-[28px] md:text-[34px] font-bold mb-3 leading-tight">
                Hello,<br />Friend!
              </h2>
              <p className="text-white/70 text-sm leading-relaxed max-w-[250px] mx-auto mb-8">
                Register with your personal details to use all of StudyBuddy&apos;s features
              </p>
              <Link href="/register">
                <motion.span
                  whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.15)" }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-block px-10 py-2.5 rounded-full border-2 border-white text-white text-xs font-bold uppercase tracking-[2px] hover:bg-white/10 transition-all duration-200 cursor-pointer"
                >
                  SIGN UP
                </motion.span>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
