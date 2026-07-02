import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Sparkles, ListChecks, BarChart3, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

export const Route = createFileRoute("/")({
  ssr: false,
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) navigate({ to: "/dashboard", replace: true });
    });
    return () => unsub();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-10 bg-background/80">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg brand-gradient" />
            <span className="font-semibold">Smart Tasks</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" asChild>
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button asChild>
              <Link to="/auth" search={{ mode: "signup" }}>Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-sm mb-6">
            <Sparkles className="h-3.5 w-3.5" /> Powered by real Retrieval-Augmented Generation
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            Your tasks, <span className="text-brand-gradient">supercharged</span> by AI.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Create, organize, and ask questions about your work. Every task is embedded and
            searched semantically — the assistant only answers from your real data.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button size="lg" asChild>
              <Link to="/auth" search={{ mode: "signup" }}>Create free account</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/auth">Sign in</Link>
            </Button>
          </div>
        </div>

        <div className="mt-20 grid gap-6 md:grid-cols-3">
          {[
            { icon: ListChecks, title: "Full task CRUD", body: "Create, edit, filter, sort, search — everything you'd expect." },
            { icon: BarChart3, title: "Analytics", body: "Completion %, priority breakdown, status charts." },
            { icon: MessageSquare, title: "RAG Assistant", body: "Ask 'what's due today?' — answers grounded in your tasks." },
          ].map((f) => (
            <div key={f.title} className="p-6 rounded-xl bg-card border border-border/60 shadow-sm">
              <f.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-3 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
