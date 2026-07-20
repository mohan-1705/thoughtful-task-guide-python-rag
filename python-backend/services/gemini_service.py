import google.generativeai as genai
from config import GEMINI_API_KEY

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')

def generate_rag_answer(question: str, context_tasks: list) -> str:
    if not context_tasks:
        context_str = "No relevant tasks found in the database."
    else:
        context_str = "\n".join([
            f"- [{t['status'].upper()}] {t['title']} (Priority: {t['priority']}): {t['description'] or 'No details'}"
            for t in context_tasks
        ])

    prompt = f"""
You are an intelligent task assistant. Answer the user's question ONLY using the retrieved task context provided below.
If the information is not present in the tasks context, clearly state that you do not have enough information in your task records.

Context Tasks:
{context_str}

User Question: {question}

Answer:
"""
    response = model.generate_content(prompt)
    return response.text
