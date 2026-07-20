from database import get_db
from rag.embeddings import get_embedding
from rag.vector_store import vector_store

def index_task_in_rag(task_id: str, title: str, description: str):
    text = f"Title: {title}. Description: {description}"
    emb = get_embedding(text)
    vector_store.add_or_update_task(task_id, emb)

def remove_task_from_rag(task_id: str):
    vector_store.remove_task(task_id)

def retrieve_relevant_tasks(query: str, top_k=5):
    query_emb = get_embedding(query)
    task_ids = vector_store.search(query_emb, top_k=top_k)
    
    if not task_ids:
        return []
    
    conn = get_db()
    cursor = conn.cursor()
    placeholders = ",".join(["?"] * len(task_ids))
    cursor.execute(f"SELECT * FROM tasks WHERE id IN ({placeholders})", task_ids)
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]
