export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <div className="h-8 w-56 rounded bg-slate-200 animate-pulse" />
      <div className="mt-3 h-4 w-72 rounded bg-slate-100 animate-pulse" />
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-40 rounded-2xl border border-slate-200 bg-slate-100 animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
