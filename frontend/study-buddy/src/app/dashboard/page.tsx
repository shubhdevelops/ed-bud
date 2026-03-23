"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  AlertTriangle,
  BellRing,
  RotateCcw,
  ChevronDown,
  ChevronUp,
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

/* ───────── Ebbinghaus Forgetting Curve Data ─────────
 * R = e^(-t/S)  where R = retention, t = time elapsed, S = memory stability
 * Each topic simulates: when it was last studied, initial quiz score,
 * and computes a predicted retention % at "now".
 * Optimal revision intervals: 1 day → 3 days → 7 days → 14 days → 30 days
 */
interface ForgettingTopic {
  topic: string;
  subject: string;
  lastStudied: string;          // human readable
  hoursAgo: number;             // hours since last study
  initialScore: number;         // 0-100 — quiz score at learning time
  retention: number;            // computed: predicted current retention %
  nextRevision: string;         // recommended next revision time
  revisionCount: number;        // how many times revised
  status: "critical" | "warning" | "safe";
}

const computeRetention = (hoursAgo: number, initialScore: number, revisions: number): number => {
  // Ebbinghaus: R = e^(-t/S), S increases with revisions and initial strength
  const stability = (0.5 + revisions * 0.6) * (initialScore / 100) * 24; // in hours
  const retention = Math.round(100 * Math.exp(-hoursAgo / Math.max(stability, 1)));
  return Math.max(5, Math.min(100, retention));
};

const FORGETTING_TOPICS: ForgettingTopic[] = [
  { topic: "Organic Reactions — SN1 vs SN2", subject: "Chemistry", lastStudied: "5 days ago", hoursAgo: 120, initialScore: 65, revisionCount: 0, retention: 0, nextRevision: "", status: "critical" },
  { topic: "Integration by Parts", subject: "Mathematics", lastStudied: "3 days ago", hoursAgo: 72, initialScore: 70, revisionCount: 1, retention: 0, nextRevision: "", status: "critical" },
  { topic: "Electromagnetic Induction", subject: "Physics", lastStudied: "2 days ago", hoursAgo: 48, initialScore: 80, revisionCount: 1, retention: 0, nextRevision: "", status: "warning" },
  { topic: "Binary Search Trees", subject: "Computer Sci.", lastStudied: "4 days ago", hoursAgo: 96, initialScore: 90, revisionCount: 2, retention: 0, nextRevision: "", status: "warning" },
  { topic: "Cell Division — Mitosis", subject: "Biology", lastStudied: "7 days ago", hoursAgo: 168, initialScore: 55, revisionCount: 0, retention: 0, nextRevision: "", status: "critical" },
  { topic: "Newton's Laws of Motion", subject: "Physics", lastStudied: "1 day ago", hoursAgo: 24, initialScore: 85, revisionCount: 3, retention: 0, nextRevision: "", status: "safe" },
  { topic: "Matrices & Determinants", subject: "Mathematics", lastStudied: "6 hours ago", hoursAgo: 6, initialScore: 78, revisionCount: 2, retention: 0, nextRevision: "", status: "safe" },
].map((t) => {
  const retention = computeRetention(t.hoursAgo, t.initialScore, t.revisionCount);
  const status: "critical" | "warning" | "safe" = retention < 30 ? "critical" : retention < 60 ? "warning" : "safe";
  const nextRevision = retention < 30 ? "Revise NOW" : retention < 60 ? "Revise today" : "Next: in 2 days";
  return { ...t, retention, status, nextRevision };
}).sort((a, b) => a.retention - b.retention); // most urgent first

