import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-1 text-lg font-semibold text-slate-900">Masuk</h2>
      <p className="mb-5 text-sm text-slate-500">
        Selamat datang kembali. Silakan masuk ke akunmu.
      </p>
      <LoginForm />
      <p className="mt-5 text-center text-sm text-slate-500">
        Belum punya akun?{" "}
        <Link
          href="/register"
          className="font-medium text-indigo-600 hover:text-indigo-500"
        >
          Daftar
        </Link>
      </p>
    </div>
  );
}
