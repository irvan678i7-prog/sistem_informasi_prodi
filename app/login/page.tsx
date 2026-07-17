import { Suspense } from "react";
import { LoginForm } from "./LoginForm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-um-metro.png"
              alt="UM Metro"
              className="w-16 h-16 object-contain"
            />
          </Link>
          <h1 className="text-2xl font-bold mt-3 text-slate-900">
            Masuk SIPRO
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Sistem Informasi Prodi · PPs UM Metro
          </p>
        </div>
        <div className="card">
          <div className="card-body">
            <Suspense fallback={null}>
              <LoginForm scope="user" />
            </Suspense>
          </div>
        </div>
        <div className="text-center mt-4">
          <Link
            href="/"
            className="text-sm text-brand-700 hover:text-brand-800 underline"
          >
            ← Kembali ke Menu Utama
          </Link>
        </div>
        <p className="text-center text-xs text-slate-500 mt-3">
          Login sebagai administrator?{" "}
          <Link href="/admin/login" className="text-brand-700 underline">
            Klik di sini
          </Link>
        </p>
      </div>
    </main>
  );
}
