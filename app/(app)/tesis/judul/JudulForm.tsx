"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Textarea, Select, FormRow } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { FormKop } from "@/components/FormKop";
import { JENIS_PENELITIAN } from "@/lib/jenisPenelitian";
import { formatDate } from "@/lib/utils";
import { Eye, Send, ArrowLeft } from "lucide-react";

type JudulEntry = { judul: string; jenis: string };

export function JudulForm({
  dosen,
  initial,
  mahasiswa,
  kaprodiName,
}: {
  dosen: { id: string; name: string }[];
  initial: {
    judul1: string;
    judul2: string;
    judul3: string;
    jenis1: string;
    jenis2: string;
    jenis3: string;
    paId: string;
  };
  mahasiswa: { name: string; nimNip: string; prodi: string | null };
  kaprodiName?: string | null;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [entries, setEntries] = useState<JudulEntry[]>([
    { judul: initial.judul1, jenis: initial.jenis1 },
    { judul: initial.judul2, jenis: initial.jenis2 },
    { judul: initial.judul3, jenis: initial.jenis3 },
  ]);
  const [paId, setPaId] = useState(initial.paId);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function setEntry(i: number, patch: Partial<JudulEntry>) {
    setEntries((prev) =>
      prev.map((e, idx) => (idx === i ? { ...e, ...patch } : e)),
    );
  }

  function validate() {
    for (let i = 0; i < 3; i++) {
      if (!entries[i].judul.trim()) return `Judul ${i + 1} wajib diisi`;
      if (!entries[i].jenis)
        return `Pilih jenis penelitian untuk judul ${i + 1}`;
    }
    if (!paId) return "Pilih Dosen Pembimbing Akademik";
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
        body: JSON.stringify({
          judul1: entries[0].judul,
          judul2: entries[1].judul,
          judul3: entries[2].judul,
          jenis1: entries[0].jenis,
          jenis2: entries[1].jenis,
          jenis3: entries[2].jenis,
          paId,
        }),
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

  const dosenName = dosen.find((d) => d.id === paId)?.name || "";

  if (mode === "preview") {
    return (
      <div className="space-y-4">
        <Alert variant="warning" title="Pratinjau Formulir Pengajuan Judul">
          Periksa kembali isian Anda. Setelah dikirim, formulir masuk antrian
          Dosen Pembimbing Akademik.
        </Alert>
        <div className="print-page shadow-sm border border-slate-200 bg-white text-slate-900 p-6">
          <FormKop />
          <h3 className="text-center text-base font-bold uppercase underline mb-4">
            Formulir Pengajuan Judul
          </h3>
          <div className="text-sm space-y-0.5 mb-3">
            <div className="grid grid-cols-[110px_10px_1fr]">
              <span>Nama</span>
              <span>:</span>
              <span>{mahasiswa.name}</span>
            </div>
            <div className="grid grid-cols-[110px_10px_1fr]">
              <span>NPM</span>
              <span>:</span>
              <span>{mahasiswa.nimNip}</span>
            </div>
            <div className="grid grid-cols-[110px_10px_1fr]">
              <span>Program Studi</span>
              <span>:</span>
              <span>{mahasiswa.prodi || "-"}</span>
            </div>
          </div>
          <table className="w-full border-collapse text-sm mb-3 [&_th]:border [&_th]:border-slate-800 [&_th]:p-1.5 [&_td]:border [&_td]:border-slate-800 [&_td]:p-1.5 [&_td]:align-top">
            <thead>
              <tr className="text-center">
                <th className="w-10">NO</th>
                <th>RENCANA JUDUL TESIS</th>
                <th className="w-40">
                  Jenis Penelitian
                  <span className="block font-normal text-[10px]">
                    (Kuantitatif / Kualitatif / Pengembangan / Studi literatur)
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr key={i}>
                  <td className="text-center">{i + 1}</td>
                  <td>{e.judul}</td>
                  <td className="text-center">{e.jenis}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-xs mb-4">
            <p className="font-semibold">Keterangan:</p>
            <ol className="list-decimal ml-4 space-y-0.5">
              <li>
                Judul yang dipilih akan diparaf oleh Ketua Program Studi.
              </li>
              <li>
                Nama dosen pembimbing ditulis di bawah tanda tangan Ketua
                Program Studi.
              </li>
              <li>
                Dosen Pembimbing Akademik menyetujui bahwa mahasiswa telah
                memenuhi syarat sks untuk mengajukan judul tesis.
              </li>
            </ol>
          </div>
          <div className="grid grid-cols-2 gap-6 text-sm">
            <div className="text-center">
              <p className="mb-16">Menyetujui:</p>
              <p className="font-semibold underline">
                {kaprodiName || ".............................."}
              </p>
              <p>Ketua Program Studi</p>
              <p className="text-xs">NIDN. ..............................</p>
            </div>
            <div className="text-center">
              <p>Metro, {formatDate(new Date())}</p>
              <p className="mb-14">Mahasiswa yang mengajukan,</p>
              <p className="font-semibold underline">{mahasiswa.name}</p>
              <p className="text-xs">NPM. {mahasiswa.nimNip}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6 text-sm mt-8">
            <div className="text-center">
              <p className="mb-16">Mengetahui:</p>
              <p className="font-semibold underline">
                {dosenName || ".............................."}
              </p>
              <p>Dosen Pembimbing Akademik</p>
              <p className="text-xs">NIDN. ..............................</p>
            </div>
            <div className="text-left text-xs pt-4">
              <p className="font-semibold">Catatan:</p>
              <div className="mt-1 border-b border-dotted border-slate-500 h-4" />
              <div className="mt-2 border-b border-dotted border-slate-500 h-4" />
              <div className="mt-2 border-b border-dotted border-slate-500 h-4" />
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
            {submitting ? "Mengirim..." : "Kirim ke Dosen PA"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onPreview} className="space-y-4">
      {err && <Alert variant="error">{err}</Alert>}
      {entries.map((e, i) => (
        <div
          key={i}
          className="space-y-3 rounded-lg border border-slate-200 p-4"
        >
          <FormRow label={`Rencana Judul ${i + 1}`} htmlFor={`judul${i}`} required>
            <Textarea
              id={`judul${i}`}
              value={e.judul}
              onChange={(ev) => setEntry(i, { judul: ev.target.value })}
            />
          </FormRow>
          <FormRow
            label="Jenis Penelitian"
            htmlFor={`jenis${i}`}
            required
          >
            <Select
              id={`jenis${i}`}
              value={e.jenis}
              onChange={(ev) => setEntry(i, { jenis: ev.target.value })}
            >
              <option value="">— pilih jenis —</option>
              {JENIS_PENELITIAN.map((j) => (
                <option key={j} value={j}>
                  {j}
                </option>
              ))}
            </Select>
          </FormRow>
        </div>
      ))}
      <FormRow label="Dosen Pembimbing Akademik" htmlFor="paId" required>
        <Select id="paId" value={paId} onChange={(e) => setPaId(e.target.value)}>
          <option value="">— pilih Dosen PA —</option>
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
