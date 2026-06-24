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
        "sticky top-0 z-40 flex items-center gap-3 border-b border-gray-100 bg-white/95 backdrop-blur-md px-4 h-14",
        className
      )}
    >
      {backHref && (
        <Link href={backHref} className="flex items-center justify-center h-8 w-8 -ml-1 rounded-full hover:bg-gray-100">
          <ChevronLeft className="h-5 w-5 text-gray-700" />
        </Link>
      )}
      <h1 className="flex-1 text-base font-semibold text-gray-900 truncate">{title}</h1>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </header>
  );
}
