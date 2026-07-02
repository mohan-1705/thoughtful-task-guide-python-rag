import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { getTask, updateTask } from "@/lib/tasks";
import { TaskForm } from "@/components/task-form";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/tasks/$id/edit")({
  component: EditTask,
});

function EditTask() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: task } = useSuspenseQuery({
    queryKey: ["task", id],
    queryFn: () => getTask(id),
  });

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-1">Edit task</h1>
      <p className="text-sm text-muted-foreground mb-6">Changes re-index the embedding.</p>
      <TaskForm
        initial={{
          title: task.title,
          description: task.description ?? "",
          priority: task.priority,
          status: task.status,
          category: task.category,
          due_date: task.due_date ?? null,
        }}
        submitLabel="Save changes"
        onSubmit={async (values) => {
          try {
            await updateTask(id, values);
            toast.success("Task updated");
            qc.invalidateQueries({ queryKey: ["tasks"] });
            qc.invalidateQueries({ queryKey: ["task", id] });
            navigate({ to: "/tasks" });
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to save");
          }
        }}
      />
    </div>
  );
}
