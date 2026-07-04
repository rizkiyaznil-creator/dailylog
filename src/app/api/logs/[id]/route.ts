import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseDateOnly } from "@/lib/dates";
import { deleteStoredFile } from "@/lib/storage";

async function requireOwnedLog(logId: string, userId: string) {
  const log = await prisma.dailyLog.findUnique({ where: { id: logId } });
  if (!log || log.userId !== userId) return null;
  return log;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }
  const { id } = await params;
  const log = await requireOwnedLog(id, session.user.id);
  if (!log) {
    return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as {
    content?: string;
    logDate?: string;
  } | null;
  if (!body) {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const data: { content?: string; logDate?: Date } = {};
  if (typeof body.content === "string") data.content = body.content;
  if (typeof body.logDate === "string") {
    const d = parseDateOnly(body.logDate);
    if (!d) {
      return NextResponse.json({ error: "Tanggal tidak valid" }, { status: 400 });
    }
    data.logDate = d;
  }

  await prisma.dailyLog.update({ where: { id }, data });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }
  const { id } = await params;

  const log = await prisma.dailyLog.findUnique({
    where: { id },
    include: { attachments: true },
  });
  if (!log || log.userId !== session.user.id) {
    return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
  }

  await Promise.all(log.attachments.map((a) => deleteStoredFile(a.filePath)));
  await prisma.dailyLog.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
