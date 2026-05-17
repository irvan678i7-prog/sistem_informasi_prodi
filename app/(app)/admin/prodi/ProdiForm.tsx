"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Select, FormRow } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

type ProdiInit = {
  id: string;
  code: string;
  name: string;
  jenjang: string;
  kaprodiId: string;
};

export function ProdiForm({
  mode,
  initial,
  dosen,
  onDone,
}: {
  mode: "create" | "edit";
  initial: ProdiInit;
  dosen: { id: string; name: string }[];
  onDone?: () => void;
}) {
  const router = useRouter();
  const [code, setCode] = useState(initial.code);
  const [name, setName] = useState(initial.name);
  const [jenjang, setJenjang] = useState(initial.jenjang);
  const [kaprodiId, setKaprodiId] = useState(initial.kaprodiId);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!code || !name) {
      setErr("Kode & nama wajib.");
      return;
    }
    setLoading(true);
    const url =
      mode === "create" ? "/api/admin/prodi" : `/api/admin/prodi/${initial.id}`;
    const method = mode === "create" ? "POST" : "PATCH";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        name,
        jenjang,
        kaprodiId: kaprodiId || null,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setErr(data.message || "Gagal");
      return;
    }
    if (mode === "create") {
      setCode("");
      setName("");
      setJenjang("S2");
      setKaprodiId("");
    }
    onDone?.();
    router.refresh();
  }

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      {err && <Alert variant="error">{err}</Alert>}
      <div className="grid sm:grid-cols-2 gap-3">
        <FormRow label="Kode" htmlFor="code" required>
          <Input
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="MTI / MMP / MMA ..."
          />
        </FormRow>
        <FormRow label="Nama Prodi" htmlFor="name" required>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </FormRow>
        <FormRow label="Jenjang" htmlFor="j">
          <Select
            id="j"
            value={jenjang}
            onChange={(e) => setJenjang(e.target.value)}
          >
            <option value="S1">S1</option>
            <option value="S2">S2</option>
            <option value="S3">S3</option>
          </Select>
        </FormRow>
        <FormRow label="Kaprodi" htmlFor="kp">
          <Select
            id="kp"
            value={kaprodiId}
            onChange={(e) => setKaprodiId(e.target.value)}
          >
            <option value="">- belum ditetapkan -</option>
            {dosen.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
        </FormRow>
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "..." : mode === "create" ? "Tambah Prodi" : "Simpan"}
      </Button>
    </form>
  );
}
