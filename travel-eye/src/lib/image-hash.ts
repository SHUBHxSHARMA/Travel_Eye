import sharp from "sharp";
import { readFile } from "fs/promises";
import path from "path";

function createSharpInstance(imageBuffer: Buffer) {
  return sharp(imageBuffer, { failOn: "none" });
}

export async function averageHash(imageBuffer: Buffer): Promise<string> {
  const { data } = await createSharpInstance(imageBuffer)
    .greyscale()
    .resize(32, 32, { fit: "cover" })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = [...data];
  const avg = pixels.reduce((sum, value) => sum + value, 0) / pixels.length;
  return pixels.map((value) => (value >= avg ? "1" : "0")).join("");
}

export async function differenceHash(imageBuffer: Buffer): Promise<string> {
  const { data, info } = await createSharpInstance(imageBuffer)
    .greyscale()
    .resize(33, 32, { fit: "cover" })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  let hash = "";
  for (let y = 0; y < 32; y += 1) {
    for (let x = 0; x < 31; x += 1) {
      const left = data[y * width + x];
      const right = data[y * width + x + 1];
      hash += left > right ? "1" : "0";
    }
  }
  return hash;
}

export async function combinedHash(imageBuffer: Buffer): Promise<{
  average: string;
  difference: string;
}> {
  const [average, difference] = await Promise.all([
    averageHash(imageBuffer),
    differenceHash(imageBuffer),
  ]);
  return { average, difference };
}

export function hammingDistance(hashA: string, hashB: string): number {
  const length = Math.min(hashA.length, hashB.length);
  let distance = 0;
  for (let i = 0; i < length; i += 1) {
    if (hashA[i] !== hashB[i]) distance += 1;
  }
  return distance;
}

export function combinedDistance(
  capture: { average: string; difference: string },
  reference: { average: string; difference: string },
): number {
  return (
    hammingDistance(capture.average, reference.average) +
    hammingDistance(capture.difference, reference.difference)
  );
}

export async function loadReferenceImage(source: string): Promise<Buffer> {
  if (source.startsWith("/")) {
    const filePath = path.join(process.cwd(), "public", source.replace(/^\//, ""));
    return readFile(filePath);
  }

  const response = await fetch(source);
  if (!response.ok) {
    throw new Error(`Failed to fetch reference image: ${source} (${response.status})`);
  }
  return Buffer.from(await response.arrayBuffer());
}

/** Combined aHash + dHash; lower is better. Typical match: under ~900. */
export const MATCH_THRESHOLD = 950;

export function isMatch(distance: number): boolean {
  return distance <= MATCH_THRESHOLD;
}
