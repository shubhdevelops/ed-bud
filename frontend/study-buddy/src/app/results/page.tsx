"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { downloadPdfFromHtml } from "../../helpers/markdown-to-pdf";
import {
  Download,
  MessageSquare,
  FileText,
  Play,
  Pause,
  Volume2,
  VolumeX,
  GripVertical,
  BookOpen,
  GitBranch,
  HelpCircle,
  ClipboardList,
  History,
} from "lucide-react";
import { ChatInterface } from "@/components/chat-interface";
import {
  ResizablePanel,
  ResizablePanelGroup,
  ResizableHandle,
} from "@/components/ui/resizable";
import { FlashCards } from "@/components/flash-cards";
import { MindMap } from "@/components/mind-map";
import { Quiz } from "@/components/quiz";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Custom tooltip styles
const tooltipStyles = `
  .tab-tooltip {
    position: relative;
  }
  
  .tab-tooltip::after {
    content: attr(data-tooltip);
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    padding: 4px 8px;
    background-color: rgba(0, 0, 0, 0.8);
    color: white;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.1s, visibility 0.1s;
    pointer-events: none;
    z-index: 1000;
  }
  
  .tab-tooltip:hover::after {
    opacity: 1;
    visibility: visible;
  }
`;

// Mock data for demonstration
const mockTranscript = `
Speaker 1: Welcome to our discussion on artificial intelligence and its impact on society.
Speaker 2: Thank you for having me. It's an important topic that deserves attention.
Speaker 1: Let's start with the basics. How would you define AI for our audience?
Speaker 2: Artificial Intelligence refers to computer systems designed to perform tasks that typically require human intelligence. These include learning, reasoning, problem-solving, perception, and language understanding.
Speaker 1: And how is AI currently being used in everyday applications?
Speaker 2: AI is all around us. From voice assistants like Siri and Alexa to recommendation systems on streaming platforms and e-commerce sites. It's in our email spam filters, navigation apps, and increasingly in healthcare for diagnostics.
`;

const mockSummary = `
This discussion explores artificial intelligence and its societal impact. The speakers define AI as computer systems designed to perform tasks requiring human intelligence, including learning, reasoning, and language understanding. They highlight AI's prevalence in everyday applications such as voice assistants, recommendation systems, email filters, navigation apps, and healthcare diagnostics. The conversation emphasizes AI's growing importance and integration into daily life.
`;

