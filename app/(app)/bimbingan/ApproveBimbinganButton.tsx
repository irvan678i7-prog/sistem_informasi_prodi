"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function ApproveBimbinganButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function approve() {
    setLoading(true);
    try {
      const res = await fetch(`/api/tesis/bimbingan/${id}/approve`, {
        method: "POST",
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }
  return (
    <Button size="sm" onClick={approve} disabled={loading}>
      {loading ? "..." : "Paraf"}
    </Button>
  );
}
