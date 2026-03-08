import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, Loader } from "lucide-react";
import { useTranslation } from "react-i18next";
import { api } from "@/services/api";

interface Message {
  id: string;
  type: "user" | "assistant";
  text: string;
  timestamp: Date;
}

export const Chatbot = () => {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!inputValue.trim()) return;

    const messageText = inputValue.trim();

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      text: messageText,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setLoading(true);

    try {
      const result = await api.chat.send(messageText, i18n.language);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        text: result.reply || t("chatbot.error"),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        text: t("chatbot.error"),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !loading) {
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 mb-4 pb-4 border-b">
        <MessageCircle className="w-6 h-6 text-primary" />
        <div>
          <h3 className="text-lg font-bold">{t("chatbot.title")}</h3>
          <p className="text-xs text-muted-foreground">{t("chatbot.subtitle")}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto mb-4 space-y-3 min-h-0">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            <p>{t("chatbot.initialMessage")}</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg text-sm ${
                  msg.type === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-foreground"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-secondary text-foreground px-4 py-2 rounded-lg flex items-center gap-2">
              <Loader className="w-4 h-4 animate-spin" />
              <span className="text-xs">{t("chatbot.loading")}</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={t("chatbot.placeholder")}
          disabled={loading}
          className="flex-1"
        />
        <Button
          onClick={sendMessage}
          disabled={!inputValue.trim() || loading}
          size="sm"
          className="px-3"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default Chatbot;
