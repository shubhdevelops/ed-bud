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
    } catch (err) {
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
    // Simple markdown-like rendering
    return content.split("\n").map((line, i) => {
      if (line.startsWith("# "))
        return (
          <h2 key={i} className="text-lg font-bold mt-3 mb-1">
            {line.slice(2)}
          </h2>
        );
      if (line.startsWith("## "))
        return (
          <h3 key={i} className="text-base font-semibold mt-2 mb-1">
            {line.slice(3)}
          </h3>
        );
      if (line.startsWith("- ") || line.startsWith("* "))
        return (
          <li key={i} className="ml-4 list-disc">
            {line.slice(2)}
          </li>
        );
      if (line.startsWith("```"))
        return (
          <code key={i} className="block bg-black/20 rounded p-2 text-sm font-mono my-1">
            {line.slice(3)}
          </code>
        );
      if (line.startsWith("**") && line.endsWith("**"))
        return (
          <p key={i} className="font-bold">
            {line.slice(2, -2)}
          </p>
        );
      if (line.trim() === "") return <br key={i} />;
      return <p key={i} className="leading-relaxed">{line}</p>;
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] max-w-4xl mx-auto p-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-to-r from-[#7c3aed] to-[#5b21b6] p-6 mb-4 text-white shadow-xl"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Bot className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">AI Tutor</h1>
              <p className="text-white/70 text-sm">
                Ask any doubt — get clear, detailed explanations
              </p>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition text-sm cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>
      </motion.div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto rounded-2xl bg-white/80 dark:bg-[#1e1e2e]/80 backdrop-blur-sm border border-gray-200 dark:border-white/10 p-4 space-y-4 mb-4">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-full text-gray-400"
          >
            <Sparkles className="w-16 h-16 mb-4 text-[#7c3aed]/40" />
            <p className="text-lg font-medium">Ask me anything!</p>
            <p className="text-sm mt-1">
              I can explain concepts, solve problems, and help you study
            </p>
            <div className="flex flex-wrap gap-2 mt-6 max-w-md justify-center">
              {[
                "Explain photosynthesis",
                "What is Newton's 3rd law?",
                "Solve: 2x + 5 = 15",
                "Explain binary search",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    setInput(q);
                    inputRef.current?.focus();
                  }}
                  className="px-3 py-2 rounded-xl bg-[#7c3aed]/10 text-[#7c3aed] text-sm hover:bg-[#7c3aed]/20 transition cursor-pointer"
                >
                  {q}
                </button>
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
              transition={{ duration: 0.2 }}
              className={`flex gap-3 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-lg bg-[#7c3aed] flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-[#7c3aed] text-white rounded-br-md"
                    : "bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-gray-200 rounded-bl-md"
                }`}
              >
                {msg.role === "assistant"
                  ? renderContent(msg.content)
                  : <p>{msg.content}</p>}
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-lg bg-gray-300 dark:bg-white/20 flex items-center justify-center shrink-0 mt-1">
                  <User className="w-5 h-5 text-gray-600 dark:text-white" />
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
            <div className="w-8 h-8 rounded-lg bg-[#7c3aed] flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="bg-gray-100 dark:bg-white/10 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your doubt here..."
          disabled={isLoading}
          className="flex-1 px-5 py-4 rounded-2xl bg-white dark:bg-[#1e1e2e] border border-gray-200 dark:border-white/10 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/50 shadow-sm text-base"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="px-6 py-4 rounded-2xl bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-50 text-white transition shadow-lg shadow-[#7c3aed]/25 cursor-pointer"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
