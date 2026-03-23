"use client";
import { Upload } from "@/components/upload";
import { Chat } from "@/components/chat";
import { useState } from "react";
import { FlashCards } from "@/components/flash-cards";
import { MindMap } from "@/components/mind-map";
import { motion } from "framer-motion";
import { Sparkles, BookOpen, Brain, Zap } from "lucide-react";

export default function Home() {
  const [taskId, setTaskId] = useState<string | null>(null);

  const handleTaskIdUpdate = (newTaskId: string) => {
    setTimeout(() => {
      setTaskId(newTaskId);
    }, 1000);
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-6 py-8 max-w-5xl">
        {/* Hero section when no task */}
        {!taskId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Welcome header */}
            <div className="text-center mb-2">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#7c3aed]/8 text-[#7c3aed] text-sm font-semibold mb-4 border border-[#7c3aed]/10"
              >
                <Sparkles className="w-4 h-4" />
                AI-Powered Learning Platform
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-4xl md:text-5xl font-black tracking-tight text-gray-900 dark:text-white mb-3"
              >
                Transform how you <span className="gradient-text">study</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-gray-500 dark:text-gray-400 text-lg max-w-2xl mx-auto"
              >
                Upload lectures, PDFs, or YouTube videos — get AI-generated notes, flashcards, mind maps, and quizzes.
              </motion.p>
            </div>

            {/* Feature chips */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="flex flex-wrap justify-center gap-3 mb-4"
            >
              {[
                { icon: <BookOpen className="w-4 h-4" />, label: "Smart Notes" },
                { icon: <Brain className="w-4 h-4" />, label: "Auto Flashcards" },
                { icon: <Zap className="w-4 h-4" />, label: "AI Quizzes" },
              ].map((chip, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-white/5 text-gray-600 dark:text-gray-400 text-sm font-medium shadow-sm border border-gray-100 dark:border-white/8"
                >
                  <span className="text-[#7c3aed]">{chip.icon}</span>
                  {chip.label}
                </div>
              ))}
            </motion.div>

            {/* Upload component */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex justify-center"
            >
              <div className="w-full max-w-4xl">
                <Upload onTaskIdUpdate={handleTaskIdUpdate} />
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* After upload: show grid layout with content */}
        {taskId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            <div className="space-y-8">
              <Upload onTaskIdUpdate={handleTaskIdUpdate} />
              <div className="space-y-4">
                <FlashCards taskId={taskId} />
                <MindMap taskId={taskId} />
              </div>
            </div>

            <div className="space-y-8">
              <Chat taskId={taskId} />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
