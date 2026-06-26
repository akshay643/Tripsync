export default function Loading() {
  return (
    <div className="min-h-screen bg-[#08080f] p-4 space-y-4">
      {/* Progress card skeleton */}
      <div className="rounded-2xl bg-[#0f0f1e] border border-white/7 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="space-y-2">
            <div className="h-3 w-28 rounded-full bg-white/5 animate-pulse" />
            <div className="h-7 w-16 rounded-full bg-white/5 animate-pulse" />
          </div>
          <div className="h-14 w-14 rounded-full bg-white/5 animate-pulse" />
        </div>
        <div className="h-1.5 bg-white/5 rounded-full" />
      </div>
      {/* Filter tabs */}
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex-1 h-9 rounded-xl bg-white/5 animate-pulse" />
        ))}
      </div>
      {/* Category groups */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-2xl bg-[#0f0f1e] border border-white/7 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="h-7 w-7 rounded-xl bg-white/5 animate-pulse" />
            <div className="flex-1 h-4 rounded-full bg-white/5 animate-pulse" />
            <div className="h-5 w-10 rounded-full bg-white/5 animate-pulse" />
          </div>
          <div className="border-t border-white/5 divide-y divide-white/4">
            {[1, 2].map((j) => (
              <div key={j} className="flex items-center gap-3 px-4 py-3">
                <div className="h-6 w-6 rounded-lg bg-white/5 animate-pulse shrink-0" />
                <div className="flex-1 h-4 rounded-full bg-white/5 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
