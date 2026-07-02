import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { TaskForm } from "@/components/task-form";
import { createTask } from "@/lib/tasks";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/tasks/new")({
  component: NewTask,
});

function NewTask() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-1">New task</h1>
      <p className="text-sm text-muted-foreground mb-6">
        The task will be embedded and indexed for AI retrieval.
      </p>
      <TaskForm
        onSubmit={async (values) => {
          try {
            await createTask(values);
            toast.success("Task created");
            qc.invalidateQueries({ queryKey: ["tasks"] });
            navigate({ to: "/tasks" });
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to create");
          }
        }}
      />
    </div>
  );
}
