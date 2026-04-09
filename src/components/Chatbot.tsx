import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, Loader, ThumbsUp, ThumbsDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { api } from "@/services/api";
import { toast } from "sonner";

interface Message {
  id: string;
  type: "user" | "assistant";
  text: string;
  timestamp: Date;
  feedbackSubmitted?: boolean;
}

interface HistoryMessage {
  role?: string;
  message?: string;
  createdAt?: string;
}

export const Chatbot = () => {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const hasLocalInteractionRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadHistory = async (savedConversationId: string, retries = 2) => {
    setHistoryLoading(true);
    setHistoryError(false);

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      try {
        const history = await api.chat.getHistory(savedConversationId);
        if (Array.isArray(history) && history.length > 0 && !hasLocalInteractionRef.current) {
          setMessages(
            history.map((item: HistoryMessage, idx: number) => ({
              id: `${item.createdAt || Date.now()}-${idx}`,
              type: item.role === "assistant" ? "assistant" : "user",
              text: item.message || "",
              timestamp: item.createdAt ? new Date(item.createdAt) : new Date(),
            }))
          );
        }
        setHistoryLoading(false);
        return;
      } catch {
        if (attempt === retries) {
          setHistoryError(true);
          setHistoryLoading(false);
        }
      }
    }
  };

  useEffect(() => {
    const savedConversationId = localStorage.getItem("chatConversationId");
    if (savedConversationId) {
      setConversationId(savedConversationId);
      loadHistory(savedConversationId);
    }
  }, []);

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
    hasLocalInteractionRef.current = true;
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setLoading(true);

    try {
      const result = await api.chat.send(messageText, i18n.language, conversationId);

      if (result?.conversationId && !conversationId) {
        setConversationId(result.conversationId);
        localStorage.setItem("chatConversationId", result.conversationId);
      }

      setQuickReplies(result?.quickReplies || []);
      setRecommendations(result?.recommendations || []);
      
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

  const submitFeedback = async (messageId: string, helpful: boolean) => {
    if (!conversationId) return;

    const result = await api.chat.submitFeedback({
      conversationId,
      messageId,
      helpful,
    });

    if (!result?.success) {
      toast.error(t("chatbot.feedbackSaveFailed"));
      return;
    }

    setMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, feedbackSubmitted: true } : msg))
    );
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
        {historyError && !historyLoading && (
          <div className="flex justify-center py-1">
            <Button variant="outline" size="sm" className="text-xs" onClick={() => conversationId && loadHistory(conversationId)}>
              {t("chatbot.retryLoadHistory")}
            </Button>
          </div>
        )}

        {historyLoading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            <Loader className="w-4 h-4 animate-spin mr-2" />
            <span>{t("chatbot.loadingPreviousChat")}</span>
          </div>
        ) : messages.length === 0 ? (
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
              {msg.type === "assistant" && !msg.feedbackSubmitted && (
                <div className="flex gap-1 mt-1 px-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => submitFeedback(msg.id, true)}>
                    <ThumbsUp className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => submitFeedback(msg.id, false)}>
                    <ThumbsDown className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
        {recommendations.length > 0 && (
          <div className="space-y-1">
            {recommendations.map((rec, idx) => (
              <p key={`${rec}-${idx}`} className="text-xs text-muted-foreground">• {rec}</p>
            ))}
          </div>
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

      {quickReplies.length > 0 && !loading && (
        <div className="mb-3 flex flex-wrap gap-2">
          {quickReplies.map((quickReply) => (
            <Button
              key={quickReply}
              variant="outline"
              size="sm"
              className="text-xs h-8"
              onClick={() => setInputValue(quickReply)}
            >
              {quickReply}
            </Button>
          ))}
        </div>
      )}

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
