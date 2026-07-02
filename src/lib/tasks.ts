// Client-side task CRUD via Firestore + embedding via the Python RAG backend (see python-backend/).
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "./firebase";

export type Priority = "low" | "medium" | "high";
export type Status = "pending" | "in_progress" | "completed";

export type TaskInput = {
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  category: string;
  due_date: string | null;
};

export type Task = TaskInput & {
  id: string;
  userId: string;
  embedding: number[] | null;
  created_at: string;
  updated_at: string;
};

const COL = "tasks";

function tsToIso(v: unknown): string {
  if (!v) return new Date().toISOString();
  if (v instanceof Timestamp) return v.toDate().toISOString();
  if (typeof v === "string") return v;
  return new Date().toISOString();
}

function requireUid() {
  const u = auth.currentUser;
  if (!u) throw new Error("Not signed in");
  return u.uid;
}

async function getIdToken(): Promise<string> {
  const u = auth.currentUser;
  if (!u) throw new Error("Not signed in");
  return await u.getIdToken();
}

function taskToDoc(t: TaskInput): string {
  return [
    `Title: ${t.title}`,
    `Description: ${t.description}`,
    `Priority: ${t.priority}`,
    `Status: ${t.status}`,
    `Category: ${t.category}`,
    t.due_date ? `Due: ${t.due_date}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

const PY_API = import.meta.env.VITE_PYTHON_API_URL as string | undefined;

async function embed(text: string): Promise<number[] | null> {
  try {
    if (!PY_API) throw new Error("Missing VITE_PYTHON_API_URL env var");
    const token = await getIdToken();
    const res = await fetch(`${PY_API}/embed`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error(await res.text());
    const j = (await res.json()) as { embedding: number[] };
    return j.embedding;
  } catch (e) {
    console.error("embed failed", e);
    return null;
  }
}

export async function listTasks(): Promise<Task[]> {
  const uid = requireUid();
  const q = query(collection(db, COL), where("userId", "==", uid));
  const snap = await getDocs(q);
  const rows = snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    return {
      id: d.id,
      userId: data.userId as string,
      title: (data.title as string) ?? "",
      description: (data.description as string) ?? "",
      priority: (data.priority as Priority) ?? "medium",
      status: (data.status as Status) ?? "pending",
      category: (data.category as string) ?? "general",
      due_date: (data.due_date as string | null) ?? null,
      embedding: (data.embedding as number[] | null) ?? null,
      created_at: tsToIso(data.created_at),
      updated_at: tsToIso(data.updated_at),
    } satisfies Task;
  });
  rows.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  return rows;
}

export async function getTask(id: string): Promise<Task> {
  const snap = await getDoc(doc(db, COL, id));
  if (!snap.exists()) throw new Error("Task not found");
  const data = snap.data() as Record<string, unknown>;
  return {
    id: snap.id,
    userId: data.userId as string,
    title: (data.title as string) ?? "",
    description: (data.description as string) ?? "",
    priority: (data.priority as Priority) ?? "medium",
    status: (data.status as Status) ?? "pending",
    category: (data.category as string) ?? "general",
    due_date: (data.due_date as string | null) ?? null,
    embedding: (data.embedding as number[] | null) ?? null,
    created_at: tsToIso(data.created_at),
    updated_at: tsToIso(data.updated_at),
  };
}

export async function createTask(input: TaskInput): Promise<string> {
  const uid = requireUid();
  const embedding = await embed(taskToDoc(input));
  const ref = await addDoc(collection(db, COL), {
    userId: uid,
    ...input,
    embedding,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
  return ref.id;
}

export async function updateTask(id: string, patch: Partial<TaskInput>): Promise<void> {
  const existing = await getTask(id);
  const merged: TaskInput = {
    title: patch.title ?? existing.title,
    description: patch.description ?? existing.description,
    priority: patch.priority ?? existing.priority,
    status: patch.status ?? existing.status,
    category: patch.category ?? existing.category,
    due_date: patch.due_date === undefined ? existing.due_date : patch.due_date,
  };
  const embedding = await embed(taskToDoc(merged));
  await updateDoc(doc(db, COL, id), {
    ...merged,
    embedding,
    updated_at: serverTimestamp(),
  });
}

export async function deleteTaskById(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}

export type Analytics = {
  total: number;
  completed: number;
  pending: number;
  inProgress: number;
  high: number;
  completionPct: number;
  byPriority: { low: number; medium: number; high: number };
  byStatus: { pending: number; in_progress: number; completed: number };
  recent: Task[];
};

export function computeAnalytics(tasks: Task[]): Analytics {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "completed").length;
  const pending = tasks.filter((t) => t.status === "pending").length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const high = tasks.filter((t) => t.priority === "high").length;
  return {
    total,
    completed,
    pending,
    inProgress,
    high,
    completionPct: total ? Math.round((completed / total) * 100) : 0,
    byPriority: {
      low: tasks.filter((t) => t.priority === "low").length,
      medium: tasks.filter((t) => t.priority === "medium").length,
      high,
    },
    byStatus: { pending, in_progress: inProgress, completed },
    recent: tasks.slice(0, 5),
  };
}

export async function askAI(
  question: string,
  tasks: Task[],
): Promise<{ answer: string; retrieved: Array<{ title: string; similarity: number }> }> {
  const token = await getIdToken();
  const payload = {
    question,
    tasks: tasks.map((t) => ({
      title: t.title,
      description: t.description,
      priority: t.priority,
      status: t.status,
      category: t.category,
      due_date: t.due_date,
      embedding: t.embedding,
    })),
  };
  const res = await fetch(`${PY_API}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}
