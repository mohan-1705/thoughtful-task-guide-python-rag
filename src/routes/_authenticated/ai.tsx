import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { listTasks, askAI } from "@/lib/tasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Sparkles, Send, User } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/ai")({
  component: AI,
});

type Msg = { role: "user" | "assistant"; content: string; sources?: Array<{ title: string }> };

function AI() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hi! Ask me anything about your tasks — 'what's pending?', 'show high priority', 'summarize my workload'.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const q = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", content: q }]);
    setLoading(true);
    try {
      const tasks = await listTasks();
      const res = await askAI(q, tasks);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: res.answer,
          sources: res.retrieved.map((r) => ({ title: r.title })),
        },
      ]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AI failed");
    } finally {
      setLoading(false);
    }
  }

  const suggestions = [
    "What tasks are pending?",
    "Which tasks are high priority?",
    "Summarize my workload",
    "What's due soon?",
  ];

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-semibold">AI Assistant</h1>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
              {m.role === "assistant" && (
                <div className="h-8 w-8 rounded-full brand-gradient flex items-center justify-center shrink-0">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                  m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                {m.content}
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-border/40 text-xs opacity-80">
                    <div className="font-medium mb-1">Retrieved from:</div>
                    <ul className="space-y-0.5">
                      {m.sources.slice(0, 5).map((s, j) => (
                        <li key={j}>• {s.title}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              {m.role === "user" && (
                <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full brand-gradient flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div className="bg-muted rounded-2xl px-4 py-3 text-sm">
                <div className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-current animate-bounce" />
                  <span className="h-2 w-2 rounded-full bg-current animate-bounce [animation-delay:0.15s]" />
                  <span className="h-2 w-2 rounded-full bg-current animate-bounce [animation-delay:0.3s]" />
                </div>
              </div>
            </div>
          )}
        </div>

        {messages.length <= 1 && (
          <div className="px-4 pb-3 flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setInput(s)}
                className="text-xs px-3 py-1.5 rounded-full border border-border/60 hover:bg-muted transition"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={send} className="p-3 border-t border-border/60 flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your tasks…"
            disabled={loading}
          />
          <Button type="submit" disabled={loading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </Card>
    </div>
  );
}
