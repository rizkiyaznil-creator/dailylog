"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AudioRecorder } from "@/components/audio-recorder";

type Pending = { id: string; file: File };

let counter = 0;
const nextId = () => `p${counter++}`;

export function NewLogForm({
  defaultDate,
  canTranscribe,
}: {
  defaultDate: string;
  canTranscribe: boolean;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState("");
  const [pending, setPending] = useState<Pending[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addFiles(list: FileList | File[]) {
    const arr = Array.from(list).map((file) => ({ id: nextId(), file }));
    setPending((prev) => [...prev, ...arr]);
  }

  function removePending(id: string) {
    setPending((prev) => prev.filter((p) => p.id !== id));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData();
    form.set("content", content);
    form.set("logDate", (e.currentTarget.logDate as HTMLInputElement).value);
    pending.forEach((p) => form.append("files", p.file, p.file.name));

    const res = await fetch("/api/logs", { method: "POST", body: form });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok && res.status !== 207) {
      setError(data.error ?? "Gagal menyimpan catatan.");
      return;
    }
    router.push(`/logs/${data.id}`);
    router.refresh();
  }

  const hasAudio = pending.some((p) => p.file.type.startsWith("audio/"));

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <label
            htmlFor="logDate"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Tanggal
          </label>
          <input
            id="logDate"
            name="logDate"
            type="date"
            defaultValue={defaultDate}
            required
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div>
          <label
            htmlFor="content"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Apa yang kamu kerjakan hari ini?
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            placeholder="Tulis bebas… (mendukung format Markdown)"
            className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-1 text-sm font-semibold text-slate-900">Lampiran</h2>
        <p className="mb-4 text-xs text-slate-500">
          Gambar dan suara. Rekaman suara akan{" "}
          {canTranscribe ? "ditranskripsi otomatis" : "diberi transkripsi contoh (mock)"}{" "}
          saat disimpan.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            📎 Pilih file
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,audio/*"
            multiple
            hidden
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <AudioRecorder onRecorded={(file) => addFiles([file])} />
        </div>

        {pending.length > 0 && (
          <ul className="mt-4 space-y-2">
            {pending.map((p) => (
              <PendingRow key={p.id} p={p} onRemove={() => removePending(p.id)} />
            ))}
          </ul>
        )}
        {hasAudio && !canTranscribe && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
            Belum ada API key OpenAI — transkripsi memakai contoh. Tambahkan key
            di Pengaturan untuk hasil asli.
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-60"
        >
          {loading ? "Menyimpan…" : "Simpan catatan"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/logs")}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          Batal
        </button>
      </div>
    </form>
  );
}

function PendingRow({ p, onRemove }: { p: Pending; onRemove: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const isImage = p.file.type.startsWith("image/");

  useEffect(() => {
    const objectUrl = URL.createObjectURL(p.file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [p.file]);

  return (
    <li className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-2">
      {isImage && url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={p.file.name}
          className="h-12 w-12 shrink-0 rounded object-cover"
        />
      ) : (
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-slate-200 text-lg">
          {isImage ? "🖼️" : "🎵"}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-slate-700">{p.file.name}</p>
        <p className="text-xs text-slate-400">
          {(p.file.size / 1024).toFixed(0)} KB
        </p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
        aria-label="Hapus"
      >
        ✕
      </button>
    </li>
  );
}
