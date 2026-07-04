import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/crypto";
import { buildWeeklyReport } from "@/lib/report";
import { generateNarrative } from "@/lib/narrative";
import { parseDateOnly } from "@/lib/dates";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ weekStart: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }
  const userId = session.user.id;
  const { weekStart } = await params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { anthropicKeyEnc: true },
  });
  if (!user?.anthropicKeyEnc) {
    return NextResponse.json(
      { error: "Belum ada API key Anthropic. Tambahkan di Pengaturan." },
      { status: 400 },
    );
  }

  const report = await buildWeeklyReport(userId, weekStart);
  if (!report) {
    return NextResponse.json({ error: "Minggu tidak valid" }, { status: 400 });
  }
  if (report.stats.totalLogs === 0) {
    return NextResponse.json(
      { error: "Tidak ada catatan untuk dianalisis minggu ini." },
      { status: 400 },
    );
  }

  let key: string;
  try {
    key = decrypt(user.anthropicKeyEnc);
  } catch {
    return NextResponse.json(
      { error: "Gagal membaca API key." },
      { status: 500 },
    );
  }

  let narrative: string;
  try {
    narrative = await generateNarrative(report, key);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal menghubungi Claude.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const monday = parseDateOnly(report.weekStart)!;
  await prisma.weeklyNarrative.upsert({
    where: { userId_weekStart: { userId, weekStart: monday } },
    create: { userId, weekStart: monday, content: narrative },
    update: { content: narrative },
  });

  return NextResponse.json({ narrative });
}
