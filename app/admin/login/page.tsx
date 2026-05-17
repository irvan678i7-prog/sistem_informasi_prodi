import { Suspense } from "react";
import { LoginForm } from "../../login/LoginForm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-12 h-12 rounded-lg bg-white text-brand-700 grid place-items-center font-bold text-xl">
              S
            </div>
          </Link>
          <h1 className="text-2xl font-bold mt-3">Admin Sistem</h1>
          <p className="text-sm text-slate-300 mt-1">
            Sistem Informasi Prodi · PPs UM Metro
          </p>
        </div>
        <div className="card text-slate-900">
          <div className="card-body">
            <Suspense fallback={null}>
              <LoginForm scope="admin" />
            </Suspense>
          </div>
        </div>
        <p className="text-center text-xs text-slate-300 mt-4">
          Bukan admin?{" "}
          <Link href="/login" className="underline">
            Login mahasiswa/dosen
          </Link>
        </p>
      </div>
    </main>
  );
}
