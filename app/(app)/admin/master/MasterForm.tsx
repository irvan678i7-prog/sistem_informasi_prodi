"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Input, FormRow } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { UploadCloud, Trash2 } from "lucide-react";

export function MasterForm({
  initial,
  dosen,
  dosenSignatures,
}: {
  initial: Record<string, string>;
  dosen: { id: string; name: string; nimNip: string }[];
  dosenSignatures: Record<string, string>;
}) {
  const router = useRouter();
  const [v, setV] = useState<Record<string, string>>(initial);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingDosen, setUploadingDosen] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const logoRef = useRef<HTMLInputElement | null>(null);

  async function save() {
    setErr(null);
    setOk(false);
    setSaving(true);
    const res = await fetch("/api/admin/master", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(v),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({ message: "Gagal" }));
      setErr(d.message || "Gagal");
      return;
    }
    setOk(true);
    router.refresh();
  }

  function set(key: string, val: string) {
    setV((prev) => ({ ...prev, [key]: val }));
  }

  async function onUploadDosenTtd(dosenId: string, file: File) {
    setErr(null); setOk(false); setUploadingDosen(dosenId);
    try {
      const fd = new FormData(); fd.append("file", file); fd.append("key", `ttd.dosen.${dosenId}.image`);
      const res = await fetch("/api/admin/ttd", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setErr(data.message || "Gagal unggah TTD dosen"); return; }
      set(`ttd.dosen.${dosenId}.image`, data.url); setOk(true);
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : "Gagal unggah TTD dosen"); }
    finally { setUploadingDosen(null); }
  }

  async function onUploadTtd(file: File) {
    setErr(null);
    setOk(false);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("key", "ttd.kaprodi.image");
      const res = await fetch("/api/admin/ttd", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.message || "Gagal unggah TTD");
        return;
      }
      set("ttd.kaprodi.image", data.url);
      setOk(true);
      router.refresh();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Gagal unggah TTD");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function clearTtd() {
    set("ttd.kaprodi.image", "");
  }

  async function onUploadLogo(file: File) {
    setErr(null);
    setOk(false);
    setUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("key", "institusi.logo");
      const res = await fetch("/api/admin/ttd", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.message || "Gagal unggah logo");
        return;
      }
      set("institusi.logo", data.url);
      setOk(true);
      router.refresh();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Gagal unggah logo");
    } finally {
      setUploadingLogo(false);
      if (logoRef.current) logoRef.current.value = "";
    }
  }

  function clearLogo() {
    set("institusi.logo", "");
  }

  const ttdUrl = v["ttd.kaprodi.image"] || "";
  const logoUrl = v["institusi.logo"] || "";

  return (
    <div className="space-y-4">
      {err && <Alert variant="error">{err}</Alert>}
      {ok && <Alert variant="success">Tersimpan.</Alert>}

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700">
          Identitas Institusi
        </h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <FormRow label="Nama Pascasarjana" htmlFor="np">
            <Input
              id="np"
              value={v["institusi.namaPascasarjana"] ?? ""}
              onChange={(e) =>
                set("institusi.namaPascasarjana", e.target.value)
              }
            />
          </FormRow>
          <FormRow label="Telepon" htmlFor="tlp">
            <Input
              id="tlp"
              value={v["institusi.telp"] ?? ""}
              onChange={(e) => set("institusi.telp", e.target.value)}
            />
          </FormRow>
          <FormRow label="Email" htmlFor="em">
            <Input
              id="em"
              value={v["institusi.email"] ?? ""}
              onChange={(e) => set("institusi.email", e.target.value)}
            />
          </FormRow>
          <FormRow label="Website" htmlFor="ws">
            <Input
              id="ws"
              value={v["institusi.website"] ?? ""}
              onChange={(e) => set("institusi.website", e.target.value)}
            />
          </FormRow>
          <FormRow label="Alamat" htmlFor="al">
            <Input
              id="al"
              value={v["institusi.alamat"] ?? ""}
              onChange={(e) => set("institusi.alamat", e.target.value)}
            />
          </FormRow>
        </div>

        <FormRow
          label="Logo Kop Surat"
          htmlFor="logo"
          hint="PNG/JPG/WEBP/SVG transparan, maks 2 MB. Tampil di kop semua surat resmi."
        >
          <div className="flex items-start gap-4">
            <div className="w-32 h-24 rounded-md border border-dashed border-slate-300 bg-slate-50 grid place-items-center overflow-hidden">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt="Pratinjau logo"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <span className="text-xs text-slate-400">
                  Pakai logo bawaan
                </span>
              )}
            </div>
            <div className="space-y-2">
              <input
                ref={logoRef}
                id="logo"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onUploadLogo(f);
                }}
              />
              <Button
                type="button"
                variant="secondary"
                disabled={uploadingLogo}
                onClick={() => logoRef.current?.click()}
              >
                <UploadCloud className="w-4 h-4 mr-1.5" />
                {uploadingLogo ? "Mengunggah..." : "Unggah Logo"}
              </Button>
              {logoUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={clearLogo}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-1.5" /> Hapus
                </Button>
              )}
            </div>
          </div>
        </FormRow>
      </section>

      <hr />

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700">
          Pejabat Penandatangan (Kaprodi)
        </h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <FormRow label="Nama Kaprodi" htmlFor="k1">
            <Input
              id="k1"
              value={v["ttd.kaprodi.name"] ?? ""}
              onChange={(e) => set("ttd.kaprodi.name", e.target.value)}
            />
          </FormRow>
          <FormRow label="NIDN Kaprodi" htmlFor="k2">
            <Input
              id="k2"
              value={v["ttd.kaprodi.nidn"] ?? ""}
              onChange={(e) => set("ttd.kaprodi.nidn", e.target.value)}
            />
          </FormRow>
        </div>

        <FormRow
          label="Tanda Tangan (Gambar)"
          htmlFor="ttd"
          hint="PNG/JPG/WEBP/SVG transparan, maks 2 MB. Akan otomatis muncul di samping QR pada surat yang disahkan."
        >
          <div className="flex items-start gap-4">
            <div className="w-32 h-24 rounded-md border border-dashed border-slate-300 bg-slate-50 grid place-items-center overflow-hidden">
              {ttdUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={ttdUrl}
                  alt="Pratinjau TTD"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <span className="text-xs text-slate-400">Belum ada TTD</span>
              )}
            </div>
            <div className="space-y-2">
              <input
                ref={fileRef}
                id="ttd"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onUploadTtd(f);
                }}
              />
              <Button
                type="button"
                variant="secondary"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                <UploadCloud className="w-4 h-4 mr-1.5" />
                {uploading ? "Mengunggah..." : "Unggah TTD"}
              </Button>
              {ttdUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={clearTtd}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-1.5" /> Hapus
                </Button>
              )}
            </div>
          </div>
        </FormRow>
      </section>

      <hr />
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700">Tanda Tangan Dosen</h3>
        <p className="text-xs text-slate-500">Tanda tangan dosen dipilih otomatis berdasarkan PA yang menyetujui pengajuan judul.</p>
        {dosen.map((d) => {
          const key = `ttd.dosen.${d.id}.image`;
          const url = v[key] || dosenSignatures[d.id] || "";
          return <div key={d.id} className="flex items-center gap-4 border rounded-md p-3">
            <div className="w-24 h-16 border border-dashed rounded grid place-items-center overflow-hidden">{url ? <img src={url} alt={`TTD ${d.name}`} className="max-h-full max-w-full object-contain" /> : <span className="text-xs text-slate-400">Belum ada</span>}</div>
            <div className="flex-1"><p className="text-sm font-medium">{d.name}</p><p className="text-xs text-slate-500">{d.nimNip}</p>
              <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(e) => { const f = e.target.files?.[0]; if (f) onUploadDosenTtd(d.id, f); }} className="mt-2 text-xs" />
              {uploadingDosen === d.id && <p className="text-xs text-slate-500 mt-1">Mengunggah...</p>}
            </div>
          </div>;
        })}
      </section>

      <Button onClick={save} disabled={saving}>
        {saving ? "Menyimpan..." : "Simpan Pengaturan"}
      </Button>
    </div>
  );
}
