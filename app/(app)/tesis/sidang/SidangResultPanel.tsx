"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Role } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Input, FormRow } from "@/components/ui/input";

export function SidangResultPanel({
  id,
  role,
}: {
  id: string;
  role: Role;
}) {
  const router = useRouter();
  const [nilai, setNilai] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  if (role === "MAHASISWA") return null;

  async function setResult(result: "LULUS" | "LULUS_DENGAN_REVISI" | "TIDAK_LULUS") {
    setErr(null);
    setLoading(result);
    try {
      const res = await fetch(`/api/tesis/sidang/${id}/result`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result, nilai }),
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
      <FormRow label="Nilai (opsional)" htmlFor={`n-${id}`}>
        <Input
          id={`n-${id}`}
          value={nilai}
          onChange={(e) => setNilai(e.target.value)}
          placeholder="Mis. A / 3.85"
        />
      </FormRow>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setResult("LULUS")} disabled={!!loading}>
          Lulus
        </Button>
        <Button onClick={() => setResult("LULUS_DENGAN_REVISI")} disabled={!!loading} variant="secondary">
          Lulus + Revisi
        </Button>
        <Button onClick={() => setResult("TIDAK_LULUS")} disabled={!!loading} variant="danger">
          Tidak Lulus
        </Button>
      </div>
    </div>
  );
}
