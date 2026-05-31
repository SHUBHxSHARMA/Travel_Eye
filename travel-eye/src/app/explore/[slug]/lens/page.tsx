"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LensView } from "@/components/LensView";
import { getSiteBySlug } from "@/lib/data/red-fort";

interface LensPageProps {
  params: Promise<{ slug: string }>;
}

export default function LensPage({ params }: LensPageProps) {
  const [slug, setSlug] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  const site = slug ? getSiteBySlug(slug) : undefined;

  if (slug && !site) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black p-6 text-center text-white">
        <p className="text-xl font-bold">Site not found</p>
        <Link href="/" className="mt-4 text-orange-300">
          Back to home
        </Link>
      </div>
    );
  }

  if (!site) {
    return <div className="min-h-screen bg-black" />;
  }

  return <LensView site={site} />;
}
