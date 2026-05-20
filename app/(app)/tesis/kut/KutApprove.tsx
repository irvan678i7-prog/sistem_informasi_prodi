"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Role } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

export function KutApprove({
  id,
  role,
  isP1,
  isP2,
}: {
  id: string;
  role: Role;
  isP1: boolean;
  isP2: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function call(by: "P1" | "P2" | "KAPRODI") {
    setErr(null);
    setLoading(by);
    try {
      const res = await fetch(`/api/tesis/kut/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ by }),
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
        {isP1 && (
          <Button onClick={() => call("P1")} disabled={!!loading}>
            Setujui sbg P1
          </Button>
        )}
        {isP2 && (
          <Button onClick={() => call("P2")} disabled={!!loading}>
            Setujui sbg P2
          </Button>
        )}
        {role === "KAPRODI" && (
          <Button onClick={() => call("KAPRODI")} disabled={!!loading} variant="secondary">
            Setujui sbg Kaprodi
          </Button>
        )}
      </div>
    </div>
  );
}
