"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Upload,
  Loader2,
  CheckCircle,
  XCircle,
  ArrowRight,
  RotateCcw,
  Target,
  FileText,
  ChevronRight,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  topic: string;
  difficulty: string;
}

interface Result {
  score: number;
  total: number;
  accuracy: number;
  weakTopics: Record<string, number>;
  answers: Array<{
    questionId: number;
    correct: boolean;
    userAnswer: number;
    correctAnswer: number;
    explanation: string;
  }>;
}

type ViewMode = "upload" | "quiz" | "results";

const SAMPLE_QUESTIONS: Question[] = [
  {
    id: 1,
    question: "What is the powerhouse of the cell?",
    options: ["Nucleus", "Mitochondria", "Ribosome", "Endoplasmic Reticulum"],
    correctAnswer: 1,
    explanation: "Mitochondria generate most of the cell's supply of ATP, used as a source of chemical energy.",
    topic: "Biology",
    difficulty: "easy",
  },
  {
    id: 2,
    question: "Which data structure uses FIFO (First In, First Out)?",
    options: ["Stack", "Queue", "Tree", "Graph"],
    correctAnswer: 1,
    explanation: "A Queue follows First In First Out — the first element added is the first to be removed.",
    topic: "Computer Science",
    difficulty: "easy",
  },
  {
    id: 3,
    question: "What is Newton's second law of motion?",
    options: ["F = ma", "E = mc²", "V = IR", "PV = nRT"],
    correctAnswer: 0,
    explanation: "Newton's second law states that Force equals mass times acceleration (F = ma).",
    topic: "Physics",
    difficulty: "medium",
  },
  {
    id: 4,
    question: "What is the derivative of sin(x)?",
    options: ["-cos(x)", "cos(x)", "tan(x)", "-sin(x)"],
    correctAnswer: 1,
    explanation: "The derivative of sin(x) with respect to x is cos(x).",
    topic: "Mathematics",
    difficulty: "medium",
  },
  {
    id: 5,
    question: "Which sorting algorithm has worst-case O(n log n)?",
    options: ["Bubble Sort", "Quick Sort", "Merge Sort", "Selection Sort"],
    correctAnswer: 2,
    explanation: "Merge Sort guarantees O(n log n) in all cases — best, average, and worst.",
    topic: "Computer Science",
    difficulty: "medium",
  },
];

