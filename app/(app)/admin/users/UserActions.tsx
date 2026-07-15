"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function UserActions({
  id,
  isActive,
  canDelete,
}: {
  id: string;
  isActive: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<"toggle" | "delete" | "reset" | null>(
    null,
  );
  // Dialog & toast buatan sendiri — tidak memakai prompt/alert bawaan
  // browser yang menampilkan nama domain (mis. "vercel.app says").
  const [dialog, setDialog] = useState<"reset" | "delete" | null>(null);
  const [password, setPassword] = useState("ubahdulu123");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  async function toggle() {
    setLoading("toggle");
    await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    setLoading(null);
    router.refresh();
  }

  async function doReset() {
    if (password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }
    setLoading("reset");
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(null);
    setDialog(null);
    if (res.ok) {
      showToast("Password berhasil direset.");
    } else {
      const d = await res.json().catch(() => ({ message: "Gagal" }));
      setError(d.message || "Gagal mereset password.");
      setDialog("reset");
    }
  }

  async function doDelete() {
    setLoading("delete");
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    setLoading(null);
    setDialog(null);
    if (!res.ok) {
      const d = await res.json().catch(() => ({ message: "Gagal" }));
      showToast(d.message || "Gagal menghapus.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex gap-2 justify-end">
      <Link
        href={`/admin/users/${id}/edit`}
        className="inline-flex items-center rounded-md px-2.5 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-50"
      >
        Edit
      </Link>
      <Button
        size="sm"
        variant="ghost"
        onClick={toggle}
        disabled={loading !== null}
      >
        {loading === "toggle" ? "..." : isActive ? "Nonaktifkan" : "Aktifkan"}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => {
          setError("");
          setPassword("ubahdulu123");
          setDialog("reset");
        }}
        disabled={loading !== null}
      >
        Reset Password
      </Button>
      {canDelete && (
        <Button
          size="sm"
          variant="danger"
          onClick={() => setDialog("delete")}
          disabled={loading !== null}
        >
          Hapus
        </Button>
      )}

      {/* Dialog reset password */}
      {dialog === "reset" && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Reset password"
        >
          <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl text-left">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h3 className="text-base font-semibold text-slate-900">
                Reset Password
              </h3>
              <button
                type="button"
                onClick={() => setDialog(null)}
                aria-label="Tutup"
                className="rounded p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <label
              htmlFor={`pwd-${id}`}
              className="block text-sm text-slate-600 mb-1"
            >
              Password baru (min 6 karakter)
            </label>
            <input
              id={`pwd-${id}`}
              type="text"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              className="input w-full"
              autoFocus
            />
            {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setDialog(null)}
              >
                Batal
              </Button>
              <Button size="sm" onClick={doReset} disabled={loading !== null}>
                {loading === "reset" ? "Menyimpan..." : "Reset"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog konfirmasi hapus */}
      {dialog === "delete" && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Konfirmasi hapus"
        >
          <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl text-left">
            <h3 className="text-base font-semibold text-slate-900 mb-2">
              Hapus User
            </h3>
            <p className="text-sm text-slate-600">
              Hapus user ini? Tindakan tidak dapat dibatalkan.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setDialog(null)}
              >
                Batal
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={doDelete}
                disabled={loading !== null}
              >
                {loading === "delete" ? "Menghapus..." : "Hapus"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Toast sukses di tengah layar */}
      {toast && (
        <div
          className="fixed inset-0 z-50 grid place-items-center pointer-events-none"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-xl">
            <CheckCircle2 className="w-5 h-5 text-green-400" aria-hidden />
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
