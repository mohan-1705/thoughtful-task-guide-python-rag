## Firebase migration plan

Migrating from Supabase → Firebase Auth + Firestore, keeping Lovable AI Gateway for Gemini + embeddings. RAG will run in-memory (cosine similarity in JS) on user's task list.

### 1. Setup
- `bun add firebase jose` (jose for verifying Firebase ID tokens on the server)
- Confirm existing `.env` Firebase keys are for the correct project. Add `authDomain` is already there. Enable Email/Password provider in Firebase console (user action).
- Extend `src/lib/firebase.ts` to export `auth` (getAuth) + `db` (getFirestore).

### 2. Auth (client)
- Rewrite `src/routes/auth.tsx` to use Firebase: `signInWithEmailAndPassword`, `createUserWithEmailAndPassword`. Unique email is enforced by Firebase automatically. Friendly errors for `auth/email-already-in-use`, `auth/invalid-credential`, etc.
- Rewrite `src/routes/_authenticated/route.tsx` gate: subscribe to `onAuthStateChanged`, redirect to `/auth` if no user. Keep `ssr: false`.
- Update `__root.tsx`: replace Supabase auth listener with Firebase `onAuthStateChanged` → invalidate router + react-query.
- Sidebar logout: `signOut(auth)`.

### 3. Firestore data model
- Collection `tasks/{taskId}` with fields: `userId, title, description, priority, status, category, dueDate, embedding (number[]), createdAt, updatedAt`.
- Firestore security rules (user must apply in Firebase console — I'll document them):
  ```
  match /tasks/{id} {
    allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
  }
  ```

### 4. Task CRUD (client-side via Firestore SDK)
- Replace `src/lib/tasks.functions.ts` server functions with a client module `src/lib/tasks.ts` using Firestore: `addDoc`, `updateDoc`, `deleteDoc`, `query(where userId==uid)`.
- On create/update, call a **server route** `/api/embed` that verifies the user's Firebase ID token and returns the embedding from Lovable AI Gateway. Store the embedding array in the Firestore doc.
- Update all task routes (`tasks.tsx`, `tasks.new.tsx`, `tasks.$id.edit.tsx`, `dashboard.tsx`, `analytics.tsx`) to use react-query with the new client functions.

### 5. RAG (in-memory)
- New server route `/api/ai/ask` — verifies Firebase ID token (via `jose` + Google JWKS), accepts `{ question, tasks: [{id, title, description, priority, ..., embedding }] }`, embeds the question via Lovable AI Gateway, computes cosine similarity in JS, picks top-8, calls Gemini with retrieved context, returns `{ answer, retrieved }`.
- `src/routes/_authenticated/ai.tsx`: load user's tasks from Firestore, POST them + question to `/api/ai/ask` with the ID token in the `Authorization` header.

### 6. Server helpers
- `src/lib/firebase-admin.server.ts` — verifies Firebase ID tokens using `jose` against `https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com`, checks `iss`, `aud=<projectId>`, `exp`. Reads `FIREBASE_PROJECT_ID` from `process.env` (I'll add it as a secret).
- `src/lib/ai-gateway.server.ts` — keep as-is.

### 7. Cleanup
- Delete Supabase-specific route middleware usage from any remaining file. `src/integrations/supabase/*` stays untouched (auto-generated) but is no longer imported by app code.
- Delete old `src/lib/rag/*`, `src/lib/ragService.ts`, `src/lib/taskService.ts` (stale), `src/hooks/useRAG.ts`.
- Remove `attachSupabaseAuth` from `src/start.ts` `functionMiddleware`.
- Drop the `tasks` table in Supabase — not needed (I won't touch it; harmless).

### 8. Deployment notes
- Firebase config values are already publishable → safe in `.env`.
- Need `FIREBASE_PROJECT_ID` as a server secret (same value as VITE_FIREBASE_PROJECT_ID) for token verification.
- No Supabase config required for the app; Lovable Cloud still provides the Worker runtime + `LOVABLE_API_KEY`.

### Trade-offs
- **In-memory RAG**: fine up to a few hundred tasks per user. Above that, latency grows linearly. If you scale bigger later, we can add Pinecone or move back to pgvector.
- **Firestore reads**: every AI question loads all user tasks (with embeddings) from Firestore once — one query per question.
- **Firebase Auth on server**: verified via public JWKS (no service account key needed, no firebase-admin SDK — works on Cloudflare Workers).

### Files touched (approx)
Create: `src/lib/firebase.ts` (rewrite), `src/lib/tasks.ts`, `src/lib/firebase-admin.server.ts`, `src/routes/api/embed.ts`, `src/routes/api/ai/ask.ts`, `src/hooks/useAuth.ts`.
Rewrite: `src/routes/auth.tsx`, `src/routes/__root.tsx`, `src/routes/_authenticated/route.tsx`, `src/components/app-sidebar.tsx`, all `_authenticated/*` route files, `src/start.ts`.
Delete: `src/lib/tasks.functions.ts`, `src/lib/rag/*`, `src/lib/ragService.ts`, `src/lib/taskService.ts` (old stub), `src/hooks/useRAG.ts`, `src/routes/_authenticated/settings.tsx` (Supabase-specific — I'll rewrite to Firebase).

Approve to proceed and I'll implement the full migration in one pass.
