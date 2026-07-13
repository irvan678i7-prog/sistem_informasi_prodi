"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Select, FormRow, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { ROLE_LABEL } from "@/lib/rbac";
import type { Role } from "@prisma/client";

const ROLE_OPTIONS: Role[] = ["MAHASISWA", "DOSEN", "KAPRODI", "ADMIN"];

type EditableUser = {
  id: string;
  name: string;
  email: string;
  nimNip: string;
  role: Role;
  prodiId: string | null;
  phone: string | null;
  address: string | null;
  angkatan: number | null;
  nidn: string | null;
  isActive: boolean;
};

export function EditUserForm({
  user,
  prodi,
  isSelf,
}: {
  user: EditableUser;
  prodi: { id: string; name: string }[];
  isSelf: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [nimNip, setNimNip] = useState(user.nimNip);
  const [role, setRole] = useState<Role>(user.role);
  const [prodiId, setProdiId] = useState(user.prodiId ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [address, setAddress] = useState(user.address ?? "");
  const [angkatan, setAngkatan] = useState(
    user.angkatan != null ? String(user.angkatan) : "",
  );
  const [nidn, setNidn] = useState(user.nidn ?? "");
  const [isActive, setIsActive] = useState(user.isActive);
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  const isMahasiswa = role === "MAHASISWA";
  const isDosen = role === "DOSEN" || role === "KAPRODI";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(false);
    if (!name || !email || !nimNip) {
      setErr("Nama, Email, dan NIM/NIDN wajib diisi.");
      return;
    }
    if (password && password.length < 6) {
      setErr("Password baru minimal 6 karakter.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          nimNip,
          role,
          prodiId: prodiId || null,
          phone: phone || null,
          address: address || null,
          angkatan: angkatan ? Number(angkatan) : null,
          nidn: nidn || null,
          isActive,
          ...(password ? { password } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.message || "Gagal menyimpan.");
        setLoading(false);
        return;
      }
      setOk(true);
      setPassword("");
      setLoading(false);
      router.refresh();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Gagal menyimpan.";
      setErr(msg);
      setLoading(false);
    }
  }

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      {err && <Alert variant="error">{err}</Alert>}
      {ok && <Alert variant="success">Perubahan berhasil disimpan.</Alert>}

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
            disabled={isSelf}
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
          >
            <option value="">- tanpa prodi -</option>
            {prodi.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </FormRow>
        <FormRow label="Status akun" htmlFor="active">
          <Select
            id="active"
            value={isActive ? "1" : "0"}
            onChange={(e) => setIsActive(e.target.value === "1")}
            disabled={isSelf}
          >
            <option value="1">Aktif</option>
            <option value="0">Nonaktif</option>
          </Select>
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
        <FormRow label="Password baru (opsional)" htmlFor="pw">
          <Input
            id="pw"
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Kosongkan jika tidak diubah"
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
          {loading ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </div>
    </form>
  );
}
