import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, aiCapabilities } from "@/lib/user";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const caps = aiCapabilities(user);
  const firstName = (user.name ?? "").split(" ")[0] || "di sana";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Halo, {firstName} 👋
        </h1>
        <p className="mt-1 text-slate-500">
          Catat aktivitas hari ini, dan biarkan laporan mingguan tersusun
          sendiri.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/logs/new"
          className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="mb-2 text-2xl">✍️</div>
          <h2 className="font-semibold text-slate-900">Tulis catatan hari ini</h2>
          <p className="mt-1 text-sm text-slate-500">
            Teks bebas, rekaman suara, atau gambar.
          </p>
          <span className="mt-3 inline-block text-sm font-medium text-indigo-600 group-hover:text-indigo-500">
            Mulai menulis →
          </span>
        </Link>

        <Link
          href="/reports"
          className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="mb-2 text-2xl">📊</div>
          <h2 className="font-semibold text-slate-900">Laporan mingguan</h2>
          <p className="mt-1 text-sm text-slate-500">
            Ringkasan rapi per tanggal + analisis, siap di-export.
          </p>
          <span className="mt-3 inline-block text-sm font-medium text-indigo-600 group-hover:text-indigo-500">
            Lihat laporan →
          </span>
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-semibold text-slate-900">Status fitur AI</h2>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <StatusDot on={caps.transcription} />
            <span className="text-slate-700">
              Transkripsi suara (Whisper)
            </span>
            <span className="text-slate-400">
              {caps.transcription ? "aktif" : "mock — belum ada API key OpenAI"}
            </span>
          </li>
          <li className="flex items-center gap-2">
            <StatusDot on={caps.narrative} />
            <span className="text-slate-700">Narasi laporan (Claude)</span>
            <span className="text-slate-400">
              {caps.narrative
                ? "aktif"
                : "hanya analisis statistik — belum ada API key Anthropic"}
            </span>
          </li>
        </ul>
        {(!caps.transcription || !caps.narrative) && (
          <Link
            href="/settings"
            className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            Tambahkan API key di Pengaturan →
          </Link>
        )}
      </div>
    </div>
  );
}

function StatusDot({ on }: { on: boolean }) {
  return (
    <span
      className={
        "inline-block h-2 w-2 shrink-0 rounded-full " +
        (on ? "bg-emerald-500" : "bg-slate-300")
      }
    />
  );
}
