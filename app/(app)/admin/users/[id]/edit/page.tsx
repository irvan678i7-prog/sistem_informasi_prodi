import { redirect, notFound } from "next/navigation";
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
import { EditUserForm } from "./EditUserForm";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.role !== "ADMIN") redirect("/dashboard");

  const { id } = await params;
  const [target, prodi] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        nimNip: true,
        role: true,
        prodiId: true,
        phone: true,
        address: true,
        isActive: true,
        mahasiswaProfile: { select: { angkatan: true } },
        dosenProfile: { select: { nidn: true } },
      },
    }),
    prisma.prodi.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!target) notFound();

  const editable = {
    id: target.id,
    name: target.name,
    email: target.email,
    nimNip: target.nimNip,
    role: target.role,
    prodiId: target.prodiId,
    phone: target.phone,
    address: target.address,
    isActive: target.isActive,
    angkatan: target.mahasiswaProfile?.angkatan ?? null,
    nidn: target.dosenProfile?.nidn ?? null,
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Edit User</h1>
          <p className="text-sm text-slate-500">
            Perbarui data akun {target.name}.
          </p>
        </div>
        <Link href="/admin/users" className="btn-ghost text-sm">
          Kembali ke daftar
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Akun</CardTitle>
          <CardDescription>
            Perubahan tersimpan ke basis data dan tercatat pada audit log.
          </CardDescription>
        </CardHeader>
        <CardBody>
          <EditUserForm
            user={editable}
            prodi={prodi}
            isSelf={target.id === user.id}
          />
        </CardBody>
      </Card>
    </div>
  );
}
