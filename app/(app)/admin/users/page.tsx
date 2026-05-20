import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ROLE_LABEL } from "@/lib/rbac";
import { UserActions } from "./UserActions";
import { formatDateTime } from "@/lib/utils";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.role !== "ADMIN") redirect("/dashboard");

  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const roleFilter = sp.role?.trim() ?? "";

  const where: {
    OR?: Array<{ name?: { contains: string; mode: "insensitive" }; email?: { contains: string; mode: "insensitive" }; nimNip?: { contains: string; mode: "insensitive" } }>;
    role?: "ADMIN" | "KAPRODI" | "DOSEN" | "MAHASISWA";
    prodiId?: string;
  } = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { nimNip: { contains: q, mode: "insensitive" } },
    ];
  }
  const ROLE_OPTIONS = ["ADMIN", "KAPRODI", "DOSEN", "MAHASISWA"] as const;
  if (roleFilter && (ROLE_OPTIONS as readonly string[]).includes(roleFilter)) {
    where.role = roleFilter as (typeof ROLE_OPTIONS)[number];
  }

  const users = await prisma.user.findMany({
    where,
    include: { prodi: true },
    orderBy: [{ role: "asc" }, { name: "asc" }],
    take: 200,
  });

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kelola User</h1>
          <p className="text-sm text-slate-500">
            Akun mahasiswa, dosen, kaprodi, dan administrator.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/users/bulk" className="btn-secondary">
            Bulk Upload Mahasiswa
          </Link>
          <Link href="/admin/users/new" className="btn-primary">
            + Tambah User
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cari & filter</CardTitle>
          <CardDescription>
            Gunakan kata kunci atau filter berdasarkan peran.
          </CardDescription>
        </CardHeader>
        <CardBody>
          <form className="flex flex-wrap gap-2 items-end" action="">
            <div>
              <label className="label" htmlFor="q">
                Kata kunci
              </label>
              <input
                id="q"
                name="q"
                defaultValue={q}
                className="field"
                placeholder="Nama / NIM-NIP / Email"
              />
            </div>
            <div>
              <label className="label" htmlFor="role">
                Peran
              </label>
              <select
                id="role"
                name="role"
                defaultValue={roleFilter}
                className="field bg-white"
              >
                <option value="">Semua</option>
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABEL[r]}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn-secondary">
              Terapkan
            </button>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500 bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-2">Nama</th>
                <th className="px-4 py-2">NIM/NIP</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Peran</th>
                <th className="px-4 py-2">Prodi</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Dibuat</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    Tidak ada data.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2 font-medium text-slate-900">
                      {u.name}
                    </td>
                    <td className="px-4 py-2">{u.nimNip}</td>
                    <td className="px-4 py-2">{u.email}</td>
                    <td className="px-4 py-2">{ROLE_LABEL[u.role]}</td>
                    <td className="px-4 py-2">{u.prodi?.name ?? "-"}</td>
                    <td className="px-4 py-2">
                      {u.isActive ? (
                        <span className="badge-green">Aktif</span>
                      ) : (
                        <span className="badge-gray">Nonaktif</span>
                      )}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-xs text-slate-500">
                      {formatDateTime(u.createdAt)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <UserActions
                        id={u.id}
                        isActive={u.isActive}
                        canDelete={u.id !== user.id}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
