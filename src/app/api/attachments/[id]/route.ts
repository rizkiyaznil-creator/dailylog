import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { deleteStoredFile } from "@/lib/storage";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }
  const { id } = await params;

  const attachment = await prisma.attachment.findUnique({
    where: { id },
    include: { log: { select: { userId: true } } },
  });
  if (!attachment || attachment.log.userId !== session.user.id) {
    return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
  }

  await deleteStoredFile(attachment.filePath);
  await prisma.attachment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
