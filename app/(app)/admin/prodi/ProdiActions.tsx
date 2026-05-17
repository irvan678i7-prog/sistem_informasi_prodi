"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ProdiForm } from "./ProdiForm";

type ProdiData = {
  id: string;
  code: string;
  name: string;
  jenjang: string;
  kaprodiId: string;
};

export function ProdiActions({
  prodi,
  dosen,
}: {
  prodi: ProdiData;
  dosen: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function del() {
    if (!confirm(`Hapus Prodi "${prodi.name}"?`)) return;
    setLoading(true);
    const res = await fetch(`/api/admin/prodi/${prodi.id}`, {
      method: "DELETE",
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({ message: "Gagal" }));
      alert(d.message || "Gagal hapus");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex gap-2 justify-end">
      <Button size="sm" variant="ghost" onClick={() => setOpen((v) => !v)}>
        {open ? "Batal" : "Edit"}
      </Button>
      <Button size="sm" variant="danger" onClick={del} disabled={loading}>
        Hapus
      </Button>
      {open && (
        <div className="absolute right-4 mt-10 z-10 bg-white border border-slate-200 shadow-lg rounded-md p-4 w-[min(560px,90vw)]">
          <ProdiForm
            mode="edit"
            initial={prodi}
            dosen={dosen}
            onDone={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