/* ───────── Forgetting Curve SVG Mini-Chart ───────── */
function DecayCurve({ retention, hoursAgo }: { retention: number; hoursAgo: number }) {
  // Draw an exponential decay curve
  const width = 120;
  const height = 40;
  const points: string[] = [];
  for (let x = 0; x <= width; x += 2) {
    const t = (x / width) * Math.max(hoursAgo * 1.2, 48);
    const r = 100 * Math.exp(-t / Math.max(hoursAgo * 0.3, 8));
    const y = height - (r / 100) * height;
    points.push(`${x},${y}`);
  }
  // "now" marker position
  const nowX = Math.min((hoursAgo / Math.max(hoursAgo * 1.2, 48)) * width, width - 4);
  const nowY = height - (retention / 100) * height;

  return (
    <svg width={width} height={height} className="shrink-0">
      {/* Decay curve */}
      <polyline
        fill="none"
        stroke={retention < 30 ? "#ef4444" : retention < 60 ? "#f59e0b" : "#10b981"}
        strokeWidth="2"
        strokeLinecap="round"
        points={points.join(" ")}
        opacity={0.6}
      />
      {/* Area under curve */}
      <polyline
        fill={retention < 30 ? "rgba(239,68,68,0.08)" : retention < 60 ? "rgba(245,158,11,0.08)" : "rgba(16,185,129,0.08)"}
        stroke="none"
        points={`0,${height} ${points.join(" ")} ${width},${height}`}
      />
      {/* Now marker */}
      <circle
        cx={nowX}
        cy={nowY}
        r="4"
        fill={retention < 30 ? "#ef4444" : retention < 60 ? "#f59e0b" : "#10b981"}
        stroke="white"
        strokeWidth="1.5"
      />
      {/* "Now" label */}
      <text x={nowX} y={nowY - 7} textAnchor="middle" fill={retention < 30 ? "#ef4444" : retention < 60 ? "#f59e0b" : "#10b981"} fontSize="8" fontWeight="bold">
        {retention}%
      </text>
    </svg>
  );
}

