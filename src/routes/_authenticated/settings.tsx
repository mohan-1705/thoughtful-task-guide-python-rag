import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/settings")({
  component: Settings,
});

function Settings() {
  const [email, setEmail] = useState<string>("");
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setEmail(u?.email ?? ""));
    return () => unsub();
  }, []);

  async function doSignOut() {
    await qc.cancelQueries();
    qc.clear();
    await signOut(auth);
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <Card>
        <CardHeader><CardTitle>Account</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-xs text-muted-foreground">Signed in as</div>
            <div className="font-medium">{email || "—"}</div>
          </div>
          <Button variant="destructive" onClick={doSignOut}>Sign out</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>About</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>Smart Task Dashboard uses a real Retrieval-Augmented Generation pipeline:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Each task is embedded with OpenAI text-embedding-3-small via the AI Gateway.</li>
            <li>Vectors are stored alongside your tasks in Firestore.</li>
            <li>Your question is embedded and top-k matches computed by cosine similarity.</li>
            <li>Gemini answers using only the retrieved context.</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
