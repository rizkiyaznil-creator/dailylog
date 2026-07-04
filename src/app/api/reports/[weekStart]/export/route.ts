import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buildWeeklyReport } from "@/lib/report";
import { reportToMarkdown } from "@/lib/markdown";
import { parseDateOnly } from "@/lib/dates";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ weekStart: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }
  const userId = session.user.id;
  const { weekStart } = await params;

  const report = await buildWeeklyReport(userId, weekStart);
  if (!report) {
    return new Response("Minggu tidak valid", { status: 400 });
  }

  const monday = parseDateOnly(report.weekStart)!;
  const saved = await prisma.weeklyNarrative.findUnique({
    where: { userId_weekStart: { userId, weekStart: monday } },
    select: { content: true },
  });

  const markdown = reportToMarkdown(report, saved?.content ?? null);

  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="laporan-${report.weekStart}.md"`,
    },
  });
}
