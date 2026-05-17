"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { RequestStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Textarea, FormRow } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Check, X, Stamp, Eye } from "lucide-react";

export function LetterActions({
  id,
  status,
  canApprove,
}: {
  id: string;
  status: RequestStatus;
  canApprove: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  async function act(action: "verify" | "approve" | "reject" | "sign") {
    setErr(null);
    setLoading(action);
    try {
      const res = await fetch(`/api/surat/${id}/${action}`, {
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
    <div className="space-y-3">
      {err && <Alert variant="error">{err}</Alert>}

      {status === "SUBMITTED" && (
        <Button
          variant="secondary"
          onClick={() => act("verify")}
          disabled={!!loading}
          className="w-full"
        >
          <Eye className="w-4 h-4 mr-1.5" />
          {loading === "verify" ? "Memverifikasi..." : "Verifikasi"}
        </Button>
      )}
      {status === "VERIFIED" && canApprove && (
        <Button
          onClick={() => act("approve")}
          disabled={!!loading}
          className="w-full"
        >
          <Check className="w-4 h-4 mr-1.5" />
          {loading === "approve" ? "Menyetujui..." : "Setujui"}
        </Button>
      )}
      {status === "APPROVED" && canApprove && (
        <Button
          onClick={() => act("sign")}
          disabled={!!loading}
          className="w-full"
        >
          <Stamp className="w-4 h-4 mr-1.5" />
          {loading === "sign" ? "Menerbitkan..." : "Terbitkan + TTD Elektronik"}
        </Button>
      )}
      {(status === "SUBMITTED" || status === "VERIFIED") && (
        <div className="pt-2 border-t border-slate-200 space-y-2">
          <FormRow label="Alasan Penolakan (opsional)" htmlFor="reason">
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Tuliskan alasan jika ditolak."
            />
          </FormRow>
          <Button
            variant="danger"
            onClick={() => act("reject")}
            disabled={!!loading}
            className="w-full"
          >
            <X className="w-4 h-4 mr-1.5" />
            {loading === "reject" ? "Memproses..." : "Tolak"}
          </Button>
        </div>
      )}
    </div>
  );
}
