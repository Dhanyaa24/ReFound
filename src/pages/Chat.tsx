import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Send, Shield, Info } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Message {
  id: number;
  text: string;
  sender: "user" | "other";
  timestamp: Date;
}

// Default demo conversation for quick demos (kept for non-fresh chats)
const initialMessages: Message[] = [
  {
    id: 1,
    text: "Hi! I found your item at the Central Library. When would be a good time for you to pick it up?",
    sender: "other",
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
  },
  {
    id: 2,
    text: "Thank you so much for finding it! I can come by tomorrow afternoon around 3pm if that works?",
    sender: "user",
    timestamp: new Date(Date.now() - 1000 * 60 * 3),
  },
  {
    id: 3,
    text: "That works perfectly. I'll be at the main entrance. Look for someone in a blue jacket.",
    sender: "other",
    timestamp: new Date(Date.now() - 1000 * 60 * 1),
  },
];

export default function Chat() {
  const location = useLocation();
  const state = location.state as { match?: any; freshChat?: boolean } | null;

  // If this chat was opened as a fresh chat (from Recovery), start with an empty message list
  const [messages, setMessages] = useState<Message[]>(state?.freshChat ? [] : initialMessages);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (state?.freshChat) setMessages([]);
  }, [state?.freshChat]);
  const handleSend = () => {
    if (!input.trim()) return;

    const newMessage: Message = {
      id: messages.length + 1,
      text: input,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);
    setInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <PageContainer title="Secure Chat" showBack backTo="/recovery" className="flex flex-col">
      <div className="flex flex-1 flex-col">
        {/* Chat Header Info */}
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/10 px-4 py-3 animate-fade-in">
          <Info className="h-4 w-4 text-primary shrink-0" />
          <p className="text-xs text-muted-foreground">
            This chat exists only for this matched item. No personal information is shared.
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-4 overflow-y-auto pb-4">
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div
                className={`chat-bubble ${
                  message.sender === "user" ? "chat-bubble-sent" : "chat-bubble-received"
                }`}
              >
                <p className="text-sm">{message.text}</p>
                <p className={`mt-1 text-xs ${
                  message.sender === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="border-t border-border bg-background pt-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="h-12 flex-1 bg-secondary/30"
            />
            <Button
              size="icon"
              className="h-12 w-12 shrink-0"
              onClick={handleSend}
              disabled={!input.trim()}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>

          {/* Footer Notice */}
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-3 w-3" />
            <span>Chat closes automatically after the item is returned</span>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
