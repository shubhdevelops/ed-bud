import React, { useEffect, useState, useCallback } from 'react';
import { Loader2, RefreshCw, CheckCircle, XCircle, HelpCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Progress } from './ui/progress';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

interface QuizProps {
  taskId: string;
}

export function Quiz({ taskId }: QuizProps) {
  console.log("Quiz component rendered with taskId:", taskId);
  
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  const fetchQuiz = useCallback(async () => {
    if (!taskId) {
      console.error("No taskId provided to Quiz component");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching quiz for taskId:", taskId);
      
      const url = `http://localhost:5001/status/${taskId}`;
      console.log("Fetching from URL:", url);
      
      const response = await fetch(url);
      console.log("Response status:", response.status);
      
      if (!response.ok) {
        console.error("Response not OK:", response.status, response.statusText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Quiz response data:", JSON.stringify(data, null, 2));

      setProcessingStatus(data.status);
      
      if (data.status === "completed" && data.results && data.results.quiz) {
        console.log("Quiz data found:", data.results.quiz);
        setQuizQuestions(data.results.quiz);
        // Initialize user answers array with -1 (no answer selected)
        setUserAnswers(new Array(data.results.quiz.length).fill(-1));
      } else {
        console.log("No quiz data found in results");
        setQuizQuestions([]);
      }
      
    } catch (error) {
      console.error("Error fetching quiz:", error);
      setError(`Error fetching quiz: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchQuiz();
  }, [fetchQuiz]);

  const generateQuiz = async () => {
    if (!taskId) {
      console.error("No taskId provided for quiz generation");
      return;
    }
    
    try {
      setGenerating(true);
      setError(null);
      setShowResults(false);
      
      console.log("Generating quiz for taskId:", taskId);
      
      const response = await fetch(`http://localhost:5001/generate_quiz/${taskId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Generate quiz response:", data);
      
      if (data.status === "success" && data.quiz) {
        setQuizQuestions(data.quiz);
        // Initialize user answers array with -1 (no answer selected)
        setUserAnswers(new Array(data.quiz.length).fill(-1));
      } else {
        throw new Error("Failed to generate quiz");
      }
      
    } catch (error) {
      console.error("Error generating quiz:", error);
      setError(`Error generating quiz: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleAnswerChange = (questionIndex: number, answerIndex: number) => {
    const newAnswers = [...userAnswers];
    newAnswers[questionIndex] = answerIndex;
    setUserAnswers(newAnswers);
  };

  const checkAnswers = () => {
    let correctCount = 0;
    
    for (let i = 0; i < quizQuestions.length; i++) {
      if (userAnswers[i] === quizQuestions[i].correctAnswer) {
        correctCount++;
      }
    }
    
    const newScore = Math.round((correctCount / quizQuestions.length) * 100);
    setScore(newScore);
    setShowResults(true);
  };

  const handleRefresh = () => {
    setShowResults(false);
    setUserAnswers(new Array(quizQuestions.length).fill(-1));
    setScore(0);
  };

  const handleGenerateMore = () => {
    generateQuiz();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading quiz...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={fetchQuiz}>Retry</Button>
      </div>
    );
  }

  if (processingStatus !== "completed") {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Processing video... Please wait.</p>
      </div>
    );
  }

  if (quizQuestions.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-start p-4 border-b">
          <h2 className="text-xl font-semibold">Quiz</h2>
          <Button
            onClick={generateQuiz}
            disabled={generating}
            className="flex items-center gap-2"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <HelpCircle className="h-4 w-4" />
                <span>Generate Quiz</span>
              </>
            )}
          </Button>
        </div>
        <div className="flex flex-col items-center pt-12 gap-4">
          <p className="text-muted-foreground">No quiz questions available</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-start p-4 border-b">
        <h2 className="text-xl font-semibold">Quiz</h2>
        <Button
          onClick={generateQuiz}
          disabled={generating}
          className="flex items-center gap-2"
        >
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <HelpCircle className="h-4 w-4" />
              <span>Generate Quiz</span>
            </>
          )}
        </Button>
      </div>

      {showResults && (
        <Card className="p-4 mb-4">
          <div className="flex flex-col items-center">
            <h3 className="text-lg font-semibold mb-2">Your Score</h3>
            <div className="text-4xl font-bold mb-4">{score}%</div>
            <Progress value={score} className="w-full mb-4" />
            <p className="text-muted-foreground">
              {score >= 80 ? "Excellent job!" : score >= 60 ? "Good work!" : "Keep studying!"}
            </p>
          </div>
        </Card>
      )}

      <div className="space-y-6 overflow-y-auto flex-1 pb-4">
        {quizQuestions.map((question, questionIndex) => (
          <Card key={questionIndex} className="p-4">
            <h3 className="font-medium mb-3">{questionIndex + 1}. {question.question}</h3>
            <RadioGroup
              value={userAnswers[questionIndex] === -1 ? "" : userAnswers[questionIndex].toString()}
              onValueChange={(value) => handleAnswerChange(questionIndex, parseInt(value))}
              disabled={showResults}
            >
              {question.options.map((option, optionIndex) => (
                <div key={optionIndex} className="flex items-center space-x-2 mb-2">
                  <RadioGroupItem
                    value={optionIndex.toString()}
                    id={`question-${questionIndex}-option-${optionIndex}`}
                    className={showResults ? 
                      (optionIndex === question.correctAnswer ? "text-green-500" : 
                       userAnswers[questionIndex] === optionIndex ? "text-red-500" : "") : ""}
                  />
                  <Label
                    htmlFor={`question-${questionIndex}-option-${optionIndex}`}
                    className={showResults ? 
                      (optionIndex === question.correctAnswer ? "text-green-500 font-medium" : 
                       userAnswers[questionIndex] === optionIndex ? "text-red-500" : "") : ""}
                  >
                    {option}
                  </Label>
                  {showResults && (
                    <span className="ml-2">
                      {optionIndex === question.correctAnswer ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : userAnswers[questionIndex] === optionIndex ? (
                        <XCircle className="h-4 w-4 text-red-500" />
                      ) : null}
                    </span>
                  )}
                </div>
              ))}
            </RadioGroup>
          </Card>
        ))}
      </div>
      <div className="flex justify-end gap-2 p-4 border-t">
        {showResults ? (
          <>
            <Button variant="outline" onClick={handleRefresh} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            <Button variant="outline" onClick={handleGenerateMore} disabled={generating} className="flex items-center gap-2">
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <HelpCircle className="h-4 w-4" />
                  Generate More
                </>
              )}
            </Button>
          </>
        ) : (
          <Button onClick={checkAnswers} disabled={userAnswers.includes(-1)} className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Check Answers
          </Button>
        )}
      </div>
    </div>
  );
} 