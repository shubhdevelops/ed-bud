"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  BookOpen,
  Brain,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Flame,
  MessageCircle,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Upload,
  Zap,
} from "lucide-react";

/* ───────── dummy data ───────── */
const STATS = [
  { label: "Study Streak", value: "7 days", icon: <Flame className="w-5 h-5" />, color: "from-orange-500 to-amber-500", bg: "bg-orange-500/10", text: "text-orange-500" },
  { label: "Quizzes Taken", value: "23", icon: <Brain className="w-5 h-5" />, color: "from-[#7c3aed] to-[#6366f1]", bg: "bg-[#7c3aed]/10", text: "text-[#7c3aed]" },
  { label: "Avg. Score", value: "78%", icon: <Target className="w-5 h-5" />, color: "from-emerald-500 to-teal-500", bg: "bg-emerald-500/10", text: "text-emerald-500" },
  { label: "Hours Studied", value: "42h", icon: <Clock className="w-5 h-5" />, color: "from-blue-500 to-cyan-500", bg: "bg-blue-500/10", text: "text-blue-500" },
];

const SUBJECT_SCORES = [
  { subject: "Physics", score: 85, quizzes: 7, color: "#7c3aed" },
  { subject: "Mathematics", score: 72, quizzes: 6, color: "#6366f1" },
  { subject: "Chemistry", score: 64, quizzes: 4, color: "#8b5cf6" },
  { subject: "Computer Sci.", score: 91, quizzes: 4, color: "#a855f7" },
  { subject: "Biology", score: 58, quizzes: 2, color: "#c084fc" },
];

const WEEKLY_HOURS = [
  { day: "Mon", hours: 3.5 },
  { day: "Tue", hours: 2.0 },
  { day: "Wed", hours: 4.0 },
  { day: "Thu", hours: 1.5 },
  { day: "Fri", hours: 5.0 },
  { day: "Sat", hours: 3.0 },
  { day: "Sun", hours: 2.5 },
];

const RECENT_ACTIVITY = [
  { type: "quiz", title: "Completed Physics — Mechanics Quiz", score: "8/10", time: "2 hours ago", icon: <Brain className="w-4 h-4" /> },
  { type: "upload", title: "Uploaded 'Organic Chemistry.pdf'", score: "", time: "5 hours ago", icon: <Upload className="w-4 h-4" /> },
  { type: "tutor", title: "Asked AI Tutor about Integration", score: "", time: "Yesterday", icon: <MessageCircle className="w-4 h-4" /> },
  { type: "planner", title: "Generated study plan for Finals", score: "", time: "Yesterday", icon: <Calendar className="w-4 h-4" /> },
  { type: "quiz", title: "Completed Math — Calculus Quiz", score: "6/10", time: "2 days ago", icon: <Brain className="w-4 h-4" /> },
];

const UPCOMING = [
  { subject: "Physics", topic: "Electromagnetic Waves", date: "Today", priority: "high" },
  { subject: "Math", topic: "Differential Equations", date: "Tomorrow", priority: "medium" },
  { subject: "Chemistry", topic: "Thermodynamics Review", date: "Wed", priority: "low" },
];