export default function PracticePage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Array<{ questionId: number; answer: number; timeTaken: number }>>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [view, setView] = useState<ViewMode>("upload");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showExplanation, setShowExplanation] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [startTime, setStartTime] = useState(Date.now());
  const [numQuestions, setNumQuestions] = useState(5);

  const startSampleQuiz = () => {
    setQuestions(SAMPLE_QUESTIONS);
    setView("quiz");
    setCurrentQ(0);
    setAnswers([]);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setStartTime(Date.now());
  };

  const generateFromFile = async (file: File) => {
    setError("");
    setIsLoading(true);
    setUploadedFileName(file.name);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("numQuestions", String(numQuestions));

      const res = await fetch("http://localhost:5001/api/practice/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(`Error: ${data.error || "Failed to process PDF"}`);
        setIsLoading(false);
        return;
      }

      if (!data.questions || data.questions.length === 0) {
        setError("AI could not generate questions. Please try again.");
        setIsLoading(false);
        return;
      }

      const validQuestions = data.questions.filter(
        (q: Question) => q.question && q.options && q.options.length >= 2 && typeof q.correctAnswer === "number"
      );

      if (validQuestions.length === 0) {
        setError("Questions had invalid format. Please try again.");
        setIsLoading(false);
        return;
      }

      const questionsWithIds = validQuestions.map((q: Question, i: number) => ({
        ...q,
        id: q.id || i + 1,
        topic: q.topic || "From PDF",
        difficulty: q.difficulty || "medium",
        explanation: q.explanation || "",
      }));

      setQuestions(questionsWithIds);
      setView("quiz");
      setCurrentQ(0);
      setAnswers([]);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setStartTime(Date.now());
    } catch (err: unknown) {
      console.error("Upload error:", err);
      setError("Could not connect to backend. Make sure server is running on port 5001.");
    } finally {
      setIsLoading(false);
    }
  };

  const selectAnswer = (optionIdx: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(optionIdx);
    setShowExplanation(true);
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    setAnswers((prev) => [...prev, { questionId: questions[currentQ].id, answer: optionIdx, timeTaken }]);
  };

  const nextQuestion = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setStartTime(Date.now());
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    let correct = 0;
    const weakTopics: Record<string, number> = {};
    const resultAnswers = questions.map((q, i) => {
      const userAns = answers[i]?.answer ?? -1;
      const isCorrect = userAns === q.correctAnswer;
      if (isCorrect) correct++;
      else weakTopics[q.topic] = (weakTopics[q.topic] || 0) + 1;
      return { questionId: q.id, correct: isCorrect, userAnswer: userAns, correctAnswer: q.correctAnswer, explanation: q.explanation };
    });
    setResult({ score: correct, total: questions.length, accuracy: Math.round((correct / questions.length) * 100), weakTopics, answers: resultAnswers });
    setView("results");
    fetch("http://localhost:5001/api/practice/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answers, questions }) }).catch(() => {});
  };

  const practiceWeakAreas = async () => {
    if (!result?.weakTopics || Object.keys(result.weakTopics).length === 0) return;
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:5001/api/practice/targeted", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ weakTopics: result.weakTopics }) });
      const data = await res.json();
      if (data.questions?.length) setQuestions(data.questions);
      else setQuestions(SAMPLE_QUESTIONS);
    } catch {
      setQuestions(SAMPLE_QUESTIONS);
    }
    setView("quiz");
    setCurrentQ(0);
    setAnswers([]);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setResult(null);
    setStartTime(Date.now());
    setIsLoading(false);
  };

  const resetAll = () => {
    setView("upload");
    setQuestions([]);
    setAnswers([]);
    setResult(null);
    setCurrentQ(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setError("");
    setUploadedFileName("");
  };

  return (
    <div className="max-w-4xl mx-auto p-4 pb-8 space-y-6">
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
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Adaptive Practice</h1>
            <p className="text-white/60 text-sm font-medium">
              Upload a PDF to generate quiz questions • Track weak areas
            </p>
          </div>
        </div>
      </motion.div>

      {/* UPLOAD VIEW */}
      {view === "upload" && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="rounded-2xl glass p-7 shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-[#7c3aed]" />
              Upload PDF to Generate Questions
            </h2>

            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl p-12 text-center cursor-pointer hover:border-[#7c3aed]/40 hover:bg-[#7c3aed]/[0.02] transition-all group"
            >
              <div className="w-16 h-16 rounded-2xl bg-[#7c3aed]/8 flex items-center justify-center mx-auto mb-4 group-hover:bg-[#7c3aed]/15 transition-colors">
                <FileText className="w-8 h-8 text-[#7c3aed]/50 group-hover:text-[#7c3aed]/80 transition-colors" />
              </div>
              <p className="text-base font-semibold text-gray-600 dark:text-gray-300">
                {isLoading ? "Processing..." : "Click to upload a PDF file"}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Questions will be auto-generated from the content
              </p>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) generateFromFile(e.target.files[0]);
                }}
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                <Zap className="w-4 h-4 text-[#7c3aed]" />
                Number of Questions
              </label>
              <select
                value={numQuestions}
                onChange={(e) => setNumQuestions(Number(e.target.value))}
                className="w-full px-4 py-3.5 rounded-xl bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/8 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/40 text-sm"
              >
                {[3, 5, 7, 10].map((n) => (
                  <option key={n} value={n}>{n} questions</option>
                ))}
              </select>
            </div>

            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-sm bg-red-50 dark:bg-red-500/10 px-4 py-2.5 rounded-xl border border-red-100 dark:border-red-500/20">
                {error}
              </motion.p>
            )}

            {isLoading && (
              <div className="flex items-center justify-center gap-3 py-4">
                <Loader2 className="w-5 h-5 animate-spin text-[#7c3aed]" />
                <span className="text-gray-500 text-sm">Generating questions from {uploadedFileName}...</span>
              </div>
            )}
          </div>

          {/* Sample quiz */}
          <div className="rounded-2xl glass p-6 shadow-sm">
            <h3 className="text-base font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#7c3aed]" />
              Or try a sample quiz
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Test the practice system with 5 built-in questions across Biology, Physics, Math, and Computer Science.
            </p>
            <motion.button
              onClick={startSampleQuiz}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#6366f1] text-white font-semibold transition shadow-lg shadow-[#7c3aed]/20 flex items-center justify-center gap-2 cursor-pointer btn-premium"
            >
              <Brain className="w-5 h-5" />
              Start Sample Quiz
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* QUIZ VIEW */}
      {view === "quiz" && questions.length > 0 && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
          {/* Progress */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#7c3aed] to-[#6366f1] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
              />
            </div>
            <span className="text-sm text-gray-400 font-bold tabular-nums">
              {currentQ + 1}/{questions.length}
            </span>
          </div>

          {/* Question Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQ}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              className="rounded-2xl glass p-7 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-5">
                <span className="px-3 py-1 rounded-lg bg-[#7c3aed]/10 text-[#7c3aed] text-xs font-bold border border-[#7c3aed]/15">
                  {questions[currentQ].topic}
                </span>
                <span className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-500 text-xs font-medium border border-gray-100 dark:border-white/5">
                  {questions[currentQ].difficulty}
                </span>
              </div>

              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 leading-relaxed">
                {questions[currentQ].question}
              </h3>

              <div className="space-y-3">
                {questions[currentQ].options?.map((option, idx) => {
                  const isSelected = selectedAnswer === idx;
                  const isCorrect = idx === questions[currentQ].correctAnswer;
                  const showResult = selectedAnswer !== null;

                  let optionStyle = "bg-white dark:bg-white/[0.03] border-gray-150 dark:border-white/8 hover:border-[#7c3aed]/40 hover:shadow-md cursor-pointer";

                  if (showResult) {
                    if (isCorrect) {
                      optionStyle = "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-400 dark:border-emerald-500/30";
                    } else if (isSelected && !isCorrect) {
                      optionStyle = "bg-red-50 dark:bg-red-500/10 border-red-400 dark:border-red-500/30";
                    } else {
                      optionStyle = "bg-gray-50 dark:bg-white/[0.02] border-gray-100 dark:border-white/5 opacity-40";
                    }
                  }

                  return (
                    <motion.button
                      key={idx}
                      whileHover={!showResult ? { scale: 1.005, x: 3 } : {}}
                      whileTap={!showResult ? { scale: 0.99 } : {}}
                      onClick={() => selectAnswer(idx)}
                      disabled={selectedAnswer !== null}
                      className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all flex items-center gap-3 ${optionStyle}`}
                    >
                      <span className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-white/8 border border-gray-200 dark:border-white/10 flex items-center justify-center text-sm font-bold text-gray-500 dark:text-gray-400 shrink-0">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{option}</span>
                      {showResult && isCorrect && <CheckCircle className="w-5 h-5 ml-auto text-emerald-500 shrink-0" />}
                      {showResult && isSelected && !isCorrect && <XCircle className="w-5 h-5 ml-auto text-red-500 shrink-0" />}
                    </motion.button>
                  );
                })}
              </div>

              {showExplanation && questions[currentQ].explanation && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-5 p-4 rounded-xl bg-blue-50 dark:bg-blue-500/8 border border-blue-200 dark:border-blue-500/15"
                >
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <span className="font-bold">💡 Explanation: </span>
                    {questions[currentQ].explanation}
                  </p>
                </motion.div>
              )}

              {selectedAnswer !== null && (
                <motion.button
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={nextQuestion}
                  className="w-full mt-5 py-3.5 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#6366f1] text-white font-semibold transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#7c3aed]/20 btn-premium"
                >
                  {currentQ < questions.length - 1 ? (
                    <>Next Question <ArrowRight className="w-4 h-4" /></>
                  ) : (
                    <>View Results <ChevronRight className="w-4 h-4" /></>
                  )}
                </motion.button>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}

      {/* RESULTS VIEW */}
      {view === "results" && result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="rounded-2xl glass p-8 text-center shadow-sm">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
              className={`w-28 h-28 rounded-3xl mx-auto mb-5 flex items-center justify-center text-3xl font-black ${
                result.accuracy >= 70
                  ? "bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600 dark:from-emerald-900/30 dark:to-emerald-900/10 dark:text-emerald-400"
                  : result.accuracy >= 40
                  ? "bg-gradient-to-br from-amber-100 to-amber-50 text-amber-600 dark:from-amber-900/30 dark:to-amber-900/10 dark:text-amber-400"
                  : "bg-gradient-to-br from-red-100 to-red-50 text-red-600 dark:from-red-900/30 dark:to-red-900/10 dark:text-red-400"
              }`}
            >
              {result.accuracy}%
            </motion.div>
            <h2 className="text-2xl font-black text-gray-800 dark:text-white">
              {result.score}/{result.total} Correct
            </h2>
            <p className="text-sm text-gray-400 mt-2 flex items-center justify-center gap-1.5">
              <Trophy className="w-4 h-4" />
              {result.accuracy >= 70 ? "Great job! 🎉" : result.accuracy >= 40 ? "Keep practicing! 💪" : "Don't give up! 📚"}
            </p>
          </div>

          {Object.keys(result.weakTopics || {}).length > 0 && (
            <div className="rounded-2xl glass p-6 shadow-sm">
              <h3 className="font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                <Target className="w-5 h-5 text-red-500" />
                Weak Areas Detected
              </h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {Object.entries(result.weakTopics).map(([topic, count]) => (
                  <span key={topic} className="px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-medium border border-red-100 dark:border-red-500/20">
                    {topic} ({count as number} wrong)
                  </span>
                ))}
              </div>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={practiceWeakAreas}
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#6366f1] text-white font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-lg shadow-[#7c3aed]/20 btn-premium"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Target className="w-4 h-4" />Practice Weak Areas</>}
              </motion.button>
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={resetAll}
            className="w-full py-3.5 rounded-xl bg-white dark:bg-white/5 text-gray-600 dark:text-gray-300 font-medium transition hover:shadow-md flex items-center justify-center gap-2 cursor-pointer border border-gray-200 dark:border-white/10"
          >
            <RotateCcw className="w-4 h-4" />
            Start New Practice
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}
