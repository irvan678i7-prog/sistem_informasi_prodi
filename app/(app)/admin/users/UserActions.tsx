"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

  async function resetPwd() {
    const password = window.prompt(
      "Password baru (min 6 karakter):",
      "ubahdulu123",
    );
    if (!password || password.length < 6) return;
    setLoading("reset");
    await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(null);
    alert("Password direset.");
  }

  async function del() {
    if (!confirm("Hapus user ini? Tindakan tidak dapat dibatalkan."))
      return;
    setLoading("delete");
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json().catch(() => ({ message: "Gagal" }));
      alert(d.message || "Gagal menghapus.");
      setLoading(null);
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
        onClick={resetPwd}
        disabled={loading !== null}
      >
        Reset Password
      </Button>
      {canDelete && (
        <Button
          size="sm"
          variant="danger"
          onClick={del}
          disabled={loading !== null}
        >
          Hapus
        </Button>
      )}
    </div>
  );
}
