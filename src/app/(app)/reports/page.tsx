import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listReportWeeks } from "@/lib/report";
import { formatWeekRange, parseDateOnly } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const weeks = await listReportWeeks(session.user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Laporan Mingguan
        </h1>
        <p className="mt-1 text-slate-500">
          Pilih minggu untuk melihat laporan rapi, analisis, dan export Markdown.
        </p>
      </div>

      {weeks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <div className="mb-2 text-3xl">📊</div>
          <p className="text-sm text-slate-500">
            Belum ada catatan. Laporan muncul otomatis setelah kamu mencatat.
          </p>
          <Link
            href="/logs/new"
            className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Tulis catatan
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {weeks.map((w) => {
            const monday = parseDateOnly(w.weekStart);
            return (
              <li key={w.weekStart}>
                <Link
                  href={`/reports/${w.weekStart}`}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      {monday ? formatWeekRange(monday) : w.weekStart}
                    </p>
                    <p className="text-sm text-slate-500">
                      {w.count} catatan
                    </p>
                  </div>
                  <span className="text-indigo-600">→</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
