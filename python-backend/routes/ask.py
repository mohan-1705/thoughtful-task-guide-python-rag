from fastapi import APIRouter
from pydantic import BaseModel
from rag.rag_service import retrieve_relevant_tasks
from services.gemini_service import generate_rag_answer

router = APIRouter(tags=["AI Assistant"])

class QuerySchema(BaseModel):
    question: str

@router.post("/ask")
def ask_assistant(body: QuerySchema):
    retrieved_tasks = retrieve_relevant_tasks(body.question, top_k=5)
    answer = generate_rag_answer(body.question, retrieved_tasks)
    return {
        "answer": answer,
        "retrieved_context": retrieved_tasks
    }
