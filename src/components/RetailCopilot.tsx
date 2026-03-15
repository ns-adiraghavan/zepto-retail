import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import {
  Bot,
  X,
  Send,
  Sparkles,
  ChevronDown,
  Loader2,
  RefreshCw,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { GlobalFilters } from "@/data/dataLoader";
import { buildDataContext, buildPageContext } from "@/hooks/useCopilotData";


interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  loading?: boolean;
}

const SUGGESTED_QUESTIONS = [
  "Which platform is most aggressive on promotions?",
  "Why is Bangalore the most competitive city?",
  "Which platform dominates search visibility?",
  "Are there unusual promotional events this week?",
  "Which categories have the highest price competition?",
];

const PAGE_LABELS: Record<string, string> = {
  "/dashboard": "Competitive Overview",
  "/dashboard/pricing": "Pricing & Promotions",
  "/dashboard/search": "Search & Shelf Visibility",
  "/dashboard/assortment": "Assortment Intelligence",
  "/dashboard/availability": "Availability Intelligence",
  "/dashboard/local": "Local Market Intelligence",
  "/dashboard/events": "Competitive Events",
};

function formatMessage(content: string) {
  // Render **bold**, *italic*, and newlines
  const lines = content.split("\n");
  return lines.map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <span key={i}>
        {parts.map((part, j) =>
          part.startsWith("**") && part.endsWith("**") ? (
            <strong key={j} className="font-semibold text-foreground">
              {part.slice(2, -2)}
            </strong>
          ) : (
            <span key={j}>{part}</span>
          )
        )}
        {i < lines.length - 1 && <br />}
      </span>
    );
  });
}

interface RetailCopilotProps {
  filters: GlobalFilters;
}

export function RetailCopilot({ filters }: RetailCopilotProps) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const currentPage = PAGE_LABELS[location.pathname] ?? "Dashboard";
  const pageContext = buildPageContext(location.pathname);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;
      setSuggestionsOpen(false);

      const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text.trim() };
      const thinkingMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        loading: true,
      };

      setMessages((prev) => [...prev, userMsg, thinkingMsg]);
      setInput("");
      setLoading(true);

      try {
        const dataContext = buildDataContext(filters);
        const history = [...messages, userMsg].map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const filterPayload: Record<string, string> = {
          city: filters.city,
          platform: filters.platform,
          category: filters.category,
          pincode: filters.pincode,
        };

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);

        let res: Response;
        try {
          res = await fetch(`${supabaseUrl}/functions/v1/retail-copilot`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${supabaseKey}`,
              apikey: supabaseKey,
            },
            body: JSON.stringify({
              messages: history,
              dataContext,
              filters: filterPayload,
              pageContext,
            }),
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeout);
        }

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Edge function error ${res.status}: ${errText}`);
        }

        const json = await res.json();
        const reply = json?.reply ?? "Unable to generate a response. Please try again.";
        setMessages((prev) =>
          prev.map((m) => (m.loading ? { ...m, content: reply, loading: false } : m))
        );
      } catch (_err) {
        setMessages((prev) =>
          prev.map((m) =>
            m.loading
              ? {
                  ...m,
                  content: "Sorry, I encountered an error. Please try again.",
                  loading: false,
                }
              : m
          )
        );
      } finally {
        setLoading(false);
      }
    },
    [filters, messages, pageContext, loading]
  );

  const explainPage = useCallback(() => {
    sendMessage(
      `Explain this dashboard page "${currentPage}" and give me 3 key strategic insights based on the current data.`
    );
  }, [currentPage, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setSuggestionsOpen(true);
  };

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full shadow-lg transition-all duration-300",
          "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95",
          open && "opacity-0 pointer-events-none"
        )}
        aria-label="Open Retail Intelligence Copilot"
      >
        <Bot className="h-5 w-5" />
        <span className="text-sm font-semibold tracking-tight">Copilot</span>
        <span className="flex h-2 w-2 rounded-full bg-success animate-pulse" />
      </button>

      {/* Panel */}
      <div
        className={cn(
          "fixed bottom-0 right-0 z-50 flex flex-col transition-all duration-300 ease-in-out",
          "w-[420px] max-w-[100vw]",
          open
            ? "h-[620px] max-h-[90vh] opacity-100 translate-y-0"
            : "h-0 opacity-0 translate-y-4 pointer-events-none"
        )}
      >
        <div className="flex flex-col h-full m-4 rounded-xl border border-border bg-card shadow-2xl overflow-hidden">
          {/* ── Header ── */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card shrink-0">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground leading-tight">
                Retail Intelligence Copilot
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                {currentPage}
                {filters.city !== "All Cities" && (
                  <span className="text-primary/80"> · {filters.city}</span>
                )}
                {filters.platform !== "All Platforms" && (
                  <span className="text-primary/80"> · {filters.platform}</span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                  title="Clear chat"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* ── Explain This Page button ── */}
          <div className="px-4 py-2 border-b border-border/60 shrink-0 bg-muted/20">
            <button
              onClick={explainPage}
              disabled={loading}
              className={cn(
                "w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200",
                "border border-dashed border-primary/40 text-primary/80 hover:bg-primary/8 hover:border-primary/70 hover:text-primary",
                loading && "opacity-50 cursor-not-allowed"
              )}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Explain This Page
            </button>
          </div>

          {/* ── Messages ── */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div ref={scrollRef} className="flex flex-col gap-3 px-4 py-3">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center gap-3 py-6 text-center">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                      <MessageSquare className="h-6 w-6 text-primary/60" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Ask me anything about your retail data
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Insights grounded in live dashboard datasets
                      </p>
                    </div>
                  </div>
                )}

                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex",
                      msg.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {msg.role === "assistant" && (
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 mr-2 mt-0.5 shrink-0">
                        <Bot className="h-3 w-3 text-primary" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[82%] rounded-xl px-3 py-2.5 text-[13px] leading-relaxed",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-tr-sm"
                          : "bg-muted text-foreground rounded-tl-sm"
                      )}
                    >
                      {msg.loading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                          <span className="text-muted-foreground text-xs">Analyzing data…</span>
                        </div>
                      ) : (
                        <span>{formatMessage(msg.content)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* ── Suggested Questions ── */}
          {suggestionsOpen && messages.length === 0 && (
            <div className="shrink-0 border-t border-border/60 bg-muted/10">
              <button
                onClick={() => setSuggestionsOpen((o) => !o)}
                className="w-full flex items-center justify-between px-4 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <span className="font-medium">Suggested questions</span>
                <ChevronDown className="h-3 w-3" />
              </button>
              <div className="px-3 pb-2 flex flex-col gap-1">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    disabled={loading}
                    className={cn(
                      "text-left text-[11.5px] px-3 py-1.5 rounded-lg border border-border/60 text-muted-foreground",
                      "hover:bg-muted hover:text-foreground hover:border-border transition-all duration-150",
                      loading && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Input ── */}
          <div className="shrink-0 px-3 py-3 border-t border-border bg-card">
            <div className="flex items-end gap-2">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about pricing, promotions, availability, or competition…"
                rows={2}
                className="flex-1 resize-none text-xs rounded-lg min-h-[44px] max-h-[120px] py-2.5 leading-relaxed border-border/70"
                disabled={loading}
              />
              <Button
                size="icon"
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                className="h-9 w-9 rounded-lg shrink-0 mb-0.5"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground/60 text-center mt-1.5">
              Answers are based solely on dashboard datasets
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
