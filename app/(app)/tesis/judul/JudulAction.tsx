"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea, FormRow } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";

export function JudulAction({
  tesisId,
  mode = "pa",
}: {
  tesisId: string;
  mode?: "pa" | "kaprodi";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  async function approve(which: 1 | 2) {
    setErr(null);
    setLoading("approve");
    try {
      const res = await fetch(`/api/tesis/${tesisId}/judul/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ which }),
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
  async function finalize() {
    setErr(null);
    setLoading("finalize");
    try {
      const res = await fetch(`/api/tesis/${tesisId}/judul/finalize`, {
        method: "POST",
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
  async function reject() {
    setErr(null);
    setLoading("reject");
    try {
      const res = await fetch(`/api/tesis/${tesisId}/judul/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
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
    <div className="space-y-3 pt-2 border-t border-slate-200">
      {err && <Alert variant="error">{err}</Alert>}
      {mode === "pa" ? (
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => approve(1)} disabled={!!loading}>
            Setujui Judul 1
          </Button>
          <Button onClick={() => approve(2)} disabled={!!loading}>
            Setujui Judul 2
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button onClick={finalize} disabled={!!loading}>
            {loading === "finalize"
              ? "Memproses..."
              : "Finalisasi Judul (Kaprodi)"}
          </Button>
        </div>
      )}
      <FormRow label="Alasan Penolakan (opsional)" htmlFor={`r-${tesisId}`}>
        <Textarea
          id={`r-${tesisId}`}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </FormRow>
      <Button variant="danger" onClick={reject} disabled={!!loading}>
        Tolak
      </Button>
    </div>
  );
}
