"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NarrativeSection({
  weekStart,
  initialNarrative,
  canGenerate,
}: {
  weekStart: string;
  initialNarrative: string | null;
  canGenerate: boolean;
}) {
  const router = useRouter();
  const [narrative, setNarrative] = useState(initialNarrative);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/reports/${weekStart}/narrative`, {
      method: "POST",
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Gagal membuat narasi.");
      return;
    }
    setNarrative(data.narrative);
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold text-slate-900">Analisis AI</h2>
        {canGenerate && (
          <button
            type="button"
            onClick={generate}
            disabled={loading}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {loading
              ? "Membuat…"
              : narrative
                ? "Buat ulang"
                : "✨ Buat narasi"}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {narrative ? (
        <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
          {narrative}
        </div>
      ) : canGenerate ? (
        <p className="text-sm text-slate-500">
          Belum ada analisis. Klik “Buat narasi” untuk merangkum minggu ini
          dengan AI (memakai API key Anthropic milikmu).
        </p>
      ) : (
        <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Narasi AI butuh API key Anthropic. Statistik & rincian di bawah tetap
          tersedia tanpa AI.{" "}
          <a href="/settings" className="font-medium underline">
            Tambahkan key di Pengaturan
          </a>
          .
        </div>
      )}
    </div>
  );
}
