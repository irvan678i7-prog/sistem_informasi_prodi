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
  // Komentar opsional yang menyertai persetujuan/finalisasi, dan wajib saat
  // meminta revisi atau menolak.
  const [comment, setComment] = useState("");

  async function post(url: string, body?: unknown) {
    setErr(null);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body ?? {}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.message || "Gagal");
        return false;
      }
      router.refresh();
      return true;
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Gagal");
      return false;
    }
  }

  async function approve(which: 1 | 2 | 3) {
    setLoading("approve");
    await post(`/api/tesis/${tesisId}/judul/approve`, { which, comment });
    setLoading(null);
  }
  async function finalize() {
    setLoading("finalize");
    await post(`/api/tesis/${tesisId}/judul/finalize`, { comment });
    setLoading(null);
  }
  async function requestRevision() {
    if (comment.trim().length < 3) {
      setErr("Catatan revisi wajib diisi.");
      return;
    }
    setLoading("revisi");
    const ok = await post(`/api/tesis/${tesisId}/judul/revisi`, { comment });
    if (ok) setComment("");
    setLoading(null);
  }
  async function reject() {
    setLoading("reject");
    await post(`/api/tesis/${tesisId}/judul/reject`, { reason: comment });
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
          <Button onClick={() => approve(3)} disabled={!!loading}>
            Setujui Judul 3
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
      <FormRow
        label="Komentar / Catatan"
        htmlFor={`c-${tesisId}`}
        hint="Opsional saat menyetujui. Wajib saat meminta revisi atau menolak."
      >
        <Textarea
          id={`c-${tesisId}`}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </FormRow>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          onClick={requestRevision}
          disabled={!!loading}
        >
          {loading === "revisi" ? "Memproses..." : "Minta Revisi"}
        </Button>
        <Button variant="danger" onClick={reject} disabled={!!loading}>
          Tolak
        </Button>
      </div>
    </div>
  );
}
