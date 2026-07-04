import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatLongID } from "@/lib/dates";

export const dynamic = "force-dynamic";

function snippet(text: string, max = 140): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? clean.slice(0, max) + "…" : clean;
}

export default async function LogsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const logs = await prisma.dailyLog.findMany({
    where: { userId: session.user.id },
    orderBy: [{ logDate: "desc" }, { createdAt: "desc" }],
    include: { _count: { select: { attachments: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Catatan Harian
          </h1>
          <p className="mt-1 text-slate-500">
            {logs.length > 0
              ? `${logs.length} catatan tersimpan`
              : "Belum ada catatan"}
          </p>
        </div>
        <Link
          href="/logs/new"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
        >
          + Catatan baru
        </Link>
      </div>

      {logs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <div className="mb-2 text-3xl">✍️</div>
          <p className="text-sm text-slate-500">
            Mulai catat aktivitas pertamamu.
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
          {logs.map((log) => (
            <li key={log.id}>
              <Link
                href={`/logs/${log.id}`}
                className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900">
                    {formatLongID(log.logDate)}
                  </span>
                  {log._count.attachments > 0 && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                      📎 {log._count.attachments}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600">
                  {log.content ? snippet(log.content) : (
                    <span className="italic text-slate-400">
                      (hanya lampiran)
                    </span>
                  )}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
