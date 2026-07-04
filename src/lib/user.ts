import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/** Returns the full User row for the signed-in session, or null. */
export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({ where: { id: session.user.id } });
}

/** Which AI features the current user has unlocked via BYOK. */
export function aiCapabilities(user: {
  openaiKeyEnc: string | null;
  anthropicKeyEnc: string | null;
}) {
  return {
    transcription: Boolean(user.openaiKeyEnc), // Whisper
    narrative: Boolean(user.anthropicKeyEnc), // Claude weekly narrative
  };
}
