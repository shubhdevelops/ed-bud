"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Upload as UploadIcon,
  File,
  FileText,
  X,
  Link,
  Loader2,
  Youtube,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface UploadProps {
  onTaskIdUpdate?: (taskId: string) => void;
}

export function Upload({ onTaskIdUpdate }: UploadProps) {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("file");

  const simulateProgress = () => {
    // Simulate upload progress
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prevProgress) => {
        const newProgress = prevProgress + Math.random() * 10;
        if (newProgress >= 90) {
          clearInterval(interval);
          return 90; // We'll set to 100 when the server responds
        }
        return newProgress;
      });
    }, 500);

    return interval;
  };

  const handleUpload = async (file: File) => {
    localStorage.removeItem("youtubeUrl");
    try {
      setUploading(true);
      setError(null);
      setUploadStatus("Uploading file...");

      const progressInterval = simulateProgress();

      const formData = new FormData();
      // Determine if it's a PDF or video based on file type
      if (file.type === "application/pdf") {
        formData.append("pdf", file);
      } else {
        formData.append("video", file);
      }

      const endpoint =
        file.type === "application/pdf" ? "/upload-pdf" : "/upload";
      const response = await fetch(`http://localhost:5001${endpoint}`, {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      setUploadStatus("Upload successful! Processing file...");

      // store in indexedDB
      const db = await window.indexedDB.open("fileDB", 1);
      db.onsuccess = () => {
        const transaction = db.result.transaction("files", "readwrite");
        const store = transaction.objectStore("files");
        store.put(file, "uploadedFile");
      };

      // Store the task ID and filename for the processing page
      localStorage.setItem("taskId", data.task_id);
      localStorage.setItem("filename", file.name);

      // Set fileType based on the active tab and file type
      const fileType =
        activeTab === "pdf" || file.type === "application/pdf"
          ? "pdf"
          : "video";
      localStorage.setItem("fileType", fileType);

      // Create a URL for the file
      const fileURL = URL.createObjectURL(file);
      localStorage.setItem("fileURL", fileURL);

      // For PDFs, store the URL in a separate key for the PDF viewer
      if (fileType === "pdf") {
        localStorage.setItem("pdfViewerURL", fileURL);
      }

      if (data.task_id) {
        setTaskId(data.task_id);
        if (onTaskIdUpdate) {
          onTaskIdUpdate(data.task_id);
        }
      }

      // Navigate to processing page after a brief delay to show 100% completion
      setTimeout(() => {
        router.push(`/processing?filename=${encodeURIComponent(file.name)}`);
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (
      droppedFile?.type.startsWith("video/") ||
      droppedFile?.type === "application/pdf"
    ) {
      setFile(droppedFile);
      // Auto-switch to the correct tab based on file type
      if (droppedFile.type === "application/pdf") {
        setActiveTab("pdf");
      } else if (droppedFile.type.startsWith("video/")) {
        setActiveTab("file");
      }
      setError(null);
    } else {
      setError("Please upload a video or PDF file.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (
        selectedFile.type.startsWith("video/") ||
        selectedFile.type === "application/pdf"
      ) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError("Please select a video or PDF file.");
      }
    }
  };

  const removeFile = () => {
    setFile(null);
    setError(null);
    setUploadStatus("");
    setUploadProgress(0);
  };

  const handleYoutubeUrlSubmit = async () => {
    if (!youtubeUrl) {
      setError("Please enter a YouTube URL");
      return;
    }

    // Basic YouTube URL validation
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    if (!youtubeRegex.test(youtubeUrl)) {
      setError("Please enter a valid YouTube URL");
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setUploadStatus("Processing YouTube URL...");

      const progressInterval = simulateProgress();

      const response = await fetch("http://localhost:5001/youtube", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: youtubeUrl }),
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        throw new Error("Failed to process YouTube URL");
      }

      const data = await response.json();
      setUploadStatus("YouTube video located! Processing video...");

      // Store the task ID for the processing page
      localStorage.setItem("youtubeUrl", youtubeUrl);
      localStorage.setItem("taskId", data.task_id);
      localStorage.setItem("filename", "YouTube Video");
      localStorage.setItem("fileType", "video");

      if (data.task_id) {
        setTaskId(data.task_id);
        if (onTaskIdUpdate) {
          onTaskIdUpdate(data.task_id);
        }
      }

      // Navigate to processing page after a brief delay to show 100% completion
      setTimeout(() => {
        router.push(
          `/processing?filename=${encodeURIComponent("YouTube Video")}`
        );
      }, 500);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to process YouTube URL"
      );
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Clean up the URL when component unmounts
  useEffect(() => {
    return () => {
      const fileURL = localStorage.getItem("fileURL");
      if (fileURL) {
        URL.revokeObjectURL(fileURL);
      }
    };
  }, []);

  const getFileIcon = () => {
    if (!file) return null;

    if (file.type === "application/pdf") {
      return <FileText className="w-8 h-8 text-red-500" />;
    } else {
      return <File className="w-8 h-8 text-primary" />;
    }
  };

  const getFileSize = () => {
    if (!file) return "";

    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    return `${sizeInMB} MB`;
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      <Card className="bg-card shadow-lg border-0 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white p-6">
          <CardTitle className="text-2xl font-bold text-center">
            Upload Study Material
          </CardTitle>
          <CardDescription className="text-white/80 text-center max-w-md mx-auto">
            Transform your lectures and documents into interactive notes. Upload
            a video, PDF, or provide a YouTube URL.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3 mb-6 rounded-lg">
              <TabsTrigger
                value="file"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-l-lg"
              >
                <File className="w-4 h-4 mr-2" />
                Video Upload
              </TabsTrigger>
              <TabsTrigger
                value="pdf"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <FileText className="w-4 h-4 mr-2" />
                PDF Upload
              </TabsTrigger>
              <TabsTrigger
                value="url"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-r-lg"
              >
                <Youtube className="w-4 h-4 mr-2" />
                YouTube URL
              </TabsTrigger>
            </TabsList>

            {/* Video Upload Tab */}
            <TabsContent value="file" className="space-y-4">
              <div
                className={cn(
                  "border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200",
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/20",
                  !file &&
                    "hover:border-primary hover:bg-primary/5 cursor-pointer",
                  file && "bg-muted/20"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() =>
                  !file && document.getElementById("file-upload")?.click()
                }
              >
                <input
                  id="file-upload"
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={handleFileChange}
                />

                {file && activeTab === "file" ? (
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle2 className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-medium mb-1">Video Selected</h3>
                    <p className="text-sm text-muted-foreground mb-1">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mb-4">
                      {getFileSize()}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile();
                      }}
                      className="rounded-full"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Remove File
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                      <UploadIcon className="w-10 h-10 text-primary/70" />
                    </div>
                    <h3 className="text-xl font-medium mb-2">
                      Drag & Drop Video
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      or click to browse files
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      Supports MP4, WebM, MOV and other video formats
                    </p>
                  </>
                )}
              </div>

              {uploading && activeTab === "file" && (
                <div className="space-y-3 mt-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{uploadStatus}</span>
                      <span>{Math.round(uploadProgress)}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                </div>
              )}

              {!uploading && file && activeTab === "file" && (
                <Button
                  className="w-full h-12 mt-4 rounded-lg font-medium"
                  onClick={() => handleUpload(file)}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Upload Video & Process"
                  )}
                </Button>
              )}
            </TabsContent>

            {/* PDF Upload Tab */}
            <TabsContent value="pdf" className="space-y-4">
              <div
                className={cn(
                  "border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200",
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/20",
                  !file &&
                    "hover:border-primary hover:bg-primary/5 cursor-pointer",
                  file && "bg-muted/20"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() =>
                  !file && document.getElementById("pdf-upload")?.click()
                }
              >
                <input
                  id="pdf-upload"
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />

                {file && activeTab === "pdf" ? (
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                      <FileText className="w-8 h-8 text-red-500" />
                    </div>
                    <h3 className="text-lg font-medium mb-1">PDF Selected</h3>
                    <p className="text-sm text-muted-foreground mb-1">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mb-4">
                      {getFileSize()}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile();
                      }}
                      className="rounded-full"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Remove File
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-red-500/20 transition-colors">
                      <FileText className="w-10 h-10 text-red-500/70" />
                    </div>
                    <h3 className="text-xl font-medium mb-2">
                      Drag & Drop PDF
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      or click to browse files
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      Upload lecture slides, research papers, or textbook
                      chapters
                    </p>
                  </>
                )}
              </div>

              {uploading && activeTab === "pdf" && (
                <div className="space-y-3 mt-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{uploadStatus}</span>
                      <span>{Math.round(uploadProgress)}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                </div>
              )}

              {!uploading && file && activeTab === "pdf" && (
                <Button
                  className="w-full h-12 mt-4 rounded-lg font-medium bg-red-500 hover:bg-red-600"
                  onClick={() => handleUpload(file)}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Upload PDF & Process"
                  )}
                </Button>
              )}
            </TabsContent>

            {/* YouTube URL Tab */}
            <TabsContent value="url" className="space-y-6">
              <div className="space-y-4 py-4">
                <div className="flex flex-col items-center justify-center mb-4">
                  <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                    <Youtube className="w-8 h-8 text-red-500" />
                  </div>
                  <h3 className="text-lg font-medium mb-1">YouTube Video</h3>
                  <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
                    Enter a YouTube URL to process the video lecture
                  </p>
                </div>

                <div className="relative">
                  <Input
                    type="text"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    className="w-full pl-10 h-12 rounded-lg"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <Youtube className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>

                {uploading && activeTab === "url" && (
                  <div className="space-y-3 mt-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{uploadStatus}</span>
                        <span>{Math.round(uploadProgress)}%</span>
                      </div>
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                  </div>
                )}

                <Button
                  className="w-full h-12 rounded-lg font-medium bg-red-500 hover:bg-red-600"
                  onClick={handleYoutubeUrlSubmit}
                  disabled={!youtubeUrl || uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Process YouTube Video"
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>

        {error && (
          <CardFooter className="p-0">
            <div className="w-full p-4 bg-destructive/10 text-destructive text-sm border-t border-destructive/20 flex items-center">
              <X className="w-4 h-4 mr-2 flex-shrink-0" />
              <p>{error}</p>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
