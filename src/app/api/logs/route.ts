import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseDateOnly } from "@/lib/dates";
import { addAttachment, UploadError } from "@/lib/attachments";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }
  const userId = session.user.id;

  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json(
      { error: "Format request tidak valid" },
      { status: 400 },
    );
  }

  const content = (form.get("content") as string | null)?.trim() ?? "";
  const dateStr = (form.get("logDate") as string | null) ?? "";
  const logDate = parseDateOnly(dateStr);
  if (!logDate) {
    return NextResponse.json({ error: "Tanggal tidak valid" }, { status: 400 });
  }

  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (!content && files.length === 0) {
    return NextResponse.json(
      { error: "Catatan tidak boleh kosong" },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { openaiKeyEnc: true },
  });

  const log = await prisma.dailyLog.create({
    data: { userId, logDate, content },
  });

  try {
    for (const file of files) {
      await addAttachment({
        logId: log.id,
        userId,
        file,
        openaiKeyEnc: user?.openaiKeyEnc ?? null,
      });
    }
  } catch (err) {
    if (err instanceof UploadError) {
      return NextResponse.json(
        { id: log.id, warning: err.message },
        { status: 207 },
      );
    }
    throw err;
  }

  return NextResponse.json({ id: log.id }, { status: 201 });
}
