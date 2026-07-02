import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type TaskFormValues = {
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  status: "pending" | "in_progress" | "completed";
  category: string;
  due_date: string | null;
};

const DEFAULTS: TaskFormValues = {
  title: "",
  description: "",
  priority: "medium",
  status: "pending",
  category: "general",
  due_date: null,
};

export function TaskForm({
  initial,
  onSubmit,
  submitLabel = "Create task",
}: {
  initial?: Partial<TaskFormValues>;
  onSubmit: (values: TaskFormValues) => Promise<void> | void;
  submitLabel?: string;
}) {
  const [values, setValues] = useState<TaskFormValues>({ ...DEFAULTS, ...initial });
  const [saving, setSaving] = useState(false);

  function set<K extends keyof TaskFormValues>(k: K, v: TaskFormValues[K]) {
    setValues((s) => ({ ...s, [k]: v }));
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
          await onSubmit(values);
        } finally {
          setSaving(false);
        }
      }}
      className="space-y-5 bg-card rounded-xl border border-border/60 p-6 shadow-sm"
    >
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          required
          value={values.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Ship the new landing page"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          rows={4}
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Details, links, acceptance criteria…"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Priority</Label>
          <Select value={values.priority} onValueChange={(v) => set("priority", v as TaskFormValues["priority"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={values.status} onValueChange={(v) => set("status", v as TaskFormValues["status"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            value={values.category}
            onChange={(e) => set("category", e.target.value)}
            placeholder="frontend, ai, ops…"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="due">Due date</Label>
          <Input
            id="due"
            type="date"
            value={values.due_date ? values.due_date.slice(0, 10) : ""}
            onChange={(e) => set("due_date", e.target.value ? new Date(e.target.value).toISOString() : null)}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
