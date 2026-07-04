"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AudioRecorder } from "@/components/audio-recorder";

type Attachment = {
  id: string;
  type: "image" | "audio";
  url: string;
  transcript: string | null;
};

export function EditLogForm({
  logId,
  initialContent,
  initialDate,
  canTranscribe,
  attachments,
}: {
  logId: string;
  initialContent: string;
  initialDate: string;
  canTranscribe: boolean;
  attachments: Attachment[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [content, setContent] = useState(initialContent);
  const [date, setDate] = useState(initialDate);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = content !== initialContent || date !== initialDate;

  async function save() {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/logs/${logId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, logDate: date }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Gagal menyimpan.");
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    router.refresh();
  }

  async function uploadFile(file: File) {
    setUploading(true);
    setError(null);
    const form = new FormData();
    form.append("file", file, file.name);
    const res = await fetch(`/api/logs/${logId}/attachments`, {
      method: "POST",
      body: form,
    });
    setUploading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Gagal mengunggah lampiran.");
      return;
    }
    router.refresh();
  }

  async function removeAttachment(id: string) {
    const res = await fetch(`/api/attachments/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  }

  async function deleteLog() {
    if (!confirm("Hapus catatan ini beserta lampirannya?")) return;
    const res = await fetch(`/api/logs/${logId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/logs");
      router.refresh();
    }
  }

  return (
    <div className="space-y-5">
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
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <label
          htmlFor="content"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Catatan
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          placeholder="Tulis bebas… (mendukung Markdown)"
          className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={saving || !dirty}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
          >
            {saving ? "Menyimpan…" : "Simpan perubahan"}
          </button>
          {saved && (
            <span className="text-sm text-emerald-600">✓ Tersimpan</span>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Lampiran</h2>

        {attachments.length === 0 ? (
          <p className="mb-4 text-sm text-slate-400">Belum ada lampiran.</p>
        ) : (
          <ul className="mb-4 space-y-3">
            {attachments.map((a) => (
              <li
                key={a.id}
                className="rounded-lg border border-slate-200 bg-slate-50 p-3"
              >
                <div className="flex items-start gap-3">
                  {a.type === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={a.url}
                      alt="Lampiran"
                      className="max-h-48 rounded-lg object-contain"
                    />
                  ) : (
                    <div className="flex-1">
                      <audio controls src={a.url} className="w-full" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeAttachment(a.id)}
                    className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-red-600"
                    aria-label="Hapus lampiran"
                  >
                    ✕
                  </button>
                </div>
                {a.type === "audio" && a.transcript && (
                  <div className="mt-2 rounded-md bg-white p-2 text-sm text-slate-600">
                    <span className="mb-0.5 block text-xs font-medium text-slate-400">
                      Transkripsi
                    </span>
                    {a.transcript}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            📎 Tambah file
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,audio/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadFile(f);
              e.target.value = "";
            }}
          />
          <AudioRecorder
            onRecorded={uploadFile}
            disabled={uploading}
          />
          {uploading && (
            <span className="text-sm text-slate-400">Mengunggah…</span>
          )}
        </div>
        {!canTranscribe && (
          <p className="mt-3 text-xs text-slate-400">
            Transkripsi suara memakai contoh (mock). Tambahkan API key OpenAI di
            Pengaturan untuk hasil asli.
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={deleteLog}
          className="rounded-lg px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          Hapus catatan
        </button>
      </div>
    </div>
  );
}
