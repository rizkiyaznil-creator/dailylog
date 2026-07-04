import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { RegisterForm } from "./register-form";

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-1 text-lg font-semibold text-slate-900">Daftar</h2>
      <p className="mb-5 text-sm text-slate-500">
        Buat akun untuk mulai mencatat aktivitas harianmu.
      </p>
      <RegisterForm />
      <p className="mt-5 text-center text-sm text-slate-500">
        Sudah punya akun?{" "}
        <Link
          href="/login"
          className="font-medium text-indigo-600 hover:text-indigo-500"
        >
          Masuk
        </Link>
      </p>
    </div>
  );
}
