"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Textarea,
  Select,
  FormRow,
} from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { formatDate } from "@/lib/utils";
import { Eye, Send, ArrowLeft } from "lucide-react";

export function JudulForm({
  dosen,
  initial,
  mahasiswa,
}: {
  dosen: { id: string; name: string }[];
  initial: { judul1: string; judul2: string; paId: string };
  mahasiswa: { name: string; nimNip: string; prodi: string | null };
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [judul1, setJudul1] = useState(initial.judul1);
  const [judul2, setJudul2] = useState(initial.judul2);
  const [paId, setPaId] = useState(initial.paId);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function validate() {
    if (!judul1.trim()) return "Judul 1 wajib diisi";
    if (!judul2.trim()) return "Judul 2 wajib diisi";
    if (!paId) return "Pilih Pembimbing Akademik";
    return null;
  }
  function onPreview(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const v = validate();
    if (v) return setErr(v);
    setMode("preview");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  async function onSubmit() {
    setErr(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/tesis/judul", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ judul1, judul2, paId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.message || "Gagal mengajukan");
        setSubmitting(false);
        return;
      }
      router.push("/tesis");
      router.refresh();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Gagal mengajukan";
      setErr(msg);
      setSubmitting(false);
    }
  }

  const dosenName = dosen.find((d) => d.id === paId)?.name || "-";

  if (mode === "preview") {
    return (
      <div className="space-y-4">
        <Alert variant="warning" title="Pratinjau Formulir Pengajuan Judul">
          Periksa kembali isian Anda. Setelah dikirim, formulir masuk antrian
          PA.
        </Alert>
        <div className="print-page shadow-sm border border-slate-200">
          <header className="text-center border-b border-slate-800 pb-2 mb-4">
            <h3 className="text-base font-bold uppercase">
              Formulir Pengajuan Judul Tesis
            </h3>
            <p className="text-[11px]">
              Program Pascasarjana · Universitas Muhammadiyah Metro
            </p>
          </header>
          <div className="meta-line">
            <div>Nama</div><div>:</div><div>{mahasiswa.name}</div>
          </div>
          <div className="meta-line">
            <div>NIM</div><div>:</div><div>{mahasiswa.nimNip}</div>
          </div>
          <div className="meta-line">
            <div>Program Studi</div><div>:</div><div>{mahasiswa.prodi || "-"}</div>
          </div>
          <table className="simple mt-3">
            <thead>
              <tr><th style={{ width: 40 }}>No</th><th>Judul Yang Diajukan</th></tr>
            </thead>
            <tbody>
              <tr><td>1</td><td>{judul1}</td></tr>
              <tr><td>2</td><td>{judul2}</td></tr>
            </tbody>
          </table>
          <div className="ttd">
            <div className="col">
              <p>Pemohon,</p>
              <p style={{ marginTop: 60 }} className="font-semibold underline">
                {mahasiswa.name}
              </p>
            </div>
            <div className="col">
              <p>Metro, {formatDate(new Date())}</p>
              <p>Pembimbing Akademik,</p>
              <p style={{ marginTop: 60 }} className="font-semibold underline">
                {dosenName}
              </p>
            </div>
          </div>
        </div>
        {err && <Alert variant="error">{err}</Alert>}
        <div className="flex flex-wrap gap-2 no-print">
          <Button variant="secondary" onClick={() => setMode("edit")}>
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Kembali Edit
          </Button>
          <Button onClick={onSubmit} disabled={submitting}>
            <Send className="w-4 h-4 mr-1.5" />
            {submitting ? "Mengirim..." : "Kirim ke PA"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onPreview} className="space-y-4">
      {err && <Alert variant="error">{err}</Alert>}
      <FormRow label="Judul 1" htmlFor="judul1" required>
        <Textarea
          id="judul1"
          value={judul1}
          onChange={(e) => setJudul1(e.target.value)}
        />
      </FormRow>
      <FormRow label="Judul 2" htmlFor="judul2" required>
        <Textarea
          id="judul2"
          value={judul2}
          onChange={(e) => setJudul2(e.target.value)}
        />
      </FormRow>
      <FormRow label="Pembimbing Akademik" htmlFor="paId" required>
        <Select
          id="paId"
          value={paId}
          onChange={(e) => setPaId(e.target.value)}
        >
          <option value="">— pilih PA —</option>
          {dosen.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </Select>
      </FormRow>
      <Button type="submit" variant="secondary">
        <Eye className="w-4 h-4 mr-1.5" /> Pratinjau
      </Button>
    </form>
  );
}
