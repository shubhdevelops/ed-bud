import React, { useEffect, useState, useCallback } from 'react';
import { FlashCard } from './ui/flash-card';
import { Loader2, RefreshCw, Wand2, BookOpen } from 'lucide-react';
import { Button } from './ui/button';

interface FlashCardData {
  question: string;
  answer: string;
}

interface FlashCardsProps {
  taskId: string;
}

export function FlashCards({ taskId }: FlashCardsProps) {
  console.log("FlashCards component rendered with taskId:", taskId);
  
  const [flashcards, setFlashcards] = useState<FlashCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [generating, setGenerating] = useState(false);

  const fetchFlashcards = useCallback(async () => {
    if (!taskId) {
      console.error("No taskId provided to FlashCards component");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching flashcards for taskId:", taskId);
      
      const url = `http://localhost:5001/status/${taskId}`;
      console.log("Fetching from URL:", url);
      
      const response = await fetch(url);
      console.log("Response status:", response.status);
      
      if (!response.ok) {
        console.error("Response not OK:", response.status, response.statusText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Flashcards response data:", JSON.stringify(data, null, 2));

      setProcessingStatus(data.status);
      console.log("Processing status set to:", data.status);

      if (data.status === 'completed' && data.results?.flashcards) {
        console.log("Flashcards found in response:", data.results.flashcards.length);
        setFlashcards(data.results.flashcards);
      } else if (data.status === 'error') {
        console.error("Error status received:", data.error);
        setError(data.error || 'Failed to load flashcards');
      } else if (data.status !== 'completed') {
        // If processing is still ongoing, set a more informative message
        let statusMessage = 'Processing not complete yet. ';
        
        switch (data.status) {
          case 'uploaded':
            statusMessage += 'File has been uploaded.';
            break;
          case 'converting':
            statusMessage += 'Converting video to audio.';
            break;
          case 'transcribing':
            statusMessage += 'Generating transcript.';
            break;
          case 'summarizing':
            statusMessage += 'Creating summary.';
            break;
          case 'generating_notes':
            statusMessage += 'Generating notes.';
            break;
          default:
            statusMessage += 'Please wait.';
        }
        
        console.log("Processing status message:", statusMessage);
        setError(statusMessage);
      } else {
        console.warn("Unexpected response format:", data);
        setError("Unexpected response format from server");
      }
    } catch (err) {
      console.error("Error fetching flashcards:", err);
      setError('Failed to fetch flashcards: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  const generateFlashcards = async () => {
    if (!taskId) {
      console.error("No taskId provided for flashcard generation");
      return;
    }
    
    try {
      setGenerating(true);
      setError(null);
      console.log("Generating flashcards for taskId:", taskId);
      
      const url = `http://localhost:5001/generate_flashcards/${taskId}`;
      console.log("Generating flashcards from URL:", url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log("Generation response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Generation failed:", errorData);
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Generated flashcards data:", JSON.stringify(data, null, 2));
      
      if (data.status === 'success' && data.flashcards) {
        console.log("Flashcards generated successfully:", data.flashcards.length);
        setFlashcards(data.flashcards);
      } else {
        console.warn("Unexpected generation response format:", data);
        setError("Unexpected response format from server");
      }
    } catch (err) {
      console.error("Error generating flashcards:", err);
      setError('Failed to generate flashcards: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setGenerating(false);
    }
  };

  // Fetch flashcards when component mounts
  useEffect(() => {
    console.log("FlashCards useEffect triggered");
    fetchFlashcards();
    
    // Set up polling if processing is not complete
    let interval: NodeJS.Timeout | null = null;
    
    if (processingStatus && processingStatus !== 'completed' && processingStatus !== 'error') {
      console.log("Setting up polling interval for status:", processingStatus);
      interval = setInterval(fetchFlashcards, 5000); // Poll every 5 seconds
    }
    
    return () => {
      console.log("Cleaning up FlashCards component");
      if (interval) {
        console.log("Clearing polling interval");
        clearInterval(interval);
      }
    };
  }, [fetchFlashcards, processingStatus]);

  const handleRefresh = () => {
    console.log("Manual refresh triggered");
    fetchFlashcards();
  };

  const handleDebug = async () => {
    console.log("Debug button clicked");
    try {
      // Fetch debug info from backend
      const response = await fetch('http://localhost:5001/debug/tasks');
      const data = await response.json();
      console.log("Debug data:", data);
      setDebugInfo(data);
      
      // Also check localStorage
      const storedTaskId = localStorage.getItem("taskId");
      const storedResults = localStorage.getItem("processingResults");
      console.log("LocalStorage taskId:", storedTaskId);
      console.log("LocalStorage processingResults:", storedResults ? JSON.parse(storedResults) : null);
    } catch (err) {
      console.error("Error fetching debug info:", err);
    }
  };

  console.log("FlashCards render state:", { 
    loading, 
    error, 
    processingStatus, 
    flashcardsCount: flashcards.length,
    generating
  });

  if (loading) {
    console.log("Rendering loading state");
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    console.log("Rendering error state:", error);
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-destructive">{error}</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            <span>Retry</span>
          </Button>
        </div>
      </div>
    );
  }

  if (flashcards.length === 0) {
    console.log("Rendering empty state");
    return (
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-start p-4 border-b">
          <h2 className="text-xl font-semibold">Flashcards</h2>
          <Button
            onClick={generateFlashcards}
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
                <BookOpen className="h-4 w-4" />
                <span>Generate Flashcards</span>
              </>
            )}
          </Button>
        </div>
        <div className="flex flex-col items-center pt-12 gap-4">
          <p className="text-muted-foreground">No flashcards available</p>
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

  console.log("Rendering flashcards grid with", flashcards.length, "cards");
  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-start p-4 border-b">
        <h2 className="text-xl font-semibold">Flashcards</h2>
        <Button
          onClick={generateFlashcards}
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
              <BookOpen className="h-4 w-4" />
              <span>Generate Flashcards</span>
            </>
          )}
        </Button>
      </div>
      <div className="flex justify-end p-4 gap-2">
        <Button variant="outline" onClick={handleRefresh} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 h-full overflow-y-auto">
        {flashcards.map((card, index) => (
          <FlashCard
            key={index}
            question={card.question}
            answer={card.answer}
          />
        ))}
      </div>
    </div>
  );
} 