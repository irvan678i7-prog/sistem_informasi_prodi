"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, FormRow } from "@/components/ui/input";
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
      const data = await res.json();
      if (!res.ok) {
        setErr(data.message || "Gagal login");
        setLoading(false);
        return;
      }
      const next = params?.get("next");
      router.push(next && next.startsWith("/") ? next : "/dashboard");
      router.refresh();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Gagal login";
      setErr(msg);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {err && <Alert variant="error">{err}</Alert>}
      <FormRow
        label={scope === "admin" ? "Email Admin" : "NIM / NIP / Email"}
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
        <Input
          id="password"
          name="password"
          type="password"
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
