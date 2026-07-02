import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { listTasks, computeAnalytics } from "@/lib/tasks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Sparkles, CheckCircle2, Clock, Flag, ListTodo } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { data: tasks } = useSuspenseQuery({
    queryKey: ["tasks"],
    queryFn: () => listTasks(),
  });
  const data = computeAnalytics(tasks);

  const stats = [
    { label: "Total tasks", value: data.total, icon: ListTodo, color: "text-primary" },
    { label: "Completed", value: data.completed, icon: CheckCircle2, color: "text-emerald-500" },
    { label: "Pending", value: data.pending, icon: Clock, color: "text-amber-500" },
    { label: "High priority", value: data.high, icon: Flag, color: "text-rose-500" },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {data.completionPct}% of your tasks are completed.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link to="/tasks/new">
              <PlusCircle /> New task
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/ai">
              <Sparkles /> Ask AI
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{s.label}</span>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <div className="mt-2 text-3xl font-semibold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent tasks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No tasks yet.{" "}
              <Link to="/tasks/new" className="text-primary hover:underline">
                Create your first one
              </Link>
              .
            </p>
          ) : (
            data.recent.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border/60"
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">{t.title}</div>
                  <div className="text-xs text-muted-foreground">{t.category}</div>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline">{t.priority}</Badge>
                  <Badge>{t.status.replace("_", " ")}</Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
