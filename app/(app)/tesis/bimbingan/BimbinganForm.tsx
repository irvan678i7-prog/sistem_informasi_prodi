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

export function BimbinganForm({
  tesisId,
  dosenList,
  mahasiswa,
}: {
  tesisId: string;
  dosenList: { id: string; name: string }[];
  mahasiswa: { name: string; nimNip: string };
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [tanggal, setTanggal] = useState("");
  const [dosenId, setDosenId] = useState("");
  const [topik, setTopik] = useState("");
  const [catatan, setCatatan] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function validate() {
    if (!tanggal) return "Tanggal wajib";
    if (!dosenId) return "Pilih dosen";
    if (!topik.trim()) return "Topik wajib";
    return null;
  }
  function onPreview(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const v = validate();
    if (v) return setErr(v);
    setMode("preview");
  }
  async function onSubmit() {
    setErr(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/tesis/bimbingan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tesisId, tanggal, dosenId, topik, catatan }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.message || "Gagal");
        setSubmitting(false);
        return;
      }
      router.refresh();
      setMode("edit");
      setTanggal("");
      setDosenId("");
      setTopik("");
      setCatatan("");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Gagal";
      setErr(msg);
      setSubmitting(false);
    }
  }

  const dosenName = dosenList.find((d) => d.id === dosenId)?.name || "-";

  if (mode === "preview") {
    return (
      <div className="space-y-4">
        <Alert variant="warning" title="Pratinjau Catatan Bimbingan">
          Periksa kembali, lalu kirim untuk diparaf dosen.
        </Alert>
        <div className="print-page shadow-sm border border-slate-200">
          <header className="text-center border-b border-slate-800 pb-2 mb-4">
            <h3 className="text-base font-bold uppercase">
              Kartu Bimbingan Tesis
            </h3>
            <p className="text-[11px]">
              Program Pascasarjana · Universitas Muhammadiyah Metro
            </p>
          </header>
          <div className="meta-line"><div>Nama</div><div>:</div><div>{mahasiswa.name}</div></div>
          <div className="meta-line"><div>NIM</div><div>:</div><div>{mahasiswa.nimNip}</div></div>
          <table className="simple mt-3">
            <thead>
              <tr><th>Tanggal</th><th>Dosen</th><th>Topik</th><th>Catatan</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>{tanggal ? formatDate(tanggal) : "-"}</td>
                <td>{dosenName}</td>
                <td>{topik}</td>
                <td>{catatan || "-"}</td>
              </tr>
            </tbody>
          </table>
        </div>
        {err && <Alert variant="error">{err}</Alert>}
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setMode("edit")}>
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Edit
          </Button>
          <Button onClick={onSubmit} disabled={submitting}>
            <Send className="w-4 h-4 mr-1.5" />
            {submitting ? "Mengirim..." : "Kirim untuk Diparaf"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onPreview} className="space-y-4">
      {err && <Alert variant="error">{err}</Alert>}
      <div className="grid sm:grid-cols-2 gap-4">
        <FormRow label="Tanggal Bimbingan" htmlFor="t" required>
          <Input
            id="t"
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
          />
        </FormRow>
        <FormRow label="Dosen Pembimbing" htmlFor="d" required>
          <Select
            id="d"
            value={dosenId}
            onChange={(e) => setDosenId(e.target.value)}
          >
            <option value="">— pilih —</option>
            {dosenList.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
        </FormRow>
      </div>
      <FormRow label="Topik / Materi Bimbingan" htmlFor="tp" required>
        <Input
          id="tp"
          value={topik}
          onChange={(e) => setTopik(e.target.value)}
          placeholder="Mis. Revisi Bab III - metodologi"
        />
      </FormRow>
      <FormRow label="Catatan (opsional)" htmlFor="cn">
        <Textarea
          id="cn"
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
        />
      </FormRow>
      <Button type="submit" variant="secondary">
        <Eye className="w-4 h-4 mr-1.5" /> Pratinjau
      </Button>
    </form>
  );
}
