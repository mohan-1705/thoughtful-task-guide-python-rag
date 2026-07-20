from fastapi import APIRouter
from database import get_db

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("")
def get_dashboard_metrics():
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM tasks")
    total = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM tasks WHERE status='pending'")
    pending = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM tasks WHERE status='completed'")
    completed = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM tasks WHERE priority='high'")
    high_priority = cursor.fetchone()[0]

    cursor.execute("SELECT * FROM tasks ORDER BY created_at DESC LIMIT 5")
    recent_tasks = [dict(row) for row in cursor.fetchall()]

    conn.close()

    return {
        "total": total,
        "pending": pending,
        "completed": completed,
        "high_priority": high_priority,
        "recent_tasks": recent_tasks
    }
