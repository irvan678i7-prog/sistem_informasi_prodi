"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Textarea, FormRow } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { ArrowLeft, Eye, Send } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { KUT_CHECKLIST_ITEMS } from "@/lib/kutChecklist";
import { KutChecklistTable } from "@/components/KutChecklistTable";

export function KutForm({
  tesisId,
  mahasiswa,
}: {
  tesisId: string;
  mahasiswa: {
    name: string;
    nimNip: string;
    prodi: string | null;
    judul: string;
    pembimbing1: string;
    pembimbing2: string;
  };
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [persen, setPersen] = useState("");
  const [alatUji, setAlatUji] = useState("");
  const [tglUji, setTglUji] = useState("");
  const [note, setNote] = useState("");
  const [checklist, setChecklist] = useState<boolean[]>(
    KUT_CHECKLIST_ITEMS.map(() => false),
  );
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function validate() {
    if (persen && (Number(persen) < 0 || Number(persen) > 100))
      return "Persentase 0-100";
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
      const res = await fetch("/api/tesis/kut", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tesisId,
          plagiasiPersen: persen ? Number(persen) : null,
          alatUji,
          tglUji,
          note,
          checklist,
        }),
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
        <Alert variant="warning" title="Pratinjau Form KUT">
          Periksa kembali, lalu kirim ke pembimbing & Kaprodi.
        </Alert>
        <div className="print-page shadow-sm border border-slate-200">
          <header className="text-center border-b border-slate-800 pb-2 mb-4">
            <h3 className="text-base font-bold uppercase">
              Formulir Kelayakan Ujian Tesis (KUT)
            </h3>
            <p className="text-[11px]">
              Program Pascasarjana · Universitas Muhammadiyah Metro
            </p>
          </header>
          <div className="meta-line"><div>Nama</div><div>:</div><div>{mahasiswa.name}</div></div>
          <div className="meta-line"><div>NIM</div><div>:</div><div>{mahasiswa.nimNip}</div></div>
          <div className="meta-line"><div>Program Studi</div><div>:</div><div>{mahasiswa.prodi || "-"}</div></div>
          <div className="meta-line"><div>Judul</div><div>:</div><div>{mahasiswa.judul || "-"}</div></div>
          <div className="meta-line"><div>Pembimbing 1</div><div>:</div><div>{mahasiswa.pembimbing1}</div></div>
          <div className="meta-line"><div>Pembimbing 2</div><div>:</div><div>{mahasiswa.pembimbing2}</div></div>
          <div className="meta-line"><div>Plagiasi</div><div>:</div><div>{persen ? `${persen}%` : "-"}</div></div>
          <div className="meta-line"><div>Alat Uji</div><div>:</div><div>{alatUji || "-"}</div></div>
          <div className="meta-line"><div>Tanggal Uji</div><div>:</div><div>{tglUji ? formatDate(tglUji) : "-"}</div></div>
          {note && <div className="meta-line"><div>Catatan</div><div>:</div><div>{note}</div></div>}

          <div className="mt-4">
            <KutChecklistTable checklist={checklist} />
          </div>

          <div className="ttd">
            <div className="col">
              <p>Pembimbing 1,</p>
              <p style={{ marginTop: 50 }} className="font-semibold underline">{mahasiswa.pembimbing1}</p>
            </div>
            <div className="col">
              <p>Pembimbing 2,</p>
              <p style={{ marginTop: 50 }} className="font-semibold underline">{mahasiswa.pembimbing2}</p>
            </div>
          </div>
          <div className="ttd">
            <div className="col" />
            <div className="col">
              <p>Mengetahui, Kaprodi</p>
              <p style={{ marginTop: 50 }} className="font-semibold underline">(__________)</p>
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
            {submitting ? "Mengirim..." : "Kirim KUT"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onPreview} className="space-y-4">
      {err && <Alert variant="error">{err}</Alert>}
      <div className="grid sm:grid-cols-2 gap-4">
        <FormRow label="Persentase Plagiasi (%)" htmlFor="p">
          <Input
            id="p"
            type="number"
            value={persen}
            onChange={(e) => setPersen(e.target.value)}
            min={0}
            max={100}
          />
        </FormRow>
        <FormRow label="Alat Uji" htmlFor="a">
          <Input
            id="a"
            value={alatUji}
            onChange={(e) => setAlatUji(e.target.value)}
            placeholder="Mis. Turnitin"
          />
        </FormRow>
        <FormRow label="Tanggal Uji Plagiasi" htmlFor="t">
          <Input
            id="t"
            type="date"
            value={tglUji}
            onChange={(e) => setTglUji(e.target.value)}
          />
        </FormRow>
      </div>
      <FormRow label="Catatan (opsional)" htmlFor="n">
        <Textarea
          id="n"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </FormRow>
      <fieldset className="rounded-lg border border-slate-200 p-4">
        <legend className="text-sm font-semibold px-1">
          Check List Berkas Syarat Ujian Tesis
        </legend>
        <p className="text-xs text-slate-500 mb-3">
          Centang berkas yang sudah Anda siapkan (ADA). Yang tidak dicentang
          akan ditandai TIDAK ADA pada formulir.
        </p>
        <ul className="space-y-2">
          {KUT_CHECKLIST_ITEMS.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <input
                id={`cl-${i}`}
                type="checkbox"
                className="mt-0.5 h-4 w-4 shrink-0 accent-brand-600"
                checked={checklist[i]}
                onChange={(e) =>
                  setChecklist((prev) =>
                    prev.map((v, idx) => (idx === i ? e.target.checked : v)),
                  )
                }
              />
              <label htmlFor={`cl-${i}`} className="text-sm leading-snug">
                {i + 1}. {item}
              </label>
            </li>
          ))}
        </ul>
      </fieldset>
      <Button type="submit" variant="secondary">
        <Eye className="w-4 h-4 mr-1.5" /> Pratinjau
      </Button>
    </form>
  );
}
