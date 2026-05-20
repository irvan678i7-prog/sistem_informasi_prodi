"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { LetterType } from "@prisma/client";
import {
  Input,
  Textarea,
  Select,
  FormRow,
} from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { LetterDocument } from "@/components/letter/LetterDocument";
import type { LetterField } from "@/lib/letterTemplates";
import { Eye, Send, ArrowLeft } from "lucide-react";

type Mode = "edit" | "preview";

export function LetterDraftForm({
  type,
  fields,
  mahasiswa,
}: {
  type: LetterType;
  fields: LetterField[];
  mahasiswa: {
    name: string;
    nimNip: string;
    prodi: string | null;
    jenjang: string | null;
    semester: number | null;
    angkatan: number | null;
  };
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("edit");
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function set(k: string, v: string) {
    setValues((prev) => ({ ...prev, [k]: v }));
  }

  function validate(): string | null {
    for (const f of fields) {
      if (f.required && !values[f.name]?.toString().trim()) {
        return `Field "${f.label}" wajib diisi.`;
      }
    }
    return null;
  }

  function onPreview(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const e2 = validate();
    if (e2) {
      setErr(e2);
      return;
    }
    setMode("preview");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onSubmit() {
    setErr(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/surat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, payload: values }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.message || "Gagal mengajukan surat");
        setSubmitting(false);
        return;
      }
      router.push(`/surat/${data.id}`);
      router.refresh();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Gagal mengajukan surat";
      setErr(msg);
      setSubmitting(false);
    }
  }

  if (mode === "preview") {
    return (
      <div className="space-y-4">
        <Alert variant="warning" title="Pratinjau Surat">
          Periksa kembali isian Anda. Setelah dikirim, surat akan masuk antrian
          Kaprodi untuk diverifikasi dan disahkan.
        </Alert>
        <LetterDocument
          type={type}
          payload={values}
          mahasiswa={mahasiswa}
          isDraft
        />
        {err && <Alert variant="error">{err}</Alert>}
        <div className="flex flex-wrap gap-2 no-print">
          <Button variant="secondary" onClick={() => setMode("edit")}>
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Kembali Edit
          </Button>
          <Button onClick={onSubmit} disabled={submitting}>
            <Send className="w-4 h-4 mr-1.5" />
            {submitting ? "Mengirim..." : "Kirim ke Kaprodi"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onPreview} className="space-y-4">
      {err && <Alert variant="error">{err}</Alert>}
      <div className="grid sm:grid-cols-2 gap-4">
        {fields.map((f) => (
          <FormRow
            key={f.name}
            label={f.label}
            htmlFor={f.name}
            required={f.required}
            hint={f.hint}
          >
            {f.type === "textarea" ? (
              <Textarea
                id={f.name}
                name={f.name}
                placeholder={f.placeholder}
                value={values[f.name] || ""}
                onChange={(e) => set(f.name, e.target.value)}
                required={f.required}
              />
            ) : f.type === "select" ? (
              <Select
                id={f.name}
                name={f.name}
                value={values[f.name] || ""}
                onChange={(e) => set(f.name, e.target.value)}
                required={f.required}
              >
                <option value="">— pilih —</option>
                {f.options?.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            ) : (
              <Input
                id={f.name}
                name={f.name}
                type={f.type}
                placeholder={f.placeholder}
                value={values[f.name] || ""}
                onChange={(e) => set(f.name, e.target.value)}
                required={f.required}
              />
            )}
          </FormRow>
        ))}
      </div>
      <div className="pt-2 flex gap-2">
        <Button type="submit" variant="secondary">
          <Eye className="w-4 h-4 mr-1.5" /> Pratinjau
        </Button>
      </div>
    </form>
  );
}
