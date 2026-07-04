import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { addAttachment, UploadError } from "@/lib/attachments";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }
  const userId = session.user.id;
  const { id } = await params;

  const log = await prisma.dailyLog.findUnique({ where: { id } });
  if (!log || log.userId !== userId) {
    return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File tidak ada" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { openaiKeyEnc: true },
  });

  try {
    const attachment = await addAttachment({
      logId: id,
      userId,
      file,
      openaiKeyEnc: user?.openaiKeyEnc ?? null,
    });
    return NextResponse.json({ attachment }, { status: 201 });
  } catch (err) {
    if (err instanceof UploadError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
