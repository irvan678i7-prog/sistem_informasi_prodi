"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Textarea, FormRow } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

export function RevisiForm({ tesisId }: { tesisId: string }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!file) {
      setErr("Pilih berkas revisi");
      return;
    }
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("tesisId", tesisId);
      form.append("note", note);
      form.append("file", file);
      const res = await fetch("/api/tesis/revisi", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.message || "Gagal");
        setSubmitting(false);
        return;
      }
      router.refresh();
      setNote("");
      setFile(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Gagal";
      setErr(msg);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {err && <Alert variant="error">{err}</Alert>}
      <FormRow label="Berkas Revisi (PDF)" htmlFor="f" required>
        <Input
          id="f"
          type="file"
          accept=".pdf,application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
      </FormRow>
      <FormRow label="Catatan (opsional)" htmlFor="n">
        <Textarea
          id="n"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </FormRow>
      <Button type="submit" disabled={submitting}>
        {submitting ? "Mengunggah..." : "Unggah"}
      </Button>
    </form>
  );
}
