"use client";

import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[App error boundary]", error);
  }, [error]);

  return (
    <div className="max-w-2xl mx-auto py-10">
      <div className="rounded-lg border border-red-200 bg-red-50 p-5 space-y-3">
        <h2 className="text-lg font-semibold text-red-800">
          Terjadi kesalahan
        </h2>
        <p className="text-sm text-red-800">
          {error.message || "Server-side exception occurred."}
        </p>
        {error.digest && (
          <p className="text-xs text-red-700 font-mono">
            Digest: {error.digest}
          </p>
        )}
        <div className="flex gap-2 pt-2">
          <button
            onClick={reset}
            className="rounded-md bg-red-600 text-white text-sm px-4 py-2 hover:bg-red-700"
          >
            Coba lagi
          </button>
          <a
            href="/dashboard"
            className="rounded-md border border-red-300 text-red-700 text-sm px-4 py-2 hover:bg-red-100"
          >
            Kembali ke Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
