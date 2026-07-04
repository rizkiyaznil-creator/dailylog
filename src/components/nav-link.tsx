"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={
        "shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors " +
        (active
          ? "bg-indigo-50 text-indigo-700"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900")
      }
    >
      {children}
    </Link>
  );
}
