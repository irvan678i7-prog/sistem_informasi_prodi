"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Input,
  Select,
  Textarea,
  FormRow,
} from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Eye, Send, ArrowLeft } from "lucide-react";
import { formatDate } from "@/lib/utils";

export function SeminarForm({
  tesisId,
  dosen,
  defaultPembimbing,
  mahasiswa,
}: {
  tesisId: string;
  dosen: { id: string; name: string }[];
  defaultPembimbing: string;
  mahasiswa: { name: string; nimNip: string; prodi: string | null; judul: string };
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [tanggal, setTanggal] = useState("");
  const [ruang, setRuang] = useState("");
  const [pembimbingId, setPembimbingId] = useState(defaultPembimbing);
  const [catatan, setCatatan] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function validate() {
    if (!tanggal) return "Tanggal seminar wajib diisi";
    if (!pembimbingId) return "Pilih Pembimbing Proposal";
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
      const res = await fetch("/api/tesis/seminar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tesisId, jadwal: tanggal, ruang, pembimbingId, catatan }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.message || "Gagal");
        setSubmitting(false);
        return;
      }
      router.push("/tesis");
      router.refresh();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Gagal";
      setErr(msg);
      setSubmitting(false);
    }
  }

  const pembimbingName =
    dosen.find((d) => d.id === pembimbingId)?.name || "-";

  if (mode === "preview") {
    return (
      <div className="space-y-4">
        <Alert variant="warning" title="Pratinjau Pendaftaran Seminar Proposal">
          Periksa kembali isian. Setelah dikirim, akan masuk antrian
          Pembimbing/Kaprodi.
        </Alert>
        <div className="print-page shadow-sm border border-slate-200">
          <header className="text-center border-b border-slate-800 pb-2 mb-4">
            <h3 className="text-base font-bold uppercase">
              Formulir Pendaftaran Seminar Proposal
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
          <div className="meta-line">
            <div>Judul</div><div>:</div><div>{mahasiswa.judul || "-"}</div>
          </div>
          <div className="meta-line">
            <div>Tanggal Seminar</div><div>:</div><div>{tanggal ? formatDate(tanggal) : "-"}</div>
          </div>
          <div className="meta-line">
            <div>Ruang</div><div>:</div><div>{ruang || "(akan ditentukan)"}</div>
          </div>
          <div className="meta-line">
            <div>Pembimbing</div><div>:</div><div>{pembimbingName}</div>
          </div>
          {catatan && (
            <div className="meta-line">
              <div>Catatan</div><div>:</div><div>{catatan}</div>
            </div>
          )}
          <div className="ttd">
            <div className="col">
              <p>Pemohon,</p>
              <p style={{ marginTop: 60 }} className="font-semibold underline">
                {mahasiswa.name}
              </p>
            </div>
            <div className="col">
              <p>Metro, {formatDate(new Date())}</p>
              <p>Menyetujui, Pembimbing Proposal</p>
              <p style={{ marginTop: 60 }} className="font-semibold underline">
                {pembimbingName}
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
            {submitting ? "Mengirim..." : "Kirim"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onPreview} className="space-y-4">
      {err && <Alert variant="error">{err}</Alert>}
      <div className="grid sm:grid-cols-2 gap-4">
        <FormRow label="Tanggal Seminar" htmlFor="tanggal" required>
          <Input
            id="tanggal"
            type="datetime-local"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
          />
        </FormRow>
        <FormRow label="Ruang (opsional)" htmlFor="ruang">
          <Input
            id="ruang"
            value={ruang}
            onChange={(e) => setRuang(e.target.value)}
            placeholder="Mis. R. Seminar PPs"
          />
        </FormRow>
        <FormRow label="Pembimbing Proposal" htmlFor="pembimbing" required>
          <Select
            id="pembimbing"
            value={pembimbingId}
            onChange={(e) => setPembimbingId(e.target.value)}
          >
            <option value="">— pilih dosen —</option>
            {dosen.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
        </FormRow>
        <FormRow label="Catatan (opsional)" htmlFor="catatan">
          <Textarea
            id="catatan"
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
          />
        </FormRow>
      </div>
      <Button type="submit" variant="secondary">
        <Eye className="w-4 h-4 mr-1.5" /> Pratinjau
      </Button>
    </form>
  );
}
