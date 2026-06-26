import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface TopBarProps {
  title: string;
  backHref?: string;
  right?: React.ReactNode;
  className?: string;
}

export function TopBar({ title, backHref, right, className }: TopBarProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex items-center gap-3 h-14 px-4",
        "border-b border-white/[0.07] bg-[#08080f]/90 backdrop-blur-2xl",
        className
      )}
    >
      {backHref && (
        <Link
          href={backHref}
          className="flex items-center justify-center h-8 w-8 -ml-1 rounded-full bg-white/6 hover:bg-white/10 transition-colors"
        >
          <ChevronLeft className="h-5 w-5 text-slate-300" />
        </Link>
      )}
      <h1 className="flex-1 text-base font-semibold text-white truncate">{title}</h1>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </header>
  );
}
