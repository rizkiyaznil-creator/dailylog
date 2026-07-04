"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  openaiMask: string | null;
  anthropicMask: string | null;
};

export function ApiKeysForm({ openaiMask, anthropicMask }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<
    { type: "ok" | "err"; msg: string } | null
  >(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    // "__CLEAR__" removes the stored key; "" leaves it unchanged; anything else sets it.
    const readKey = (name: string) =>
      form.get(`${name}__clear`)
        ? "__CLEAR__"
        : (form.get(name) as string) || "";
    const payload = {
      openaiKey: readKey("openaiKey"),
      anthropicKey: readKey("anthropicKey"),
    };

    const res = await fetch("/api/settings/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setStatus({ type: "err", msg: data.error ?? "Gagal menyimpan." });
      return;
    }
    setStatus({ type: "ok", msg: "Tersimpan." });
    (e.target as HTMLFormElement).reset();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {status && (
        <div
          className={
            "rounded-lg px-3 py-2 text-sm " +
            (status.type === "ok"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700")
          }
        >
          {status.msg}
        </div>
      )}

      <KeyField
        name="openaiKey"
        label="OpenAI API Key"
        hint="Untuk transkripsi suara → teks (Whisper)."
        placeholder="sk-…"
        currentMask={openaiMask}
      />

      <KeyField
        name="anthropicKey"
        label="Anthropic API Key"
        hint="Untuk narasi & insight laporan mingguan (Claude)."
        placeholder="sk-ant-…"
        currentMask={anthropicMask}
      />

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-60"
        >
          {loading ? "Menyimpan…" : "Simpan"}
        </button>
        <p className="text-xs text-slate-400">
          Kosongkan untuk membiarkan key yang ada tidak berubah.
        </p>
      </div>
    </form>
  );
}

function KeyField({
  name,
  label,
  hint,
  placeholder,
  currentMask,
}: {
  name: string;
  label: string;
  hint: string;
  placeholder: string;
  currentMask: string | null;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label htmlFor={name} className="text-sm font-medium text-slate-700">
          {label}
        </label>
        {currentMask ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            tersimpan · {currentMask}
          </span>
        ) : (
          <span className="text-xs text-slate-400">belum diatur</span>
        )}
      </div>
      <input
        id={name}
        name={name}
        type="password"
        autoComplete="off"
        placeholder={currentMask ? "•••••••• (isi untuk ganti)" : placeholder}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
      />
      <div className="mt-1 flex items-center justify-between">
        <p className="text-xs text-slate-400">{hint}</p>
        {currentMask && (
          <label className="flex items-center gap-1.5 text-xs text-slate-500">
            <input type="checkbox" name={`${name}__clear`} className="rounded" />
            Hapus key ini
          </label>
        )}
      </div>
    </div>
  );
}
