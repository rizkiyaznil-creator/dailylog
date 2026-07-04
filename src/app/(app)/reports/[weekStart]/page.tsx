import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, aiCapabilities } from "@/lib/user";
import { buildWeeklyReport } from "@/lib/report";
import { formatLongID, formatWeekRange, parseDateOnly } from "@/lib/dates";
import { NarrativeSection } from "./narrative-section";

export const dynamic = "force-dynamic";

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ weekStart: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { weekStart } = await params;

  const report = await buildWeeklyReport(session.user.id, weekStart);
  if (!report) notFound();

  const user = await getCurrentUser();
  const caps = user ? aiCapabilities(user) : { narrative: false };

  const monday = parseDateOnly(report.weekStart)!;
  const saved = await prisma.weeklyNarrative.findUnique({
    where: {
      userId_weekStart: { userId: session.user.id, weekStart: monday },
    },
    select: { content: true },
  });

  const s = report.stats;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/reports" className="hover:text-slate-700">
          Laporan
        </Link>
        <span>/</span>
        <span className="text-slate-700">Minggu</span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {formatWeekRange(monday)}
        </h1>
        <a
          href={`/api/reports/${report.weekStart}/export`}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          ⬇ Export Markdown
        </a>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Catatan" value={s.totalLogs} />
        <Stat label="Hari aktif" value={`${s.activeDays}/7`} />
        <Stat label="Total kata" value={s.totalWords} />
        <Stat label="Lampiran" value={`${s.imageCount}🖼 ${s.audioCount}🎵`} />
      </div>

      {s.topKeywords.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">
            Tema utama
          </h2>
          <div className="flex flex-wrap gap-2">
            {s.topKeywords.map((k) => (
              <span
                key={k.word}
                className="rounded-full bg-indigo-50 px-3 py-1 text-sm text-indigo-700"
              >
                {k.word} <span className="text-indigo-400">×{k.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* AI narrative */}
      <NarrativeSection
        weekStart={report.weekStart}
        initialNarrative={saved?.content ?? null}
        canGenerate={caps.narrative}
      />

      {/* Per-day detail */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Rincian Harian</h2>
        {report.days.map((day) => {
          const d = parseDateOnly(day.date);
          return (
            <div
              key={day.date}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <h3 className="mb-3 font-semibold text-slate-900">
                {d ? formatLongID(d) : day.date}
              </h3>
              <div className="space-y-4">
                {day.logs.map((log) => (
                  <div
                    key={log.id}
                    className="border-l-2 border-slate-100 pl-3"
                  >
                    {log.content.trim() && (
                      <p className="whitespace-pre-wrap text-sm text-slate-700">
                        {log.content.trim()}
                      </p>
                    )}
                    {log.attachments.map((a) => (
                      <div key={a.id} className="mt-2">
                        {a.type === "image" ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={`/api/files/${a.id}`}
                            alt="Lampiran"
                            className="max-h-40 rounded-lg object-contain"
                          />
                        ) : (
                          <div className="rounded-md bg-slate-50 p-2 text-sm text-slate-600">
                            <span className="mr-1">🎵</span>
                            {a.transcript ?? "(tanpa transkripsi)"}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}
