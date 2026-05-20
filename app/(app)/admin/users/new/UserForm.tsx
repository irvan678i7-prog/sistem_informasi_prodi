"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Select, FormRow, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { ROLE_LABEL } from "@/lib/rbac";
import type { Role } from "@prisma/client";

const ROLE_OPTIONS: Role[] = [
  "MAHASISWA",
  "DOSEN",
  "KAPRODI",
  "ADMIN",
];

export function UserForm({
  prodi,
  adminProdiId,
}: {
  prodi: { id: string; name: string }[];
  adminProdiId: string | null;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [nimNip, setNimNip] = useState("");
  const [role, setRole] = useState<Role>("MAHASISWA");
  const [prodiId, setProdiId] = useState(adminProdiId ?? "");
  const [password, setPassword] = useState("");
  const [angkatan, setAngkatan] = useState<string>("");
  const [nidn, setNidn] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isMahasiswa = role === "MAHASISWA";
  const isDosen = role === "DOSEN" || role === "KAPRODI";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!name || !email || !nimNip || !password) {
      setErr("Nama, Email, NIM/NIDN, dan Password wajib diisi.");
      return;
    }
    if (password.length < 6) {
      setErr("Password minimal 6 karakter.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          nimNip,
          role,
          prodiId: prodiId || null,
          password,
          phone: phone || null,
          address: address || null,
          angkatan: angkatan ? Number(angkatan) : null,
          nidn: nidn || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.message || "Gagal");
        setLoading(false);
        return;
      }
      router.push("/admin/users");
      router.refresh();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Gagal";
      setErr(msg);
      setLoading(false);
    }
  }

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      {err && <Alert variant="error">{err}</Alert>}
      <div className="grid sm:grid-cols-2 gap-3">
        <FormRow label="Nama lengkap" htmlFor="name" required>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </FormRow>
        <FormRow label="Email" htmlFor="email" required>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </FormRow>
        <FormRow label="NIM / NIDN" htmlFor="nim" required>
          <Input
            id="nim"
            value={nimNip}
            onChange={(e) => setNimNip(e.target.value)}
            required
          />
        </FormRow>
        <FormRow label="Peran" htmlFor="role" required>
          <Select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </Select>
        </FormRow>
        <FormRow label="Prodi" htmlFor="prodi">
          <Select
            id="prodi"
            value={prodiId}
            onChange={(e) => setProdiId(e.target.value)}
            disabled={!!adminProdiId}
          >
            <option value="">- tanpa prodi -</option>
            {prodi.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </FormRow>
        <FormRow label="Password awal" htmlFor="pw" required>
          <Input
            id="pw"
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 6 karakter"
            required
          />
        </FormRow>
        {isMahasiswa && (
          <FormRow label="Angkatan" htmlFor="ang">
            <Input
              id="ang"
              type="number"
              value={angkatan}
              onChange={(e) => setAngkatan(e.target.value)}
              placeholder="contoh 2024"
            />
          </FormRow>
        )}
        {isDosen && (
          <FormRow label="NIDN" htmlFor="nidn">
            <Input
              id="nidn"
              value={nidn}
              onChange={(e) => setNidn(e.target.value)}
            />
          </FormRow>
        )}
        <FormRow label="Telepon" htmlFor="phone">
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </FormRow>
      </div>
      <FormRow label="Alamat" htmlFor="addr">
        <Textarea
          id="addr"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </FormRow>
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Menyimpan..." : "Simpan"}
        </Button>
      </div>
    </form>
  );
}
