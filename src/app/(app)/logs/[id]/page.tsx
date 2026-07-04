import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, aiCapabilities } from "@/lib/user";
import { toDateOnlyString } from "@/lib/dates";
import { EditLogForm } from "./edit-log-form";

export const dynamic = "force-dynamic";

export default async function LogDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { id } = await params;

  const log = await prisma.dailyLog.findUnique({
    where: { id },
    include: { attachments: { orderBy: { createdAt: "asc" } } },
  });
  if (!log || log.userId !== session.user.id) notFound();

  const user = await getCurrentUser();
  const caps = user ? aiCapabilities(user) : { transcription: false };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/logs" className="hover:text-slate-700">
          Catatan
        </Link>
        <span>/</span>
        <span className="text-slate-700">Detail</span>
      </div>

      <EditLogForm
        logId={log.id}
        initialContent={log.content}
        initialDate={toDateOnlyString(log.logDate)}
        canTranscribe={caps.transcription}
        attachments={log.attachments.map((a) => ({
          id: a.id,
          type: a.type as "image" | "audio",
          url: `/api/files/${a.id}`,
          transcript: a.transcript,
        }))}
      />
    </div>
  );
}
