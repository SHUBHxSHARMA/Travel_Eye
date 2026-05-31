"use client";

import Image from "next/image";
import Link from "next/link";
import { Camera, CheckCircle2, Circle } from "lucide-react";
import { useEffect, useState } from "react";
import { ProgressRing } from "@/components/ProgressRing";
import { StoryModal } from "@/components/StoryModal";
import { getLocalDiscoveries } from "@/lib/discoveries";
import { getSiteBySlug } from "@/lib/data/red-fort";
import type { Checkpoint } from "@/types";

interface ExplorePageProps {
  params: Promise<{ slug: string }>;
}

export default function ExplorePage({ params }: ExplorePageProps) {
  const [slug, setSlug] = useState<string | null>(null);
  const [discoveredIds, setDiscoveredIds] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Checkpoint | null>(null);

  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  const site = slug ? getSiteBySlug(slug) : undefined;

  useEffect(() => {
    if (!slug) return;
    const discoveries = getLocalDiscoveries(slug);
    setDiscoveredIds(new Set(discoveries.map((d) => d.checkpointId)));
  }, [slug]);

  if (slug && !site) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Site not found</h1>
        <Link href="/" className="mt-4 inline-block text-primary">
          Back to home
        </Link>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted">
        Loading…
      </div>
    );
  }

  const discoveredCount = discoveredIds.size;
  const total = site.checkpoints.length;

  return (
    <div className="mx-auto max-w-lg px-4 pb-12">
      <div className="relative mt-4 h-52 overflow-hidden rounded-3xl">
        <Image
          src={site.coverImage}
          alt={site.name}
          fill
          className="object-cover"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <p className="text-xs uppercase tracking-wide text-orange-200">
            {site.city}, {site.country}
          </p>
          <h1 className="text-2xl font-bold">{site.name}</h1>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-4 rounded-2xl border border-orange-100 bg-surface p-4 shadow-sm">
        <ProgressRing discovered={discoveredCount} total={total} />
        <div>
          <p className="font-semibold">
            {discoveredCount} of {total} discovered
          </p>
          <p className="text-sm text-muted">
            {discoveredCount === total
              ? "Amazing — you completed this site!"
              : `${total - discoveredCount} checkpoints left to explore`}
          </p>
        </div>
      </div>

      <Link
        href={`/explore/${site.slug}/lens`}
        className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-lg font-semibold text-white shadow-lg hover:bg-primary-dark"
      >
        <Camera className="h-6 w-6" />
        Open Travel Eye Lens
      </Link>

      <p className="mt-2 text-center text-xs text-muted">
        Best on your phone at the monument. Allow camera & location.
      </p>

      <section className="mt-10">
        <h2 className="text-lg font-bold">Checkpoints</h2>
        <ul className="mt-4 space-y-3">
          {site.checkpoints.map((cp) => {
            const done = discoveredIds.has(cp.id);
            return (
              <li key={cp.id}>
                <button
                  type="button"
                  onClick={() => setSelected(cp)}
                  className="flex w-full items-start gap-3 rounded-2xl border border-orange-100 bg-surface p-4 text-left shadow-sm transition hover:border-orange-200"
                >
                  {done ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  ) : (
                    <Circle className="mt-0.5 h-5 w-5 shrink-0 text-orange-300" />
                  )}
                  <div>
                    <p className="font-semibold">{cp.name}</p>
                    <p className="text-xs uppercase text-accent">{cp.category}</p>
                    <p className="mt-1 text-sm text-muted line-clamp-2">
                      {cp.shortDescription}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {selected && (
        <StoryModal checkpoint={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