/* ───────── component ───────── */
export default function DashboardPage() {
  const [userName, setUserName] = useState("Student");

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user.firstname) setUserName(user.firstname);
    } catch { /* ignore */ }
  }, []);

  const maxHours = Math.max(...WEEKLY_HOURS.map((d) => d.hours));

  const priorityStyle: Record<string, string> = {
    high: "bg-red-50 text-red-600 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
    medium: "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
    low: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
  };

  return (
    <div className="max-w-6xl mx-auto p-4 pb-8 space-y-6">
      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl gradient-animated p-7 text-white shadow-2xl shadow-[#7c3aed]/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-16 w-24 h-24 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20 text-2xl font-black">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-white/50 text-sm font-medium">Welcome back,</p>
              <h1 className="text-2xl font-bold tracking-tight">{userName} 👋</h1>
            </div>
          </div>
          <p className="text-white/50 text-sm mt-3 max-w-lg">
            You&apos;re on a <span className="text-white font-semibold">7-day study streak</span>! Keep it up — consistency is the key to mastery.
          </p>
        </div>
      </motion.div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="rounded-2xl glass p-5 card-hover"
          >
            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3 ${stat.text}`}>
              {stat.icon}
            </div>
            <p className="text-2xl font-black text-gray-800 dark:text-white">{stat.value}</p>
            <p className="text-xs text-gray-400 font-medium mt-0.5">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ▸ Subject Performance (2 cols) */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2 rounded-2xl glass p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#7c3aed]" />
              Subject Performance
            </h2>
            <span className="text-xs text-gray-400 font-medium">Based on quiz scores</span>
          </div>
          <div className="space-y-4">
            {SUBJECT_SCORES.map((subj) => (
              <div key={subj.subject} className="flex items-center gap-4">
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 w-28 shrink-0 truncate">{subj.subject}</p>
                <div className="flex-1 h-8 bg-gray-100 dark:bg-white/5 rounded-xl overflow-hidden relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${subj.score}%` }}
                    transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                    className="h-full rounded-xl relative"
                    style={{ background: `linear-gradient(90deg, ${subj.color}, ${subj.color}cc)` }}
                  >
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-white text-xs font-bold">{subj.score}%</span>
                  </motion.div>
                </div>
                <span className="text-xs text-gray-400 w-16 text-right">{subj.quizzes} quizzes</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ▸ Upcoming Study Plan (1 col) */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="rounded-2xl glass p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-800 dark:text-white flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-[#7c3aed]" />
            Upcoming Study
          </h2>
          <div className="space-y-3">
            {UPCOMING.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5">
                <div className="w-8 h-8 rounded-lg bg-[#7c3aed]/8 flex items-center justify-center text-[#7c3aed] shrink-0 mt-0.5">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{item.topic}</p>
                  <p className="text-xs text-gray-400">{item.subject} • {item.date}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border shrink-0 ${priorityStyle[item.priority]}`}>{item.priority}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ▸ Weekly Study Hours (2 cols) */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2 rounded-2xl glass p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#7c3aed]" />
              Weekly Study Hours
            </h2>
            <span className="text-xs text-gray-400 font-medium">Total: {WEEKLY_HOURS.reduce((a, b) => a + b.hours, 0).toFixed(1)}h</span>
          </div>
          <div className="flex items-end gap-3 h-40">
            {WEEKLY_HOURS.map((d, i) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(d.hours / maxHours) * 100}%` }}
                  transition={{ duration: 0.6, delay: i * 0.05, ease: "easeOut" }}
                  className="w-full rounded-xl bg-gradient-to-t from-[#7c3aed] to-[#6366f1] relative group cursor-pointer"
                  style={{ minHeight: 8 }}
                >
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-gray-800 text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                    {d.hours}h
                  </div>
                </motion.div>
                <span className="text-[11px] font-semibold text-gray-400">{d.day}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ▸ Recent Activity (1 col) */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="rounded-2xl glass p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-800 dark:text-white flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-[#7c3aed]" />
            Recent Activity
          </h2>
          <div className="space-y-3">
            {RECENT_ACTIVITY.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#7c3aed]/8 flex items-center justify-center text-[#7c3aed] shrink-0 mt-0.5">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug">{item.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-gray-400">{item.time}</span>
                    {item.score && (
                      <span className="text-[11px] font-bold text-[#7c3aed] bg-[#7c3aed]/8 px-1.5 py-0.5 rounded-md">{item.score}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Achievements Row ── */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="rounded-2xl glass p-6 shadow-sm">
        <h2 className="text-base font-bold text-gray-800 dark:text-white flex items-center gap-2 mb-5">
          <Trophy className="w-5 h-5 text-amber-500" />
          Achievements
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {[
            { emoji: "🔥", title: "7-Day Streak", done: true },
            { emoji: "🧠", title: "First Quiz", done: true },
            { emoji: "📝", title: "10 Notes", done: true },
            { emoji: "🎯", title: "Score 90%+", done: true },
            { emoji: "📅", title: "Study Planner", done: true },
            { emoji: "💬", title: "Ask AI Tutor", done: true },
            { emoji: "📚", title: "Upload 5 PDFs", done: false },
            { emoji: "⚡", title: "50 Questions", done: false },
            { emoji: "🏆", title: "Perfect Score", done: false },
            { emoji: "🌟", title: "30-Day Streak", done: false },
            { emoji: "🎓", title: "All Subjects", done: false },
            { emoji: "🚀", title: "Speed Learner", done: false },
          ].map((badge) => (
            <div key={badge.title} className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition ${
              badge.done
                ? "bg-white dark:bg-white/[0.04] border-gray-100 dark:border-white/8"
                : "bg-gray-50/50 dark:bg-white/[0.01] border-gray-100/50 dark:border-white/[0.03] opacity-40"
            }`}>
              <span className="text-2xl">{badge.emoji}</span>
              <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 text-center leading-tight">{badge.title}</span>
              {badge.done && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
