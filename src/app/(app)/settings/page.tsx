import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/user";
import { decrypt, maskKey } from "@/lib/crypto";
import { ApiKeysForm } from "./api-keys-form";

function safeMask(enc: string | null): string | null {
  if (!enc) return null;
  try {
    return maskKey(decrypt(enc));
  } catch {
    return "••••";
  }
}

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Pengaturan
        </h1>
        <p className="mt-1 text-slate-500">
          Kelola API key untuk mengaktifkan fitur AI. Kamu memakai key milikmu
          sendiri (BYOK).
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-slate-900">API Key</h2>
        <p className="mt-1 mb-5 text-sm text-slate-500">
          Key disimpan terenkripsi (AES-256-GCM) dan tidak pernah ditampilkan
          kembali secara utuh.
        </p>
        <ApiKeysForm
          openaiMask={safeMask(user.openaiKeyEnc)}
          anthropicMask={safeMask(user.anthropicKeyEnc)}
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-2 font-semibold text-slate-900">Akun</h2>
        <dl className="space-y-1 text-sm">
          <div className="flex gap-2">
            <dt className="w-20 text-slate-500">Nama</dt>
            <dd className="text-slate-800">{user.name ?? "—"}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-20 text-slate-500">Email</dt>
            <dd className="text-slate-800">{user.email}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
