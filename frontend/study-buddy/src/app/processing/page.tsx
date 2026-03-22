"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export default function ProcessingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filename = searchParams.get("filename") || "video";
  const taskId = localStorage.getItem("taskId");
  const fileType = localStorage.getItem("fileType") || "video";

  const [status, setStatus] = useState("uploaded");
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);

  // Define steps based on file type
  const videoSteps = [
    { id: "uploaded", name: "File uploaded" },
    { id: "converting", name: "Converting video to audio" },
    { id: "transcribing", name: "Generating transcript" },
    { id: "summarizing", name: "Creating summary" },
    { id: "generating_notes", name: "Generating notes" },
    { id: "completed", name: "Processing complete" },
  ];

  const pdfSteps = [
    { id: "uploaded", name: "File uploaded" },
    { id: "extracting", name: "Extracting text from PDF" },
    { id: "summarizing", name: "Creating summary" },
    { id: "generating_notes", name: "Generating notes" },
    { id: "completed", name: "Processing complete" },
  ];

  const youtubeSteps = [
    { id: "uploaded", name: "File uploaded" },
    { id: "transcribing", name: "Generating transcript" },
    { id: "summarizing", name: "Creating summary" },
    { id: "generating_notes", name: "Generating notes" },
    { id: "completed", name: "Processing complete" },
  ];

  // Select the appropriate steps based on file type
  const steps = fileType === "pdf" ? pdfSteps : (fileType === "youtube" ? youtubeSteps : videoSteps);

  const getCurrentStep = () => {
    return steps.findIndex((step) => step.id === status);
  };

  const getProgress = () => {
    const currentStep = getCurrentStep();
    return ((currentStep + 1) / steps.length) * 100;
  };

  const checkStatus = async () => {
    if (!taskId) {
      setError("No task ID found");
      return;
    }

    try {
      const response = await fetch(`http://localhost:5001/status/${taskId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch status");
      }

      const data = await response.json();
      setStatus(data.status);

      if (data.error) {
        setError(data.error);
        return;
      }

      if (data.status === "completed") {
        setResults(data.results);
        // Store results in localStorage
        localStorage.setItem("processingResults", JSON.stringify(data.results));
        
        // Check if we have a PDF viewer URL and preserve it
        const pdfViewerURL = localStorage.getItem("pdfViewerURL");
        if (pdfViewerURL) {
          console.log("Processing - Preserving PDF viewer URL:", pdfViewerURL);
        }
        
        // Navigate to results page after a short delay
        setTimeout(() => {
          router.push("/results");
        }, 1000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch status");
    }
  };

  useEffect(() => {
    const interval = setInterval(checkStatus, 2000);
    return () => clearInterval(interval);
  }, [taskId]);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md w-full p-6 space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-destructive">Error</h1>
            <p className="text-muted-foreground">{error}</p>
            <button
              onClick={() => router.push("/")}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md"
            >
              Return to Upload
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-md w-full p-6 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Processing Your File</h1>
          <p className="text-muted-foreground">
            Please wait while we process &quot;{filename}&quot;
          </p>
        </div>

        <div className="space-y-4">
          <Progress value={getProgress()} className="w-full" />
          <div className="space-y-2">
            {steps.map((step, index) => {
              const isCompleted = index < getCurrentStep();
              const isCurrent = index === getCurrentStep();
              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex items-center space-x-2",
                    isCompleted ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4 text-primary" />
                  ) : isCurrent ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <div className="h-4 w-4" />
                  )}
                  <span>{step.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
