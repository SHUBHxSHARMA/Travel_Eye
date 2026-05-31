import { NextResponse } from "next/server";
import {
  combinedDistance,
  combinedHash,
  isMatch,
  loadReferenceImage,
} from "@/lib/image-hash";
import { getSiteBySlug } from "@/lib/data/red-fort";

export async function POST(request: Request) {
  const formData = await request.formData();
  const image = formData.get("image");
  const siteSlug = formData.get("siteSlug");

  if (!(image instanceof Blob) || typeof siteSlug !== "string") {
    return NextResponse.json({ message: "Invalid scan request." }, { status: 400 });
  }

  const site = getSiteBySlug(siteSlug);
  if (!site) {
    return NextResponse.json({ message: "Site not found." }, { status: 404 });
  }

  const captureBuffer = Buffer.from(await image.arrayBuffer());
  const captureHashes = await combinedHash(captureBuffer);

  const perCheckpoint: {
    checkpoint: (typeof site.checkpoints)[number];
    distance: number;
  }[] = [];
  let loadedReferences = 0;

  for (const checkpoint of site.checkpoints) {
    const sources = checkpoint.referenceImageUrls ?? [
      checkpoint.referenceImageUrl,
    ];
    let bestForCheckpoint = Number.POSITIVE_INFINITY;

    for (const source of sources) {
      if (!source) continue;
      try {
        const referenceBuffer = await loadReferenceImage(source);
        const referenceHashes = await combinedHash(referenceBuffer);
        const distance = combinedDistance(captureHashes, referenceHashes);
        loadedReferences += 1;
        bestForCheckpoint = Math.min(bestForCheckpoint, distance);
      } catch {
        // Skip broken reference images.
      }
    }

    if (bestForCheckpoint < Number.POSITIVE_INFINITY) {
      perCheckpoint.push({ checkpoint, distance: bestForCheckpoint });
    }
  }

  if (loadedReferences === 0) {
    return NextResponse.json({
      message: "Reference images could not be loaded. Please try again later.",
    });
  }

  perCheckpoint.sort((a, b) => a.distance - b.distance);
  const best = perCheckpoint[0];
  const second = perCheckpoint[1];
  const margin = second ? second.distance - best.distance : Number.POSITIVE_INFINITY;

  if (!best || !isMatch(best.distance) || margin < 40) {
    return NextResponse.json({
      message:
        "No matching landmark found. Try a clearer photo, or pick a checkpoint from the map.",
      bestMatch: best?.checkpoint.name,
      bestDistance: best?.distance,
      margin,
    });
  }

  return NextResponse.json({
    match: best.checkpoint,
    confidence: Math.max(0, 1 - best.distance / 950),
    bestDistance: best.distance,
    margin,
  });
}
