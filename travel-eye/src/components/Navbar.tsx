"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, User } from "lucide-react";
import { useEffect, useState } from "react";
import { getExplorerName } from "@/lib/explorer";

export function Navbar() {
  const pathname = usePathname();
  const [explorerName, setExplorerName] = useState<string | null>(null);

  useEffect(() => {
    setExplorerName(getExplorerName());
  }, [pathname]);

  const hideOnLens = pathname.includes("/lens");

  if (hideOnLens) return null;

  return (
    <header className="sticky top-0 z-50 border-b border-orange-100/80 bg-[#fff8f0]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold text-primary">
          <Compass className="h-6 w-6 text-accent" />
          <span>Travel Eye</span>
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          {explorerName ? (
            <span className="flex items-center gap-1 rounded-full border border-orange-200 px-3 py-1.5 text-muted">
              <User className="h-4 w-4" />
              {explorerName}
            </span>
          ) : (
            <Link
              href="/start"
              className="rounded-full bg-primary px-3 py-1.5 font-medium text-white hover:bg-primary-dark"
            >
              Start
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
