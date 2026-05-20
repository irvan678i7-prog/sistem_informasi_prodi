"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

export function AssignPAPanel({
  tesisId,
  dosen,
  initialPaId = "",
}: {
  tesisId: string;
  dosen: { id: string; name: string }[];
  initialPaId?: string;
}) {
  const router = useRouter();
  const [paId, setPaId] = useState(initialPaId);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  async function onSave() {
    setErr(null);
    setOkMsg(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/tesis/${tesisId}/assign-pa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paId: paId || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.message || `Gagal (${res.status})`);
        setLoading(false);
        return;
      }
      setOkMsg(paId ? "PA tersimpan" : "PA dilepas");
      router.refresh();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Gagal");
    } finally {
      setLoading(false);
    }
  }

  const changed = paId !== initialPaId;

  return (
    <div className="space-y-2">
      {err && <Alert variant="error">{err}</Alert>}
      {okMsg && <Alert variant="success">{okMsg}</Alert>}
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex-1 min-w-[220px]">
          <label className="label" htmlFor={`pa-${tesisId}`}>
            Pembimbing Akademik (PA)
          </label>
          <Select
            id={`pa-${tesisId}`}
            value={paId}
            onChange={(e) => setPaId(e.target.value)}
          >
            <option value="">— belum ditentukan —</option>
            {dosen.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
        </div>
        <Button
          type="button"
          onClick={onSave}
          disabled={loading || !changed}
          variant="secondary"
        >
          {loading ? "Menyimpan..." : "Simpan PA"}
        </Button>
      </div>
      <p className="text-xs text-slate-500">
        PA berbeda dari Pembimbing 1 / 2. PA mendampingi mahasiswa secara
        akademis sejak awal; pembimbing 1/2 adalah pembimbing tesis (memerlukan
        SK).
      </p>
    </div>
  );
}
