"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  BookOpen,
  Target,
  Loader2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Zap,
} from "lucide-react";

interface Topic {
  subject: string;
  topic: string;
  duration: string;
  priority: string;
  tips: string;
}

interface DaySchedule {
  day: number;
  date?: string;
  topics: Topic[];
}

interface StudyPlan {
  _id?: string;
  planName: string;
  totalDays?: number;
  dailyHours?: number;
  schedule: DaySchedule[];
  weeklyGoals?: string[];
  tips?: string[];
}

export default function PlannerPage() {
  const [examName, setExamName] = useState("");
  const [examDate, setExamDate] = useState("");
  const [subjects, setSubjects] = useState("");
  const [weakAreas, setWeakAreas] = useState("");
  const [dailyHours, setDailyHours] = useState(4);
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedDay, setExpandedDay] = useState<number | null>(0);
  const [error, setError] = useState("");

  const generateFallbackPlan = (): StudyPlan => {
    const subjectList = subjects.split(",").map((s) => s.trim()).filter(Boolean);
    const days = Math.min(14, Math.max(3, subjectList.length * 2));
    const schedule: DaySchedule[] = [];

    for (let d = 0; d < days; d++) {
      const dayTopics: Topic[] = [];
      const subjectsPerDay = Math.min(3, subjectList.length);
      for (let t = 0; t < subjectsPerDay; t++) {
        const subj = subjectList[(d * subjectsPerDay + t) % subjectList.length];
        const isWeak = weakAreas.toLowerCase().includes(subj.toLowerCase());
        dayTopics.push({
          subject: subj,
          topic: `Review and practice ${subj}`,
          duration: `${Math.round(dailyHours / subjectsPerDay)} hours`,
          priority: isWeak ? "high" : d < days / 2 ? "medium" : "low",
          tips: isWeak ? "Focus extra time here — this is a weak area" : "Practice with examples",
        });
      }
      const date = new Date();
      date.setDate(date.getDate() + d);
      schedule.push({ day: d + 1, date: date.toISOString().split("T")[0], topics: dayTopics });
    }

    return {
      planName: `Study Plan for ${examName}`,
      totalDays: days,
      dailyHours,
      schedule,
      weeklyGoals: [`Complete ${subjectList.slice(0, 3).join(", ")} basics`, "Revise weak areas"],
      tips: [
        "Start with your weakest subjects when your energy is highest",
        "Take a 10-minute break every hour",
        `Dedicate ${dailyHours}h/day consistently until ${examDate}`,
      ],
    };
  };

  const generatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examName || !examDate || !subjects) {
      setError("Please fill in exam name, date, and subjects");
      return;
    }
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:5001/api/planner/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examName, examDate, subjects, weakAreas, dailyHours }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.schedule && data.schedule.length > 0) {
        setPlan(data);
      } else {
        setPlan(generateFallbackPlan());
      }
      setExpandedDay(0);
    } catch {
      setPlan(generateFallbackPlan());
      setExpandedDay(0);
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400 border border-red-100 dark:border-red-500/20";
      case "medium":
        return "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20";
      case "low":
        return "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20";
      default:
        return "bg-gray-50 text-gray-600 dark:bg-white/5 dark:text-gray-400 border border-gray-100 dark:border-white/10";
    }
  };

  const inputClass = "w-full px-4 py-3.5 rounded-xl bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/8 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/40 focus:border-[#7c3aed]/50 transition-all text-sm";

  return (
    <div className="max-w-5xl mx-auto p-4 pb-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl gradient-animated p-6 text-white shadow-2xl shadow-[#7c3aed]/20 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-10 w-20 h-20 bg-white/5 rounded-full translate-y-1/2" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Study Planner</h1>
            <p className="text-white/60 text-sm font-medium">
              AI-generated personalized study schedule
            </p>
          </div>
        </div>
      </motion.div>

      {/* Form */}
      {!plan && (
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={generatePlan}
          className="rounded-2xl glass p-7 shadow-sm space-y-5"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                <BookOpen className="w-4 h-4 text-[#7c3aed]" />
                Exam Name
              </label>
              <input value={examName} onChange={(e) => setExamName(e.target.value)} placeholder="e.g. Final Semester Exam" className={inputClass} />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                <Calendar className="w-4 h-4 text-[#7c3aed]" />
                Exam Date
              </label>
              <input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} className={inputClass} />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
              <Target className="w-4 h-4 text-[#7c3aed]" />
              Subjects / Topics
            </label>
            <textarea
              value={subjects} onChange={(e) => setSubjects(e.target.value)}
              placeholder="e.g. Physics (Mechanics, Optics), Math (Calculus, Linear Algebra)"
              rows={3} className={`${inputClass} resize-none`}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Weak Areas <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input value={weakAreas} onChange={(e) => setWeakAreas(e.target.value)} placeholder="e.g. Calculus, Organic Chemistry" className={inputClass} />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                <Clock className="w-4 h-4 text-[#7c3aed]" />
                Daily Study Hours
              </label>
              <input type="number" min={1} max={12} value={dailyHours} onChange={(e) => setDailyHours(Number(e.target.value))} className={inputClass} />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <motion.button
            type="submit"
            disabled={isLoading}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#6366f1] text-white font-semibold text-base transition shadow-lg shadow-[#7c3aed]/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer btn-premium"
          >
            {isLoading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Generating your plan...</>
            ) : (
              <><Sparkles className="w-5 h-5" /> Generate Study Plan</>
            )}
          </motion.button>
        </motion.form>
      )}

      {/* Plan Display */}
      {plan && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">{plan.planName || `Plan for ${examName}`}</h2>
              <p className="text-sm text-gray-500">{plan.totalDays || plan.schedule?.length || 0} days • {plan.dailyHours || dailyHours}h/day</p>
            </div>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setPlan(null)} className="px-4 py-2 rounded-xl bg-white dark:bg-white/5 text-gray-600 dark:text-gray-300 text-sm hover:shadow-md transition cursor-pointer border border-gray-200 dark:border-white/10">
              New Plan
            </motion.button>
          </div>

          {plan.tips && plan.tips.length > 0 && (
            <div className="rounded-xl glass p-4 border-l-4 border-[#7c3aed]">
              <p className="text-sm font-bold text-[#7c3aed] mb-2 flex items-center gap-1.5"><Zap className="w-4 h-4" /> Pro Tips</p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                {plan.tips.map((tip, i) => <li key={i}>• {tip}</li>)}
              </ul>
            </div>
          )}

          <div className="space-y-2.5">
            {plan.schedule?.map((day, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="rounded-xl glass overflow-hidden card-hover"
              >
                <button
                  onClick={() => setExpandedDay(expandedDay === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-4 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7c3aed]/10 to-[#6366f1]/10 flex items-center justify-center text-[#7c3aed] font-bold text-sm border border-[#7c3aed]/10">
                      D{day.day || idx + 1}
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-800 dark:text-white text-sm">
                        Day {day.day || idx + 1}
                        {day.date && <span className="text-gray-400 ml-2 font-normal">{day.date}</span>}
                      </p>
                      <p className="text-xs text-gray-400">{day.topics?.length || 0} topics</p>
                    </div>
                  </div>
                  {expandedDay === idx ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </button>

                <AnimatePresence>
                  {expandedDay === idx && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-gray-100 dark:border-white/5">
                      <div className="p-4 space-y-2.5">
                        {day.topics?.map((topic, ti) => (
                          <div key={ti} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5">
                            <CheckCircle2 className="w-5 h-5 text-gray-300 dark:text-white/15 mt-0.5 shrink-0" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-gray-800 dark:text-white text-sm">{topic.subject}</p>
                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${getPriorityColor(topic.priority)}`}>{topic.priority}</span>
                                <span className="text-xs text-gray-400 font-medium">{topic.duration}</span>
                              </div>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{topic.topic}</p>
                              {topic.tips && <p className="text-xs text-[#7c3aed] mt-1 font-medium">💡 {topic.tips}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
