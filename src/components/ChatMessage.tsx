import { User, Bot } from "lucide-react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

const ChatMessage = ({ role, content }: ChatMessageProps) => {
  const isUser = role === "user";

  return (
    <div className={`flex gap-4 px-4 py-6 ${isUser ? "" : ""}`}>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isUser ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
        }`}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div className="flex-1 space-y-2 pt-1">
        <p className="text-sm font-medium text-muted-foreground">
          {isUser ? "You" : "Assistant"}
        </p>
        <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
          {content}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
