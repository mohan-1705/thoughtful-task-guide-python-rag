import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { listTasks, computeAnalytics } from "@/lib/tasks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/_authenticated/analytics")({
  component: Analytics,
});

const COLORS = ["oklch(0.55 0.22 265)", "oklch(0.7 0.18 200)", "oklch(0.72 0.2 140)", "oklch(0.75 0.2 60)", "oklch(0.65 0.25 20)"];

function Analytics() {
  const { data: tasks } = useSuspenseQuery({ queryKey: ["tasks"], queryFn: () => listTasks() });
  const data = computeAnalytics(tasks);

  const priorityData = [
    { name: "High", value: data.byPriority.high },
    { name: "Medium", value: data.byPriority.medium },
    { name: "Low", value: data.byPriority.low },
  ];
  const statusData = [
    { name: "Pending", value: data.byStatus.pending },
    { name: "In progress", value: data.byStatus.in_progress },
    { name: "Completed", value: data.byStatus.completed },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Completion rate: {data.completionPct}%
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>By status</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {statusData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>By priority</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={priorityData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90}>
                  {priorityData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
