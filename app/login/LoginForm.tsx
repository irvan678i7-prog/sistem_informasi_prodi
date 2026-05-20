"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, PasswordInput, FormRow } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";

export function LoginForm({ scope }: { scope: "user" | "admin" }) {
  const router = useRouter();
  const params = useSearchParams();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password, scope }),
      });

      // Parse body dengan aman: kalau bukan JSON / kosong, jangan crash.
      const raw = await res.text();
      let data: { message?: string; ok?: boolean } = {};
      if (raw) {
        try {
          data = JSON.parse(raw);
        } catch {
          data = {};
        }
      }

      if (!res.ok) {
        // Pesan spesifik berdasarkan status, fallback ke pesan dari server.
        let msg = data.message;
        if (!msg) {
          if (res.status === 401) {
            msg = "Email/NIM/NIDN atau password salah";
          } else if (res.status === 403) {
            msg =
              scope === "admin"
                ? "Akun ini bukan administrator"
                : "Akses ditolak";
          } else if (res.status === 400) {
            msg = "Data login tidak lengkap";
          } else if (res.status >= 500) {
            msg = "Server sedang bermasalah, coba lagi sebentar lagi";
          } else {
            msg = "Gagal login";
          }
        }
        setErr(msg);
        setLoading(false);
        return;
      }

      const next = params?.get("next");
      router.push(next && next.startsWith("/") ? next : "/dashboard");
      router.refresh();
    } catch (e: unknown) {
      // Network error / fetch gagal total.
      const msg =
        e instanceof Error && e.message
          ? `Gagal terhubung ke server: ${e.message}`
          : "Gagal terhubung ke server";
      setErr(msg);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {err && <Alert variant="error">{err}</Alert>}
      <FormRow
        label={scope === "admin" ? "Email Admin" : "NIM / NIDN / Email"}
        htmlFor="identifier"
        required
      >
        <Input
          id="identifier"
          name="identifier"
          autoComplete="username"
          required
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
        />
      </FormRow>
      <FormRow label="Password" htmlFor="password" required>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </FormRow>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Memproses..." : "Masuk"}
      </Button>
    </form>
  );
}
