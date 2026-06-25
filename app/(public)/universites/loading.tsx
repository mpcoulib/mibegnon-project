export default function Loading() {
  return (
    <div className="flex flex-col">
      <section className="bg-[var(--primary)] px-6 py-14 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="h-3 w-28 rounded bg-white/20" />
          <div className="mt-3 h-9 w-72 rounded bg-white/20" />
          <div className="mt-3 h-4 w-40 rounded bg-white/15" />
        </div>
      </section>
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="h-24 rounded-xl bg-slate-100 animate-pulse" />
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-56 rounded-2xl border border-slate-200 bg-slate-100 animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
