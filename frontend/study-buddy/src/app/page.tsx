"use client";
import { Upload } from "@/components/upload";
import { Chat } from "@/components/chat";
import { useState } from "react";
import { FlashCards } from "@/components/flash-cards";
import { MindMap } from "@/components/mind-map";

export default function Home() {
  const [taskId, setTaskId] = useState<string | null>(null);

  // Function to handle task ID updates from child components
  const handleTaskIdUpdate = (newTaskId: string) => {
    setTimeout(() => {
      setTaskId(newTaskId);
    }, 1000);
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-6 py-8 max-w-5xl">
        {/* Initial state: show upload component centered and wider */}
        {!taskId && (
          <div className="flex justify-center">
            <div className="w-full max-w-4xl">
              <Upload onTaskIdUpdate={handleTaskIdUpdate} />
            </div>
          </div>
        )}

        {/* After upload: show grid layout with content */}
        {taskId && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
          </div>
        )}
      </div>
    </div>
  );
}
