export default function Loading() {
  return (
    <div className="flex flex-col h-screen bg-[#08080f]">
      <div className="h-14 border-b border-white/7 bg-[#08080f]/90 flex items-center px-4 gap-3">
        <div className="h-8 w-8 rounded-full bg-white/5 animate-pulse" />
        <div className="h-4 w-24 rounded-lg bg-white/5 animate-pulse" />
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-2xl">🗺️</div>
        </div>
        <p className="text-sm text-slate-500 font-medium">Loading map…</p>
      </div>
    </div>
  );
}
