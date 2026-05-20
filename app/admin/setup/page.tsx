"use client";

import { useState } from "react";

type Step = { step: string; ok: boolean; detail?: string };
type Result = { ok: boolean; steps: Step[]; message?: string };

export default function SetupPage() {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onRun(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/setup/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const text = await res.text();
      let data: Result | { message?: string };
      try {
        data = JSON.parse(text) as Result;
      } catch {
        data = { message: text || `HTTP ${res.status}` };
      }
      if (!res.ok && !("steps" in data)) {
        setError(("message" in data && data.message) || `HTTP ${res.status}`);
      } else {
        setResult(data as Result);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Gagal menjalankan setup");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-xl space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Setup Database</h1>
          <p className="text-sm text-slate-600">
            Halaman sekali pakai untuk memperbaiki enum yang missing di DB
            (mis. nilai <code>ADMIN</code> belum ada di enum <code>Role</code>)
            dan memastikan akun administrator tersedia.
          </p>
          <p className="text-sm text-slate-600 mt-1">
            Token = nilai <code>ADMIN_PASSWORD</code> di environment Vercel.
          </p>
        </div>

        <form
          onSubmit={onRun}
          className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 space-y-3"
        >
          <label className="block text-sm font-medium text-slate-700">
            Setup Token
            <input
              type="password"
              autoComplete="off"
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="mt-1 flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-emerald-700 text-white py-2 font-medium hover:bg-emerald-800 disabled:opacity-50"
          >
            {loading ? "Menjalankan..." : "Jalankan Setup"}
          </button>
        </form>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 text-red-800 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {result && (
          <div
            className={`rounded-md border px-4 py-3 text-sm space-y-2 ${
              result.ok
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-amber-200 bg-amber-50 text-amber-900"
            }`}
          >
            <div className="font-semibold">
              Status: {result.ok ? "Berhasil" : "Sebagian / gagal"}
            </div>
            <ul className="space-y-1">
              {result.steps?.map((s, i) => (
                <li key={i} className="font-mono text-xs">
                  <span
                    className={s.ok ? "text-emerald-700" : "text-red-700"}
                  >
                    {s.ok ? "OK" : "FAIL"}
                  </span>{" "}
                  {s.step}
                  {s.detail && (
                    <span className="text-slate-600"> — {s.detail}</span>
                  )}
                </li>
              ))}
            </ul>
            {result.ok && (
              <p className="pt-2">
                Selesai. Sekarang coba login di{" "}
                <a className="underline" href="/admin/login">
                  /admin/login
                </a>
                .
              </p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