export default function ResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<any>(null);
  const filename = searchParams.get("filename") || "video";
  const [fileURL, setFileURL] = useState<string | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("summary");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const taskId = localStorage.getItem("taskId");
  const [flashcardsKey, setFlashcardsKey] = useState(0);
  const [isPdf, setIsPdf] = useState(false);
  const [pdfViewerURL, setPdfViewerURL] = useState<string | null>(null);
  const [pdfData, setPdfData] = useState<string | null>(null);

  console.log("ResultsPage rendered with taskId:", taskId);

  // load transcript and summary data from localStorage or backend
  useEffect(() => {
    const fetchData = async () => {
      console.log("Fetching results data");
      const storedData = localStorage.getItem("processingResults");
      const currentTaskId = localStorage.getItem("taskId");
      const fileType = localStorage.getItem("fileType");

      // Set isPdf based on fileType
      setIsPdf(fileType === "pdf");
      // Set default tab to summary if it's a PDF
      if (fileType === "pdf") {
        setActiveTab("summary");
      }
      console.log("File type:", fileType, "isPdf:", fileType === "pdf");

      // Get PDF viewer URL if it's a PDF
      if (fileType === "pdf") {
        const storedPdfURL = localStorage.getItem("pdfViewerURL");
        console.log("Retrieved PDF viewer URL:", storedPdfURL);
        setPdfViewerURL(storedPdfURL);
      }

      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          console.log("Loaded results data from localStorage:", parsedData);
          setData(parsedData);
        } catch (error) {
          console.error("Error parsing stored data:", error);
          setData(null);
        }
      } else if (currentTaskId) {
        // If no data in localStorage, fetch from backend
        try {
          console.log(
            "Fetching results from backend for taskId:",
            currentTaskId
          );
          const response = await fetch(
            `http://localhost:5001/status/${currentTaskId}`
          );
          if (!response.ok) {
            throw new Error("Failed to fetch results");
          }
          const data = await response.json();
          if (data.status === "completed" && data.results) {
            console.log("Loaded results data from backend:", data.results);
            setData(data.results);
            // Store in localStorage for future use
            localStorage.setItem(
              "processingResults",
              JSON.stringify(data.results)
            );
          } else {
            console.warn("No results available from backend");
            setData(null);
          }
        } catch (error) {
          console.error("Error fetching from backend:", error);
          setData(null);
        }
      } else {
        console.warn("No taskId found and no results in localStorage");
        setData(null);
      }
    };

    fetchData();
  }, []);

  // load video file from IndexedDB
  useEffect(() => {
    const loadFileFromDB = async () => {
      console.log("Results - Loading file from IndexedDB");
      try {
        const db = await window.indexedDB.open("fileDB", 1);
        db.onupgradeneeded = (event) => {
          const target = event.target as IDBOpenDBRequest;
          target.result.createObjectStore("files");
        };

        db.onsuccess = () => {
          const transaction = db.result.transaction("files", "readonly");
          const store = transaction.objectStore("files");
          const request = store.get("uploadedFile");

          request.onsuccess = () => {
            if (request.result) {
              const filename = localStorage.getItem("filename") || "video";
              const fileType = localStorage.getItem("fileType") || "video";

              if (fileType === "pdf") {
                // Convert the PDF file to base64
                const reader = new FileReader();
                reader.onload = (e) => {
                  const base64Data = e.target?.result as string;
                  // Create data URL for PDF
                  const pdfDataUrl = `data:application/pdf;base64,${
                    base64Data.split(",")[1]
                  }`;
                  setPdfViewerURL(pdfDataUrl);
                  console.log("PDF data URL created successfully");
                };
                reader.readAsDataURL(request.result);
              } else {
                // Handle video files as before
                const newFile = new File([request.result], filename, {
                  type: "video/mp4",
                });
                const fileURL = URL.createObjectURL(newFile);
                setFileURL(fileURL);
              }
            } else {
              console.log("Results - No file found in IndexedDB");
            }
          };
        };
      } catch (error) {
        console.error("Error loading file from IndexedDB:", error);
      }
    };

    const youtubeUrl = localStorage.getItem("youtubeUrl");
    if (youtubeUrl && youtubeUrl.length > 0) {
      setYoutubeUrl(youtubeUrl);
    } else {
      loadFileFromDB();
    }
  }, []);

  // Clean up URLs when component unmounts
  useEffect(() => {
    return () => {
      console.log("Results - Cleaning up URLs");
      if (fileURL) {
        URL.revokeObjectURL(fileURL);
        console.log("Results - Revoked file URL");
      }
      if (pdfViewerURL) {
        URL.revokeObjectURL(pdfViewerURL);
        console.log("Results - Revoked PDF viewer URL");
      }
    };
  }, [fileURL, pdfViewerURL]);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = Number.parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const downloadPDF = () => {
    downloadPdfFromHtml(
      document.getElementById("lecture-notes-div")?.innerHTML
    );
  };

  const handleTabChange = (value: string) => {
    console.log("Tab changed to:", value);
    setActiveTab(value);
    // Force re-render of flashcards component when tab is activated
    if (value === "flashcards") {
      console.log("Flashcards tab activated, incrementing key");
      setFlashcardsKey((prev) => prev + 1);
    }
  };

  const convertYoutubeUrlToEmbedUrl = (youtubeUrl: string) => {
    const regex =
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([\w-]{11})/;
    const match = youtubeUrl.match(regex);

    if (match && match[1]) {
      const videoId = match[1];
      return `https://www.youtube.com/embed/${videoId}`;
    } else {
      throw new Error("Invalid YouTube URL");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <style jsx global>
        {tooltipStyles}
      </style>
      <main className="m-4">
        <ResizablePanelGroup
          direction="horizontal"
          className="h-[calc(100vh-5rem)] rounded-lg border"
        >
          {/* Video/PDF Panel */}
          <ResizablePanel defaultSize={60} minSize={30}>
            <div className="h-full p-4 space-y-4">
              {isPdf ? (
                <Card className="h-[calc(100vh-6rem)] overflow-hidden p-0">
                  {pdfViewerURL ? (
                    <iframe
                      src={pdfViewerURL}
                      className="w-full h-full"
                      title="PDF Viewer"
                      style={{
                        border: "none",
                        height: "100%",
                        minHeight: "calc(100vh - 6rem)",
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <p className="mb-2">PDF not available</p>
                        <p className="text-sm text-muted-foreground">
                          There was an error loading the PDF file.
                        </p>
                      </div>
                    </div>
                  )}
                </Card>
              ) : (
                <>
                  <div className="relative bg-black aspect-video rounded-md overflow-hidden">
                    {youtubeUrl ? (
                      <>
                        <iframe
                          className="w-full h-full"
                          src={convertYoutubeUrlToEmbedUrl(youtubeUrl)}
                          title="YouTube video player"
                        ></iframe>
                      </>
                    ) : fileURL ? (
                      <video
                        ref={videoRef}
                        className="w-full h-full"
                        src={fileURL.length > 0 ? fileURL : "/placeholder.mp4"}
                        poster="/placeholder.svg?height=720&width=1280"
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={handleLoadedMetadata}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        Video not available
                      </div>
                    )}
                  </div>

                  {youtubeUrl === null && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleMute}
                          >
                            {isMuted ? (
                              <VolumeX className="h-5 w-5" />
                            ) : (
                              <Volume2 className="h-5 w-5" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handlePlayPause}
                          >
                            {isPlaying ? (
                              <Pause className="h-5 w-5" />
                            ) : (
                              <Play className="h-5 w-5" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <input
                        type="range"
                        min="0"
                        max={duration || 100}
                        value={currentTime}
                        onChange={handleSeek}
                        className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer"
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle>
            <div className="h-full flex items-center justify-center">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
          </ResizableHandle>

          {/* Content Panel */}
          <ResizablePanel defaultSize={40} minSize={35}>
            <div className="h-full">
              <Tabs
                value={activeTab}
                onValueChange={handleTabChange}
                className="h-full flex flex-col"
              >
                <TabsList className="grid w-full grid-cols-6 sticky top-0 z-10 bg-background">
                  <TabsTrigger
                    value="summary"
                    className="flex items-center justify-center tab-tooltip"
                    data-tooltip="Notes"
                  >
                    <ClipboardList className="h-5 w-5" />
                  </TabsTrigger>
                  <TabsTrigger
                    value="transcript"
                    className="flex items-center justify-center tab-tooltip"
                    data-tooltip="Transcript"
                    disabled={isPdf}
                  >
                    <FileText className="h-5 w-5" />
                  </TabsTrigger>
                  <TabsTrigger
                    value="chat"
                    className="flex items-center justify-center tab-tooltip"
                    data-tooltip="Chat"
                  >
                    <MessageSquare className="h-5 w-5" />
                  </TabsTrigger>
                  <TabsTrigger
                    value="flashcards"
                    className="flex items-center justify-center tab-tooltip"
                    data-tooltip="Flashcards"
                  >
                    <BookOpen className="h-5 w-5" />
                  </TabsTrigger>
                  <TabsTrigger
                    value="mindmap"
                    className="flex items-center justify-center tab-tooltip"
                    data-tooltip="Mind Map"
                  >
                    <GitBranch className="h-5 w-5" />
                  </TabsTrigger>
                  <TabsTrigger
                    value="quiz"
                    className="flex items-center justify-center tab-tooltip"
                    data-tooltip="Quiz"
                  >
                    <HelpCircle className="h-5 w-5" />
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="transcript" className="flex-1 p-4">
                  <Card className="h-[calc(100vh-11rem)] overflow-y-auto">
                    <div className="p-6">
                      <div className="prose dark:prose-invert max-w-none">
                        <h3 className="text-xl font-semibold mb-4">
                          Transcript
                        </h3>
                        <div className="whitespace-pre-line">
                          {data?.transcript?.text || "Loading..."}
                        </div>
                      </div>
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="summary" className="flex-1 p-4">
                  <Card className="h-[calc(100vh-11rem)] overflow-y-auto">
                    <div className="p-6">
                      <div className="prose dark:prose-invert max-w-none">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-semibold">
                            Summary & Notes
                          </h3>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={downloadPDF}
                            className="flex items-center gap-2"
                          >
                            <Download className="h-4 w-4" />
                            <span>Download PDF</span>
                          </Button>
                        </div>
                        <div id="lecture-notes-div" className="prose markdown">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {data?.notes || "Loading..."}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="chat" className="flex-1 p-4">
                  <Card className="h-[calc(100vh-11rem)] overflow-hidden">
                    <ChatInterface taskId={taskId || ""} />
                  </Card>
                </TabsContent>

                <TabsContent value="flashcards" className="flex-1 p-4">
                  <Card className="h-[calc(100vh-11rem)] overflow-y-auto">
                    {taskId ? (
                      <FlashCards key={flashcardsKey} taskId={taskId} />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        No flashcards available
                      </div>
                    )}
                  </Card>
                </TabsContent>

                <TabsContent value="mindmap" className="flex-1 p-4">
                  <Card className="h-[calc(100vh-11rem)] overflow-y-auto">
                    {taskId ? (
                      <MindMap taskId={taskId} />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        No mind map available
                      </div>
                    )}
                  </Card>
                </TabsContent>

                <TabsContent value="quiz" className="flex-1 p-4">
                  <Card className="h-[calc(100vh-11rem)] overflow-y-auto">
                    {taskId ? (
                      <Quiz taskId={taskId} />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        No quiz available
                      </div>
                    )}
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
    </div>
  );
}
