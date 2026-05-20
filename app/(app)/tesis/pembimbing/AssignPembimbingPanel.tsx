"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Select, FormRow } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

export function AssignPembimbingPanel({
  tesisId,
  dosen,
  initialP1 = "",
  initialP2 = "",
  hasExisting = false,
}: {
  tesisId: string;
  dosen: { id: string; name: string }[];
  initialP1?: string;
  initialP2?: string;
  hasExisting?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [p1, setP1] = useState(initialP1);
  const [p2, setP2] = useState(initialP2);
  const [nomor, setNomor] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOkMsg(null);
    if (!p1) {
      setErr("Pembimbing 1 wajib dipilih");
      return;
    }
    if (p2 && p2 === p1) {
      setErr("Pembimbing 1 dan 2 tidak boleh sama");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/tesis/${tesisId}/assign-pembimbing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pembimbing1Id: p1,
          pembimbing2Id: p2 || null,
          nomor: nomor.trim() || null,
        }),
      });
      const text = await res.text();
      let data: { message?: string; nomor?: string; code?: string } = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }
      if (!res.ok) {
        setErr(data.message || `Gagal (${res.status})`);
        setLoading(false);
        return;
      }
      setOkMsg(
        `SK Pembimbing terbit: ${data.nomor}. Notifikasi dikirim ke pembimbing.`,
      );
      router.refresh();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Gagal");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <Button
        type="button"
        variant={hasExisting ? "secondary" : "primary"}
        onClick={() => {
          setOpen(true);
          setOkMsg(null);
        }}
      >
        {hasExisting ? "Ubah Pembimbing" : "Tetapkan Pembimbing"}
      </Button>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 pt-3 mt-2 border-t border-slate-200"
    >
      {err && <Alert variant="error">{err}</Alert>}
      {okMsg && <Alert variant="success">{okMsg}</Alert>}
      <div className="grid sm:grid-cols-2 gap-3">
        <FormRow label="Pembimbing 1" htmlFor={`p1-${tesisId}`} required>
          <Select
            id={`p1-${tesisId}`}
            value={p1}
            onChange={(e) => setP1(e.target.value)}
          >
            <option value="">— pilih dosen —</option>
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
            <option value="">— tidak ada —</option>
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
      <FormRow
        label="Nomor SK (opsional)"
        htmlFor={`nomor-${tesisId}`}
        hint="Kosongkan untuk auto-generate. Contoh manual: 0123/II.3.AU/SK.PPs/V/2026"
      >
        <Input
          id={`nomor-${tesisId}`}
          value={nomor}
          onChange={(e) => setNomor(e.target.value)}
          placeholder="(kosong = otomatis)"
        />
      </FormRow>
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading
            ? "Memproses..."
            : hasExisting
              ? "Simpan & Terbitkan SK Baru"
              : "Tetapkan & Terbitkan SK"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setOpen(false);
            setErr(null);
            setOkMsg(null);
          }}
          disabled={loading}
        >
          Batal
        </Button>
      </div>
      <p className="text-xs text-slate-500">
        Setelah disimpan, SK Pembimbing baru akan diterbitkan & ditandatangani
        elektronik. Notifikasi otomatis dikirim ke mahasiswa, pembimbing baru,
        dan pembimbing lama (jika ada perubahan).
      </p>
    </form>
  );
}
