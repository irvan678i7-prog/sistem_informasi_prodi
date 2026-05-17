"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Select, FormRow } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { ArrowLeft, Eye, Send } from "lucide-react";
import { formatDate } from "@/lib/utils";

export function SidangForm({
  tesisId,
  disabled,
  mahasiswa,
}: {
  tesisId: string;
  disabled?: boolean;
  mahasiswa: { name: string; nimNip: string; prodi: string | null; judul: string };
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [tanggal, setTanggal] = useState("");
  const [ruang, setRuang] = useState("");
  const [sidangMode, setSidangMode] = useState<"OFFLINE" | "ONLINE">("OFFLINE");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function validate() {
    if (!tanggal) return "Tanggal wajib";
    return null;
  }
  function onPreview(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (disabled) return setErr("KUT belum disetujui");
    const v = validate();
    if (v) return setErr(v);
    setMode("preview");
  }
  async function onSubmit() {
    setErr(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/tesis/sidang", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tesisId, jadwal: tanggal, ruang, mode: sidangMode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.message || "Gagal");
        setSubmitting(false);
        return;
      }
      router.refresh();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Gagal";
      setErr(msg);
      setSubmitting(false);
    }
  }

  if (mode === "preview") {
    return (
      <div className="space-y-4">
        <Alert variant="warning" title="Pratinjau Pendaftaran Sidang">
          Periksa sebelum kirim.
        </Alert>
        <div className="print-page shadow-sm border border-slate-200">
          <header className="text-center border-b border-slate-800 pb-2 mb-4">
            <h3 className="text-base font-bold uppercase">
              Formulir Pendaftaran Sidang Ujian Tesis
            </h3>
            <p className="text-[11px]">
              Program Pascasarjana · Universitas Muhammadiyah Metro
            </p>
          </header>
          <div className="meta-line"><div>Nama</div><div>:</div><div>{mahasiswa.name}</div></div>
          <div className="meta-line"><div>NIM</div><div>:</div><div>{mahasiswa.nimNip}</div></div>
          <div className="meta-line"><div>Program Studi</div><div>:</div><div>{mahasiswa.prodi || "-"}</div></div>
          <div className="meta-line"><div>Judul</div><div>:</div><div>{mahasiswa.judul || "-"}</div></div>
          <div className="meta-line"><div>Tanggal</div><div>:</div><div>{tanggal ? formatDate(tanggal) : "-"}</div></div>
          <div className="meta-line"><div>Ruang</div><div>:</div><div>{ruang || "-"}</div></div>
          <div className="meta-line"><div>Mode</div><div>:</div><div>{sidangMode}</div></div>
          <div className="ttd">
            <div className="col" />
            <div className="col">
              <p>Pemohon,</p>
              <p style={{ marginTop: 60 }} className="font-semibold underline">
                {mahasiswa.name}
              </p>
            </div>
          </div>
        </div>
        {err && <Alert variant="error">{err}</Alert>}
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setMode("edit")}>
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Edit
          </Button>
          <Button onClick={onSubmit} disabled={submitting}>
            <Send className="w-4 h-4 mr-1.5" />
            {submitting ? "Mengirim..." : "Kirim"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onPreview} className="space-y-4">
      {err && <Alert variant="error">{err}</Alert>}
      {disabled && (
        <Alert variant="warning">
          KUT belum disetujui. Form ini tidak aktif.
        </Alert>
      )}
      <div className="grid sm:grid-cols-2 gap-4">
        <FormRow label="Tanggal Sidang" htmlFor="t" required>
          <Input
            id="t"
            type="datetime-local"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
          />
        </FormRow>
        <FormRow label="Ruang (opsional)" htmlFor="r">
          <Input
            id="r"
            value={ruang}
            onChange={(e) => setRuang(e.target.value)}
          />
        </FormRow>
        <FormRow label="Mode" htmlFor="m">
          <Select
            id="m"
            value={sidangMode}
            onChange={(e) => setSidangMode(e.target.value as "OFFLINE" | "ONLINE")}
          >
            <option value="OFFLINE">Luring (Offline)</option>
            <option value="ONLINE">Daring (Online)</option>
          </Select>
        </FormRow>
      </div>
      <Button type="submit" variant="secondary" disabled={disabled}>
        <Eye className="w-4 h-4 mr-1.5" /> Pratinjau
      </Button>
    </form>
  );
}
