import { ChatInterface } from "./chat-interface";

interface ChatProps {
  taskId: string;
}

export function Chat({ taskId }: ChatProps) {
  return (
    <div className="w-full h-[600px]">
      <ChatInterface taskId={taskId} />
    </div>
  );
}
