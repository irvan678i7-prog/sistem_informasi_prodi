"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, FormRow } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { QrCode } from "lucide-react";

export default function VerifyIndexPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const c = code.trim().toUpperCase();
    if (!c) {
      setErr("Masukkan kode verifikasi");
      return;
    }
    router.push(`/verify/${c}`);
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900"
          >
            ← Kembali
          </Link>
        </div>
        <div className="card">
          <div className="card-body space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-700 grid place-items-center">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">Verifikasi Dokumen</h1>
                <p className="text-sm text-slate-500">
                  Masukkan kode verifikasi yang tertera pada QR.
                </p>
              </div>
            </div>
            <form onSubmit={submit} className="space-y-3">
              {err && <Alert variant="error">{err}</Alert>}
              <FormRow label="Kode Verifikasi" htmlFor="code" required>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Mis. A1B2C3D4E5F6"
                  className="font-mono uppercase"
                />
              </FormRow>
              <Button type="submit" className="w-full">
                Verifikasi
              </Button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
