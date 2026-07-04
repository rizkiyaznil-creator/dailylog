import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { readStoredFile, contentTypeForPath } from "@/lib/storage";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }
  const { id } = await params;

  const attachment = await prisma.attachment.findUnique({
    where: { id },
    include: { log: { select: { userId: true } } },
  });
  if (!attachment || attachment.log.userId !== session.user.id) {
    return new Response("Not found", { status: 404 });
  }

  let buffer: Buffer;
  try {
    buffer = await readStoredFile(attachment.filePath);
  } catch {
    return new Response("File missing", { status: 404 });
  }

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": contentTypeForPath(attachment.filePath),
      "Content-Length": String(buffer.length),
      "Cache-Control": "private, max-age=3600",
    },
  });
}
