"""
Python RAG backend for thoughtful-task-guide.
Replaces src/routes/api/embed.ts and src/routes/api/ai/ask.ts (TypeScript)
with the same logic in Python, deployed separately on Render.

Endpoints:
  GET  /health          -> simple health check
  POST /embed            -> { text } -> { embedding: number[] }
  POST /ask               -> { question, tasks[] } -> { answer, retrieved[] }
"""
import math
import os
from typing import Optional

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from auth import require_auth
from ai_gateway import embed_text, chat_completion

app = FastAPI(title="thoughtful-task-guide RAG backend")

# Allow your frontend (Vercel) to call this API from the browser.
# Set FRONTEND_ORIGIN in Render env vars to your exact Vercel URL for production.
FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN", "*")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN] if FRONTEND_ORIGIN != "*" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok"}


# ---------- /embed ----------

class EmbedRequest(BaseModel):
    text: str


@app.post("/embed")
async def embed(body: EmbedRequest, user: dict = Depends(require_auth)):
    if not body.text:
        raise HTTPException(status_code=400, detail="Missing text")
    try:
        embedding = await embed_text(body.text)
        return {"embedding": embedding}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding failed: {e}")


# ---------- /ask ----------

class TaskDTO(BaseModel):
    title: str
    description: str
    priority: str
    status: str
    category: str
    due_date: Optional[str] = None
    embedding: Optional[list[float]] = None


class AskRequest(BaseModel):
    question: str
    tasks: list[TaskDTO] = []


def cosine(a: list[float], b: list[float]) -> float:
    n = min(len(a), len(b))
    dot = na = nb = 0.0
    for i in range(n):
        dot += a[i] * b[i]
        na += a[i] * a[i]
        nb += b[i] * b[i]
    if na == 0 or nb == 0:
        return 0.0
    return dot / (math.sqrt(na) * math.sqrt(nb))


@app.post("/ask")
async def ask(body: AskRequest, user: dict = Depends(require_auth)):
    if not body.question:
        raise HTTPException(status_code=400, detail="Missing question")

    retrieved: list[dict] = []
    try:
        q_emb = await embed_text(body.question)
        scored = [
            {**t.model_dump(), "similarity": cosine(q_emb, t.embedding)}
            for t in body.tasks
            if t.embedding
        ]
        scored.sort(key=lambda t: t["similarity"], reverse=True)
        retrieved = scored[:8]
    except Exception as e:
        print("retrieval failed:", e)
        retrieved = [{**t.model_dump(), "similarity": 0.0} for t in body.tasks[:8]]

    if retrieved:
        context_block = "\n\n".join(
            f"[{i+1}] {t['title']} | priority={t['priority']} | status={t['status']} | "
            f"category={t['category']}" + (f" | due={t['due_date']}" if t.get("due_date") else "")
            + f"\n{t.get('description') or ''}"
            for i, t in enumerate(retrieved)
        )
    else:
        context_block = "(no tasks found)"

    try:
        answer = await chat_completion(
            [
                {
                    "role": "system",
                    "content": (
                        "You are an AI Task Assistant. Answer ONLY using the retrieved "
                        'context below. If no relevant tasks exist, reply exactly: '
                        '"I couldn\'t find any relevant task." Never invent tasks. '
                        f"Be concise and helpful.\n\nRetrieved tasks:\n{context_block}"
                    ),
                },
                {"role": "user", "content": body.question},
            ]
        )
        return {
            "answer": answer,
            "retrieved": [{"title": t["title"], "similarity": t["similarity"]} for t in retrieved],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI failed: {e}")
