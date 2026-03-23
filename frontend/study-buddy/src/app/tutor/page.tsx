"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Trash2,
  Bot,
  User,
  Sparkles,
  Loader2,
  Zap,
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function TutorPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);

    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: userMessage },
    ];
    setMessages(newMessages);

    try {
      const response = await fetch("http://localhost:5001/api/tutor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          history: newMessages,
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Failed to get response");

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I couldn't process your question. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    fetch("http://localhost:5001/api/tutor/clear", { method: "POST" });
  };

  const renderContent = (content: string) => {
    return content.split("\n").map((line, i) => {
      if (line.startsWith("# "))
        return (
          <h2 key={i} className="text-lg font-bold mt-3 mb-1 text-gray-800 dark:text-white">
            {line.slice(2)}
          </h2>
        );
      if (line.startsWith("## "))
        return (
          <h3 key={i} className="text-base font-semibold mt-2 mb-1 text-gray-700 dark:text-gray-200">
            {line.slice(3)}
          </h3>
        );
      if (line.startsWith("- ") || line.startsWith("* "))
        return (
          <li key={i} className="ml-4 list-disc text-gray-600 dark:text-gray-300">
            {line.slice(2)}
          </li>
        );
      if (line.startsWith("```"))
        return (
          <code key={i} className="block bg-black/10 dark:bg-white/10 rounded-lg p-2.5 text-sm font-mono my-1.5 border border-black/5 dark:border-white/5">
            {line.slice(3)}
          </code>
        );
      if (line.startsWith("**") && line.endsWith("**"))
        return (
          <p key={i} className="font-bold text-gray-800 dark:text-white">
            {line.slice(2, -2)}
          </p>
        );
      if (line.trim() === "") return <br key={i} />;
      return <p key={i} className="leading-relaxed text-gray-600 dark:text-gray-300">{line}</p>;
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] max-w-4xl mx-auto p-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl gradient-animated p-6 mb-4 text-white shadow-2xl shadow-[#7c3aed]/20 relative overflow-hidden"
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-10 w-20 h-20 bg-white/5 rounded-full translate-y-1/2" />

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">AI Tutor</h1>
              <p className="text-white/60 text-sm font-medium">
                Ask any doubt — get instant, detailed explanations
              </p>
            </div>
          </div>
          {messages.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={clearChat}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm transition text-sm cursor-pointer border border-white/10"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto rounded-2xl glass p-5 space-y-4 mb-4 shadow-sm">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-full"
          >
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#7c3aed]/10 to-[#6366f1]/10 flex items-center justify-center mb-5 animate-float">
              <Sparkles className="w-10 h-10 text-[#7c3aed]/50" />
            </div>
            <p className="text-xl font-bold gradient-text mb-1">Ask me anything!</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-8">
              I can explain concepts, solve problems, and help you study
            </p>
            <div className="flex flex-wrap gap-2 max-w-lg justify-center">
              {[
                { q: "Explain photosynthesis", icon: "🌱" },
                { q: "What is Newton's 3rd law?", icon: "🍎" },
                { q: "Solve: 2x + 5 = 15", icon: "🧮" },
                { q: "Explain binary search", icon: "💻" },
              ].map(({ q, icon }) => (
                <motion.button
                  key={q}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setInput(q);
                    inputRef.current?.focus();
                  }}
                  className="px-4 py-2.5 rounded-xl bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 text-sm hover:shadow-md transition card-hover cursor-pointer border border-gray-100 dark:border-white/10"
                >
                  <span className="mr-2">{icon}</span>
                  {q}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className={`flex gap-3 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#6366f1] flex items-center justify-center shrink-0 mt-1 shadow-md shadow-[#7c3aed]/20">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-gradient-to-r from-[#7c3aed] to-[#6366f1] text-white rounded-br-md shadow-lg shadow-[#7c3aed]/15"
                    : "bg-white dark:bg-white/[0.06] text-gray-800 dark:text-gray-200 rounded-bl-md shadow-sm border border-gray-100 dark:border-white/5"
                }`}
              >
                {msg.role === "assistant"
                  ? renderContent(msg.content)
                  : <p className="leading-relaxed">{msg.content}</p>}
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-xl bg-gray-200 dark:bg-white/10 flex items-center justify-center shrink-0 mt-1">
                  <User className="w-4 h-4 text-gray-500 dark:text-white/60" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#6366f1] flex items-center justify-center shrink-0 shadow-md shadow-[#7c3aed]/20">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white dark:bg-white/[0.06] rounded-2xl rounded-bl-md px-4 py-3 border border-gray-100 dark:border-white/5">
              <div className="flex items-center gap-2 text-gray-400">
                <div className="flex gap-1">
                  <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-2 h-2 rounded-full bg-[#7c3aed]/40" />
                  <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-2 h-2 rounded-full bg-[#7c3aed]/40" />
                  <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-2 h-2 rounded-full bg-[#7c3aed]/40" />
                </div>
                <span className="text-sm ml-1">Thinking...</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your doubt here..."
            disabled={isLoading}
            className="w-full px-5 py-4 rounded-2xl bg-white dark:bg-[#151525] border border-gray-200 dark:border-white/8 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/40 focus:border-[#7c3aed]/50 shadow-sm text-base transition-all"
          />
          <Zap className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 dark:text-white/15" />
        </div>
        <motion.button
          type="submit"
          disabled={isLoading || !input.trim()}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="px-6 py-4 rounded-2xl bg-gradient-to-r from-[#7c3aed] to-[#6366f1] hover:shadow-xl hover:shadow-[#7c3aed]/25 disabled:opacity-40 text-white transition-all shadow-lg shadow-[#7c3aed]/20 cursor-pointer btn-premium"
        >
          <Send className="w-5 h-5" />
        </motion.button>
      </form>
    </div>
  );
}
