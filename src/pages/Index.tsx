import { useState, useRef, useEffect } from "react";
import { Bot } from "lucide-react";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import { toast } from "sonner";

type Message = { role: "user" | "assistant"; content: string };

const WEBHOOK_URL = "http://localhost:5678/webhook/chatapp";

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (content: string) => {
    const userMsg: Message = { role: "user", content };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, history: [...messages, userMsg] }),
      });

      if (!res.ok) throw new Error("Webhook error");

      const data = await res.json();
      const reply = typeof data === "string" ? data : data.message || data.response || data.output || JSON.stringify(data);

      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      toast.error("Failed to get response. Is your webhook running?");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I couldn't connect to the server. Please check your webhook." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl">
          {messages.length === 0 ? (
            <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                <Bot className="h-6 w-6 text-muted-foreground" />
              </div>
              <h1 className="text-2xl font-medium text-foreground">How can I help you?</h1>
            </div>
          ) : (
            <div className="py-4">
              {messages.map((msg, i) => (
                <ChatMessage key={i} role={msg.role} content={msg.content} />
              ))}
              {isLoading && (
                <div className="flex gap-4 px-4 py-6">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                    <Bot className="h-4 w-4 text-secondary-foreground" />
                  </div>
                  <div className="pt-2">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input area */}
      <div className="mx-auto w-full max-w-2xl px-4 pb-6 pt-2">
        <ChatInput onSend={handleSend} disabled={isLoading} />
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Messages are sent to your webhook endpoint
        </p>
      </div>
    </div>
  );
};

export default Index;

