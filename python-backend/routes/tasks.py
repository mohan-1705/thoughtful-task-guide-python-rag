from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import uuid
from database import get_db
from rag.rag_service import index_task_in_rag, remove_task_from_rag

router = APIRouter(prefix="/tasks", tags=["Tasks"])

class TaskSchema(BaseModel):
    title: str
    description: str = ""
    status: str = "pending"
    priority: str = "medium"
    due_date: str = ""

@router.get("")
def get_tasks():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tasks ORDER BY created_at DESC")
    tasks = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return tasks

@router.post("")
def create_task(task: TaskSchema):
    task_id = str(uuid.uuid4())
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO tasks (id, title, description, status, priority, due_date) VALUES (?, ?, ?, ?, ?, ?)",
        (task_id, task.title, task.description, task.status, task.priority, task.due_date)
    )
    conn.commit()
    conn.close()

    # Auto-index in FAISS RAG
    index_task_in_rag(task_id, task.title, task.description)

    return {"id": task_id, "message": "Task created successfully"}

@router.put("/{task_id}")
def update_task(task_id: str, task: TaskSchema):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE tasks SET title=?, description=?, status=?, priority=?, due_date=? WHERE id=?",
        (task.title, task.description, task.status, task.priority, task.due_date, task_id)
    )
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Task not found")
    conn.commit()
    conn.close()

    # Re-index in FAISS RAG
    index_task_in_rag(task_id, task.title, task.description)

    return {"message": "Task updated successfully"}

@router.delete("/{task_id}")
def delete_task(task_id: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM tasks WHERE id=?", (task_id,))
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Task not found")
    conn.commit()
    conn.close()

    # Remove from FAISS RAG
    remove_task_from_rag(task_id)

    return {"message": "Task deleted successfully"}
