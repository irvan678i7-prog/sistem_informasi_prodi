"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

export function SeminarApprove({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function call(action: "lulus" | "lulus-revisi" | "tidak") {
    setErr(null);
    setLoading(action);
    try {
      const res = await fetch(`/api/tesis/seminar/${id}/result`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result: action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.message || "Gagal");
        setLoading(null);
        return;
      }
      router.refresh();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Gagal";
      setErr(msg);
    }
    setLoading(null);
  }

  return (
    <div className="space-y-2 pt-2 border-t border-slate-200">
      {err && <Alert variant="error">{err}</Alert>}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => call("lulus")} disabled={!!loading}>
          Lulus
        </Button>
        <Button onClick={() => call("lulus-revisi")} disabled={!!loading} variant="secondary">
          Lulus + Revisi
        </Button>
        <Button onClick={() => call("tidak")} disabled={!!loading} variant="danger">
          Tidak Lulus
        </Button>
      </div>
    </div>
  );
}
