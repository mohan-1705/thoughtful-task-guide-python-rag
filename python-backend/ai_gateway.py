"""
Calls the same Lovable AI Gateway your frontend already uses,
so you reuse the same LOVABLE_API_KEY and models — just from Python now.
"""
import os
import httpx

GATEWAY = "https://ai.gateway.lovable.dev/v1"


def _key() -> str:
    k = os.environ.get("LOVABLE_API_KEY")
    if not k:
        raise RuntimeError("Missing LOVABLE_API_KEY env var")
    return k


async def embed_text(text: str) -> list[float]:
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{GATEWAY}/embeddings",
            headers={
                "Content-Type": "application/json",
                "Lovable-API-Key": _key(),
            },
            json={"model": "openai/text-embedding-3-small", "input": text},
            timeout=30,
        )
        if resp.status_code != 200:
            raise RuntimeError(f"Embedding failed: {resp.status_code} {resp.text}")
        data = resp.json()
        return data["data"][0]["embedding"]


async def chat_completion(messages: list[dict]) -> str:
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{GATEWAY}/chat/completions",
            headers={
                "Content-Type": "application/json",
                "Lovable-API-Key": _key(),
            },
            json={"model": "google/gemini-3-flash-preview", "messages": messages},
            timeout=60,
        )
        if resp.status_code != 200:
            raise RuntimeError(f"Chat failed: {resp.status_code} {resp.text}")
        data = resp.json()
        return data["choices"][0]["message"]["content"]