/* ───────── component ───────── */
export default function DashboardPage() {
  const [userName, setUserName] = useState("Student");
  const [curveExpanded, setCurveExpanded] = useState(true);

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user.firstname) setUserName(user.firstname);
    } catch { /* ignore */ }
  }, []);

  const maxHours = Math.max(...WEEKLY_HOURS.map((d) => d.hours));
  const criticalCount = FORGETTING_TOPICS.filter((t) => t.status === "critical").length;

  const priorityStyle: Record<string, string> = {
    high: "bg-red-50 text-red-600 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
    medium: "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
    low: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
  };

  const statusConfig = {
    critical: {
      bg: "bg-red-50 dark:bg-red-500/8",
      border: "border-red-200 dark:border-red-500/20",
      badge: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
      bar: "from-red-500 to-red-400",
      text: "text-red-600 dark:text-red-400",
      label: "Critical",
    },
    warning: {
      bg: "bg-amber-50 dark:bg-amber-500/8",
      border: "border-amber-200 dark:border-amber-500/20",
      badge: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
      bar: "from-amber-500 to-amber-400",
      text: "text-amber-600 dark:text-amber-400",
      label: "Fading",
    },
    safe: {
      bg: "bg-emerald-50/50 dark:bg-emerald-500/5",
      border: "border-emerald-200 dark:border-emerald-500/15",
      badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
      bar: "from-emerald-500 to-emerald-400",
      text: "text-emerald-600 dark:text-emerald-400",
      label: "Fresh",
    },
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

      {/* ════════════════════════════════════════════════════════
          ══  FORGETTING CURVE ALERT — Ebbinghaus Memory Model  ══
          ════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-2xl overflow-hidden shadow-sm"
        style={{
          background: "linear-gradient(135deg, rgba(239,68,68,0.04), rgba(245,158,11,0.04), rgba(124,58,237,0.04))",
          border: "1px solid rgba(239,68,68,0.15)",
        }}
      >
        {/* Header */}
        <button
          onClick={() => setCurveExpanded(!curveExpanded)}
          className="w-full flex items-center justify-between p-5 pb-4 cursor-pointer hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-500 to-amber-500 flex items-center justify-center shadow-lg shadow-red-500/20">
                <BellRing className="w-5 h-5 text-white" />
              </div>
              {criticalCount > 0 && (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-white dark:border-[#0a0a14]"
                >
                  {criticalCount}
                </motion.div>
              )}
            </div>
            <div className="text-left">
              <h2 className="text-base font-bold text-gray-800 dark:text-white flex items-center gap-2">
                Forgetting Curve Alerts
                <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400 uppercase tracking-wider">
                  Ebbinghaus
                </span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Memory retention predictions — revise before you forget!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-medium hidden sm:block">{FORGETTING_TOPICS.length} topics tracked</span>
            {curveExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </div>
        </button>

        {/* Info bar */}
        <div className="px-5 pb-3">
          <div className="flex items-center gap-4 text-[11px] font-semibold">
            <span className="flex items-center gap-1.5 text-red-500"><span className="w-2 h-2 rounded-full bg-red-500" /> Critical (&lt;30%)</span>
            <span className="flex items-center gap-1.5 text-amber-500"><span className="w-2 h-2 rounded-full bg-amber-500" /> Fading (30-60%)</span>
            <span className="flex items-center gap-1.5 text-emerald-500"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Fresh (&gt;60%)</span>
          </div>
        </div>

        {/* Topic List */}
        <AnimatePresence>
          {curveExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5 space-y-2.5">
                {FORGETTING_TOPICS.map((topic, i) => {
                  const cfg = statusConfig[topic.status];
                  return (
                    <motion.div
                      key={topic.topic}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className={`flex items-center gap-4 p-3.5 rounded-xl border ${cfg.bg} ${cfg.border} transition-all hover:shadow-sm`}
                    >
                      {/* Warning icon */}
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        topic.status === "critical" ? "bg-red-100 dark:bg-red-500/15" :
                        topic.status === "warning" ? "bg-amber-100 dark:bg-amber-500/15" :
                        "bg-emerald-100 dark:bg-emerald-500/15"
                      }`}>
                        {topic.status === "critical" ? (
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        ) : topic.status === "warning" ? (
                          <Clock className="w-4 h-4 text-amber-500" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        )}
                      </div>

                      {/* Topic info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{topic.topic}</p>
                          <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold ${cfg.badge}`}>{cfg.label}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[11px] text-gray-400">{topic.subject}</span>
                          <span className="text-[11px] text-gray-400">•</span>
                          <span className="text-[11px] text-gray-400">Studied {topic.lastStudied}</span>
                          <span className="text-[11px] text-gray-400">•</span>
                          <span className="text-[11px] text-gray-400">{topic.revisionCount} revision{topic.revisionCount !== 1 ? "s" : ""}</span>
                        </div>
                        {/* Retention bar */}
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 h-1.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${topic.retention}%` }}
                              transition={{ duration: 0.8, delay: 0.3 + i * 0.05 }}
                              className={`h-full rounded-full bg-gradient-to-r ${cfg.bar}`}
                            />
                          </div>
                          <span className={`text-xs font-bold tabular-nums w-10 text-right ${cfg.text}`}>{topic.retention}%</span>
                        </div>
                      </div>

                      {/* Mini decay curve */}
                      <div className="hidden md:block">
                        <DecayCurve retention={topic.retention} hoursAgo={topic.hoursAgo} />
                      </div>

                      {/* Revise button */}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5 ${
                          topic.status === "critical"
                            ? "bg-red-500 text-white shadow-md shadow-red-500/20 hover:bg-red-600"
                            : topic.status === "warning"
                            ? "bg-amber-500 text-white shadow-md shadow-amber-500/20 hover:bg-amber-600"
                            : "bg-gray-100 text-gray-500 dark:bg-white/8 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/12"
                        }`}
                      >
                        <RotateCcw className="w-3 h-3" />
                        {topic.status === "critical" ? "Revise NOW" : topic.status === "warning" ? "Revise" : "Review"}
                      </motion.button>
                    </motion.div>
                  );
                })}
              </div>

              {/* Theory note footer */}
              <div className="px-5 pb-4">
                <div className="flex items-start gap-2 p-3 rounded-xl bg-[#7c3aed]/5 dark:bg-[#7c3aed]/8 border border-[#7c3aed]/10">
                  <Sparkles className="w-4 h-4 text-[#7c3aed] shrink-0 mt-0.5" />
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                    <span className="font-bold text-[#7c3aed]">Ebbinghaus&apos;s Forgetting Curve:</span> Memory retention decays exponentially — <em>R = e<sup>−t/S</sup></em> — unless reinforced through spaced repetition. Optimal intervals: 1 day → 3 days → 7 days → 14 days → 30 days. Topics shown above are prioritized by predicted memory loss.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

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
