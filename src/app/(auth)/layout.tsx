export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-2xl">
            📔
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            DailyLog
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Catatan harian jadi laporan mingguan
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
