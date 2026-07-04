import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { NavLink } from "@/components/nav-link";
import { SignOutButton } from "@/components/sign-out-button";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-xl">📔</span>
              <span className="font-bold tracking-tight text-slate-900">
                DailyLog
              </span>
            </Link>
            <nav className="flex items-center gap-1">
              <NavLink href="/dashboard">Beranda</NavLink>
              <NavLink href="/logs">Catatan</NavLink>
              <NavLink href="/reports">Laporan</NavLink>
              <NavLink href="/settings">Pengaturan</NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-500 sm:inline">
              {session.user.name ?? session.user.email}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
    </div>
  );
}
