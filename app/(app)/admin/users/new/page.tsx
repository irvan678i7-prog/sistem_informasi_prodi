import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { UserForm } from "./UserForm";

export default async function NewUserPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.role !== "ADMIN") redirect("/dashboard");

  const prodi = await prisma.prodi.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Tambah User</h1>
        <Link href="/admin/users" className="btn-ghost">
          Kembali
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Form akun baru</CardTitle>
        </CardHeader>
        <CardBody>
          <UserForm
            prodi={prodi.map((p) => ({ id: p.id, name: p.name }))}
            adminProdiId={null}
          />
        </CardBody>
      </Card>
    </div>
  );
}
