import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { getCurrentUser, aiCapabilities } from "@/lib/user";
import { toDateOnlyString } from "@/lib/dates";
import { NewLogForm } from "./new-log-form";

export const dynamic = "force-dynamic";

export default async function NewLogPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = await getCurrentUser();
  const caps = user ? aiCapabilities(user) : { transcription: false };

  // "Today" in the app's terms — server UTC date is fine as the default.
  const today = toDateOnlyString(new Date(Date.now()));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/logs" className="hover:text-slate-700">
          Catatan
        </Link>
        <span>/</span>
        <span className="text-slate-700">Baru</span>
      </div>
      <NewLogForm defaultDate={today} canTranscribe={caps.transcription} />
    </div>
  );
}
