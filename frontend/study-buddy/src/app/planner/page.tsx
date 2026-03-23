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
  RefreshCw,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
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

      // Check if the plan has a valid schedule
      if (data.schedule && data.schedule.length > 0) {
        setPlan(data);
      } else {
        // API returned but no valid schedule — use fallback
        setPlan(generateFallbackPlan());
      }
      setExpandedDay(0);
    } catch {
      // API failed — use local fallback plan
      setPlan(generateFallbackPlan());
      setExpandedDay(0);
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "medium":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "low":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-to-r from-[#7c3aed] to-[#5b21b6] p-6 text-white shadow-xl"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <Calendar className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Study Planner</h1>
            <p className="text-white/70 text-sm">
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
          className="rounded-2xl bg-white dark:bg-[#1e1e2e] border border-gray-200 dark:border-white/10 p-6 shadow-sm space-y-5"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                <BookOpen className="w-4 h-4 inline mr-1" />
                Exam Name *
              </label>
              <input
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                placeholder="e.g. Final Semester Exam"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                <Calendar className="w-4 h-4 inline mr-1" />
                Exam Date *
              </label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              <Target className="w-4 h-4 inline mr-1" />
              Subjects / Topics *
            </label>
            <textarea
              value={subjects}
              onChange={(e) => setSubjects(e.target.value)}
              placeholder="e.g. Physics (Mechanics, Optics), Math (Calculus, Linear Algebra), Chemistry (Organic, Inorganic)"
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/50 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                <AlertTriangle className="w-4 h-4 inline mr-1" />
                Weak Areas (optional)
              </label>
              <input
                value={weakAreas}
                onChange={(e) => setWeakAreas(e.target.value)}
                placeholder="e.g. Calculus, Organic Chemistry"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                <Clock className="w-4 h-4 inline mr-1" />
                Daily Study Hours
              </label>
              <input
                type="number"
                min={1}
                max={12}
                value={dailyHours}
                onChange={(e) => setDailyHours(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/50"
              />
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold text-base transition shadow-lg shadow-[#7c3aed]/25 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating your plan...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Study Plan
              </>
            )}
          </button>
        </motion.form>
      )}

      {/* Plan Display */}
      {plan && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Plan header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                {plan.planName || `Plan for ${examName}`}
              </h2>
              <p className="text-sm text-gray-500">
                {plan.totalDays || plan.schedule?.length || 0} days •{" "}
                {plan.dailyHours || dailyHours}h/day
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPlan(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 text-sm hover:bg-gray-200 dark:hover:bg-white/20 transition cursor-pointer"
              >
                New Plan
              </button>
            </div>
          </div>

          {/* Tips */}
          {plan.tips && plan.tips.length > 0 && (
            <div className="rounded-xl bg-[#7c3aed]/5 border border-[#7c3aed]/20 p-4">
              <p className="text-sm font-semibold text-[#7c3aed] mb-2">
                💡 Tips
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                {plan.tips.map((tip, i) => (
                  <li key={i}>• {tip}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Schedule */}
          <div className="space-y-3">
            {plan.schedule?.map((day, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="rounded-xl bg-white dark:bg-[#1e1e2e] border border-gray-200 dark:border-white/10 overflow-hidden shadow-sm"
              >
                <button
                  onClick={() =>
                    setExpandedDay(expandedDay === idx ? null : idx)
                  }
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#7c3aed]/10 flex items-center justify-center text-[#7c3aed] font-bold text-sm">
                      D{day.day || idx + 1}
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-800 dark:text-white text-sm">
                        Day {day.day || idx + 1}
                        {day.date && (
                          <span className="text-gray-400 ml-2">
                            {day.date}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
                        {day.topics?.length || 0} topics
                      </p>
                    </div>
                  </div>
                  {expandedDay === idx ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                <AnimatePresence>
                  {expandedDay === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-gray-100 dark:border-white/5"
                    >
                      <div className="p-4 space-y-3">
                        {day.topics?.map((topic, ti) => (
                          <div
                            key={ti}
                            className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-white/5"
                          >
                            <CheckCircle2 className="w-5 h-5 text-gray-300 dark:text-white/20 mt-0.5 shrink-0" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium text-gray-800 dark:text-white text-sm">
                                  {topic.subject}
                                </p>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getPriorityColor(
                                    topic.priority
                                  )}`}
                                >
                                  {topic.priority}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {topic.duration}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                                {topic.topic}
                              </p>
                              {topic.tips && (
                                <p className="text-xs text-[#7c3aed] mt-1">
                                  💡 {topic.tips}
                                </p>
                              )}
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
