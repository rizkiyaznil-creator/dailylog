import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/crypto";
import { apiKeysSchema } from "@/lib/validations";

const CLEAR = "__CLEAR__";

// Resolve the next DB value for a key field:
//   ""        -> undefined (no change)
//   "__CLEAR__" -> null (remove)
//   other      -> encrypted string (set)
function resolve(input: string | undefined): string | null | undefined {
  if (input === undefined || input === "") return undefined;
  if (input === CLEAR) return null;
  return encrypt(input.trim());
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const parsed = apiKeysSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }

  const data: Record<string, string | null> = {};
  const openai = resolve(parsed.data.openaiKey);
  const anthropic = resolve(parsed.data.anthropicKey);
  if (openai !== undefined) data.openaiKeyEnc = openai;
  if (anthropic !== undefined) data.anthropicKeyEnc = anthropic;

  if (Object.keys(data).length > 0) {
    await prisma.user.update({
      where: { id: session.user.id },
      data,
    });
  }

  return NextResponse.json({ ok: true });
}
