"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Select, FormRow } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

export function SKPembimbingPanel({
  tesisId,
  dosen,
}: {
  tesisId: string;
  dosen: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit() {
    setErr(null);
    if (!p1) {
      setErr("Pembimbing 1 wajib");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/tesis/${tesisId}/sk-pembimbing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pembimbing1Id: p1, pembimbing2Id: p2 || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.message || "Gagal");
        setLoading(false);
        return;
      }
      router.refresh();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Gagal";
      setErr(msg);
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3 pt-2 border-t border-slate-200">
      {err && <Alert variant="error">{err}</Alert>}
      <div className="grid sm:grid-cols-2 gap-3">
        <FormRow label="Pembimbing 1" htmlFor={`p1-${tesisId}`} required>
          <Select
            id={`p1-${tesisId}`}
            value={p1}
            onChange={(e) => setP1(e.target.value)}
          >
            <option value="">— pilih —</option>
            {dosen.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
        </FormRow>
        <FormRow label="Pembimbing 2 (opsional)" htmlFor={`p2-${tesisId}`}>
          <Select
            id={`p2-${tesisId}`}
            value={p2}
            onChange={(e) => setP2(e.target.value)}
          >
            <option value="">— pilih —</option>
            {dosen
              .filter((d) => d.id !== p1)
              .map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
          </Select>
        </FormRow>
      </div>
      <Button onClick={onSubmit} disabled={loading}>
        {loading ? "Memproses..." : "Tetapkan & Terbitkan SK"}
      </Button>
    </div>
  );
}
