"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function MarkAllReadButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function click() {
    setLoading(true);
    try {
      await fetch("/api/notifikasi/read-all", { method: "POST" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="secondary" size="sm" onClick={click} disabled={loading}>
      {loading ? "..." : "Tandai semua telah dibaca"}
    </Button>
  );
}
