import type { Discovery, DiscoveryMethod } from "@/types";

const STORAGE_KEY = "travel-eye-discoveries";

function readAll(): Record<string, Discovery[]> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Record<
      string,
      Discovery[]
    >;
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, Discovery[]>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getLocalDiscoveries(siteSlug: string): Discovery[] {
  return readAll()[siteSlug] ?? [];
}

export function addLocalDiscovery(
  siteSlug: string,
  checkpointId: string,
  method: DiscoveryMethod,
): Discovery[] {
  const all = readAll();
  const existing = all[siteSlug] ?? [];
  if (existing.some((d) => d.checkpointId === checkpointId)) {
    return existing;
  }
  const updated = [
    ...existing,
    { checkpointId, method, discoveredAt: new Date().toISOString() },
  ];
  all[siteSlug] = updated;
  writeAll(all);
  return updated;
}

export function isDiscoveredLocally(
  siteSlug: string,
  checkpointId: string,
): boolean {
  return getLocalDiscoveries(siteSlug).some(
    (d) => d.checkpointId === checkpointId,
  );
}
