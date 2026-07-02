# RAG Backend (Python / FastAPI)

This replaces the old TypeScript API routes (`/api/embed`, `/api/ai/ask`) with the
same logic in Python: embeddings, cosine-similarity retrieval, and the Gemini answer —
deployed as its own service on Render.

## What it does

- `POST /embed` — takes `{ text }`, returns `{ embedding: number[] }`
- `POST /ask` — takes `{ question, tasks[] }`, does cosine-similarity retrieval over
  the tasks' stored embeddings, then asks Gemini (via Lovable AI Gateway) to answer
  using only the retrieved tasks as context.
- Both endpoints require a Firebase ID token in `Authorization: Bearer <token>`,
  verified the same way the old `firebase-admin.server.ts` did (Google's public JWKS,
  no service account key needed).

## Deploy on Render

1. Push this whole repo to GitHub (the `python-backend/` folder included).
2. On [render.com](https://render.com) → **New +** → **Web Service** → connect your repo.
3. Set:
   - **Root Directory**: `python-backend`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   (Render auto-detects most of this from `render.yaml` if you use "Blueprint" deploy instead.)
4. Add environment variables in Render's dashboard (Settings → Environment):
   - `FIREBASE_PROJECT_ID` = `thoughtful-task-guide`
   - `LOVABLE_API_KEY` = (same key your app already uses)
   - `FRONTEND_ORIGIN` = your Vercel URL, e.g. `https://thoughtful-task-guide.vercel.app`
     (use `*` temporarily while testing, but lock it down once it works)
5. Deploy. Render gives you a URL like `https://thoughtful-task-guide-rag-backend.onrender.com`.

## Connect the frontend

In your **frontend's** `.env` (and in Vercel → Project Settings → Environment Variables), add:

```
VITE_PYTHON_API_URL=https://thoughtful-task-guide-rag-backend.onrender.com
```

No trailing slash. `src/lib/tasks.ts` already calls `${VITE_PYTHON_API_URL}/embed` and
`${VITE_PYTHON_API_URL}/ask` — that's the only change needed on the frontend side.

Redeploy the frontend on Vercel after adding the env var.

## Local testing

```bash
cd python-backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env       # fill in real values
uvicorn main:app --reload --port 8000
```

Then set `VITE_PYTHON_API_URL=http://localhost:8000` in the frontend `.env` for local testing.

## Note on Render free tier

Free Render web services spin down after ~15 minutes of inactivity and take ~30-50
seconds to wake up on the next request. Your first AI question after idle time will
be slow — that's Render, not a bug in this code.
