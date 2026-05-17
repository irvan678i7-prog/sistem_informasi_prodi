"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, FormRow } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

export function MasterForm({ initial }: { initial: Record<string, string> }) {
  const router = useRouter();
  const [v, setV] = useState<Record<string, string>>(initial);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

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

  return (
    <div className="space-y-3">
      {err && <Alert variant="error">{err}</Alert>}
      {ok && <Alert variant="success">Tersimpan.</Alert>}
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
      <hr />
      <div className="grid sm:grid-cols-2 gap-3">
        <FormRow label="Direktur (Nama)" htmlFor="d1">
          <Input
            id="d1"
            value={v["ttd.direktur.name"] ?? ""}
            onChange={(e) => set("ttd.direktur.name", e.target.value)}
          />
        </FormRow>
        <FormRow label="Direktur (NIDN)" htmlFor="d2">
          <Input
            id="d2"
            value={v["ttd.direktur.nidn"] ?? ""}
            onChange={(e) => set("ttd.direktur.nidn", e.target.value)}
          />
        </FormRow>
        <FormRow label="Wadir (Nama)" htmlFor="w1">
          <Input
            id="w1"
            value={v["ttd.wadir.name"] ?? ""}
            onChange={(e) => set("ttd.wadir.name", e.target.value)}
          />
        </FormRow>
        <FormRow label="Wadir (NIDN)" htmlFor="w2">
          <Input
            id="w2"
            value={v["ttd.wadir.nidn"] ?? ""}
            onChange={(e) => set("ttd.wadir.nidn", e.target.value)}
          />
        </FormRow>
      </div>
      <Button onClick={save} disabled={saving}>
        {saving ? "Menyimpan..." : "Simpan"}
      </Button>
    </div>
  );
}
