"use client";

import {
  Camera,
  CheckCircle2,
  ImagePlus,
  Loader2,
  MapPin,
  Scan,
  Sparkles,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { StoryModal } from "@/components/StoryModal";
import { ProgressRing } from "@/components/ProgressRing";
import { addLocalDiscovery, getLocalDiscoveries } from "@/lib/discoveries";
import { haversineDistanceMeters, watchPosition } from "@/lib/geo";
import type { Checkpoint, DiscoveryMethod, Site } from "@/types";

interface LensViewProps {
  site: Site;
}

interface NearbyCheckpoint extends Checkpoint {
  distance: number;
}

type LensMode = "camera" | "upload";

export function LensView({ site }: LensViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadPreviewRef = useRef<string | null>(null);

  const [lensMode, setLensMode] = useState<LensMode>("camera");
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [position, setPosition] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [discoveredIds, setDiscoveredIds] = useState<Set<string>>(new Set());
  const [nearby, setNearby] = useState<NearbyCheckpoint[]>([]);
  const [activePopup, setActivePopup] = useState<Checkpoint | null>(null);
  const [storyCheckpoint, setStoryCheckpoint] = useState<Checkpoint | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const announcedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const existing = getLocalDiscoveries(site.slug);
    setDiscoveredIds(new Set(existing.map((d) => d.checkpointId)));
  }, [site.slug]);

  useEffect(() => {
    return watchPosition(
      (pos) => {
        setGeoError(null);
        setPosition({ latitude: pos.latitude, longitude: pos.longitude });
      },
      (message) => setGeoError(message),
    );
  }, []);

  useEffect(() => {
    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("No camera found. Upload a photo to scan instead.");
        setLensMode("upload");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraReady(true);
        }
      } catch {
        setCameraError("Camera unavailable. Upload a photo to scan instead.");
        setLensMode("upload");
      }
    }

    startCamera();

    return () => {
      const stream = videoRef.current?.srcObject as MediaStream | undefined;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    return () => {
      if (uploadPreviewRef.current) {
        URL.revokeObjectURL(uploadPreviewRef.current);
      }
    };
  }, []);

  const markDiscovered = useCallback(
    (checkpoint: Checkpoint, method: DiscoveryMethod) => {
      setDiscoveredIds((prev) => {
        if (prev.has(checkpoint.id)) return prev;
        addLocalDiscovery(site.slug, checkpoint.id, method);
        return new Set([...prev, checkpoint.id]);
      });
    },
    [site.slug],
  );

  useEffect(() => {
    if (!position) return;

    const withDistance = site.checkpoints
      .map((cp) => ({
        ...cp,
        distance: haversineDistanceMeters(
          position.latitude,
          position.longitude,
          cp.latitude,
          cp.longitude,
        ),
      }))
      .filter((cp) => cp.distance <= Math.max(cp.radiusMeters * 3, 120))
      .sort((a, b) => a.distance - b.distance);

    setNearby(withDistance);

    const closestInRange = withDistance.find(
      (cp) => cp.distance <= cp.radiusMeters,
    );

    if (closestInRange && !announcedRef.current.has(closestInRange.id)) {
      announcedRef.current.add(closestInRange.id);
      setActivePopup(closestInRange);
      markDiscovered(closestInRange, "gps");
    }
  }, [position, site.checkpoints, markDiscovered]);

  async function submitScan(blob: Blob) {
    setScanning(true);
    setScanMessage(null);

    const formData = new FormData();
    formData.append("image", blob, "scan.jpg");
    formData.append("siteSlug", site.slug);

    try {
      const response = await fetch("/api/match", {
        method: "POST",
        body: formData,
      });
      const result = (await response.json()) as {
        match?: Checkpoint;
        message?: string;
      };

      if (result.match) {
        setActivePopup(result.match);
        setStoryCheckpoint(result.match);
        markDiscovered(result.match, "photo_match");
        setScanMessage(`Matched: ${result.match.name}`);
      } else {
        setScanMessage(
          result.message ?? "No landmark matched. Try a clearer photo.",
        );
      }
    } catch {
      setScanMessage("Scan failed. Check your connection.");
    } finally {
      setScanning(false);
    }
  }

  async function handleCameraScan() {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85),
    );

    if (!blob) {
      setScanMessage("Could not capture image. Try again.");
      return;
    }

    await submitScan(blob);
  }

  async function handleUploadedScan() {
    if (uploadedFile) {
      await submitScan(uploadedFile);
      return;
    }

    if (!uploadPreview || !canvasRef.current) {
      setScanMessage("Upload a photo first, then tap Scan.");
      return;
    }

    const img = new window.Image();
    img.src = uploadPreview;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Failed to load image"));
    });

    const canvas = canvasRef.current;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(img, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85),
    );

    if (!blob) {
      setScanMessage("Could not read uploaded image.");
      return;
    }

    await submitScan(blob);
  }

  function handleScan() {
    if (lensMode === "camera" && cameraReady) {
      void handleCameraScan();
    } else {
      void handleUploadedScan();
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setScanMessage("Please choose an image file (JPG, PNG, etc.).");
      return;
    }

    if (uploadPreviewRef.current) {
      URL.revokeObjectURL(uploadPreviewRef.current);
    }

    const previewUrl = URL.createObjectURL(file);
    uploadPreviewRef.current = previewUrl;
    setUploadPreview(previewUrl);
    setUploadedFile(file);
    setLensMode("upload");
    setCameraError(null);
    setScanMessage(`Photo ready — tap Scan landmark to identify it.`);
    event.target.value = "";
  }

  function switchToCamera() {
    if (cameraReady) {
      setLensMode("camera");
      setScanMessage(null);
    }
  }

  const discoveredCount = discoveredIds.size;
  const total = site.checkpoints.length;
  const complete = discoveredCount === total && total > 0;
  const canScan =
    lensMode === "camera" ? cameraReady : Boolean(uploadPreview || uploadedFile);
  const showCameraLoader = lensMode === "camera" && !cameraReady && !cameraError;

  return (
    <div className="relative min-h-[100dvh] bg-black">
      {lensMode === "camera" ? (
        <video
          ref={videoRef}
          playsInline
          muted
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : uploadPreview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={uploadPreview}
          alt="Uploaded landmark"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-stone-900 to-stone-800 p-8 text-center">
          <ImagePlus className="h-16 w-16 text-orange-300/80" />
          <p className="max-w-xs text-lg font-medium text-white">
            Upload a photo of a Red Fort landmark to scan it
          </p>
          <p className="max-w-xs text-sm text-stone-400">
            Tip: search &quot;Lahori Gate Red Fort&quot; on Google Images and save a photo to test.
          </p>
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/70" />

      <div className="relative z-10 flex min-h-[100dvh] flex-col">
        <div className="flex items-start justify-between gap-3 p-4">
          <div className="pointer-events-auto rounded-2xl bg-black/45 p-3 backdrop-blur-md">
            <p className="text-xs uppercase tracking-wide text-orange-200">
              Travel Eye Lens
            </p>
            <p className="font-semibold text-white">{site.name}</p>
            {position ? (
              <p className="mt-1 flex items-center gap-1 text-xs text-orange-100/90">
                <MapPin className="h-3 w-3" /> GPS active
              </p>
            ) : (
              <p className="mt-1 text-xs text-orange-200/80">
                GPS off (OK for photo scan)
              </p>
            )}
          </div>
          <div className="pointer-events-auto rounded-full bg-black/45 p-1 backdrop-blur-md">
            <ProgressRing discovered={discoveredCount} total={total} size={72} />
          </div>
        </div>

        <div className="relative flex-1">
          {nearby.map((cp, index) => {
            const isDiscovered = discoveredIds.has(cp.id);
            const top = 28 + (index % 4) * 14;
            const left = 12 + (index % 3) * 28;
            return (
              <button
                key={cp.id}
                type="button"
                style={{ top: `${top}%`, left: `${left}%` }}
                className={`pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 ${
                  isDiscovered ? "" : "lens-marker-pulse"
                }`}
                onClick={() => {
                  setStoryCheckpoint(cp);
                  markDiscovered(cp, isDiscovered ? "manual" : "gps");
                }}
              >
                <span
                  className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold shadow-lg ${
                    isDiscovered
                      ? "bg-emerald-500/90 text-white"
                      : "bg-orange-500/95 text-white"
                  }`}
                >
                  {isDiscovered ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  {cp.name}
                </span>
              </button>
            );
          })}
        </div>

        {activePopup && !storyCheckpoint && (
          <div className="pointer-events-auto mx-4 mb-3 rounded-2xl border border-orange-300/40 bg-black/55 p-4 backdrop-blur-md">
            <p className="text-xs uppercase tracking-wide text-orange-200">
              Nearby discovery
            </p>
            <p className="text-lg font-bold text-white">{activePopup.name}</p>
            <p className="mt-1 text-sm text-orange-50/90">
              {activePopup.shortDescription}
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setStoryCheckpoint(activePopup)}
                className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white"
              >
                Tap for story
              </button>
              <button
                type="button"
                onClick={() => setActivePopup(null)}
                className="rounded-xl border border-white/20 px-4 py-2.5 text-sm text-white"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {complete && (
          <div className="pointer-events-auto mx-4 mb-3 rounded-2xl bg-emerald-600/90 p-4 text-center text-white backdrop-blur-md">
            <p className="text-lg font-bold">Explorer achievement unlocked!</p>
            <p className="text-sm opacity-90">
              You discovered all {total} checkpoints at {site.name}.
            </p>
          </div>
        )}

        <div className="pointer-events-auto space-y-3 p-4 pb-6">
          {cameraError && lensMode === "upload" && (
            <div className="rounded-xl bg-amber-900/70 p-3 text-sm text-amber-50">
              {cameraError}
            </div>
          )}

          {geoError && (
            <div className="rounded-xl bg-stone-800/80 p-3 text-sm text-stone-200">
              {geoError}
            </div>
          )}

          {scanMessage && (
            <div className="rounded-xl bg-black/50 p-3 text-center text-sm text-orange-100">
              {scanMessage}
            </div>
          )}

          <div className="flex gap-2">
            {cameraReady && (
              <button
                type="button"
                onClick={switchToCamera}
                className={`flex items-center justify-center gap-1.5 rounded-2xl px-4 py-3 text-sm font-medium ${
                  lensMode === "camera"
                    ? "bg-white text-primary"
                    : "border border-white/25 bg-black/40 text-white"
                }`}
              >
                <Camera className="h-4 w-4" />
                Camera
              </button>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-2xl py-3 text-sm font-medium ${
                lensMode === "upload"
                  ? "bg-white text-primary"
                  : "border border-white/25 bg-black/40 text-white"
              }`}
            >
              <Upload className="h-4 w-4" />
              Upload photo
            </button>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleScan}
              disabled={!canScan || scanning}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-accent py-4 font-semibold text-white disabled:opacity-50"
            >
              {scanning ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Scan className="h-5 w-5" />
              )}
              {scanning ? "Scanning…" : "Scan landmark"}
            </button>
            <Link
              href={`/explore/${site.slug}`}
              className="flex items-center justify-center rounded-2xl border border-white/25 bg-black/40 px-5 text-sm font-medium text-white backdrop-blur-sm"
            >
              Map
            </Link>
          </div>

          <p className="text-center text-xs text-white/70">
            {lensMode === "upload"
              ? "Upload a monument photo, then tap Scan landmark."
              : "Walk near checkpoints for popups, or point your lens and tap Scan."}
          </p>
        </div>
      </div>

      {showCameraLoader && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80">
          <div className="flex flex-col items-center gap-3 text-white">
            <Camera className="h-10 w-10 animate-pulse" />
            <p>Starting camera…</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 flex items-center gap-2 rounded-xl border border-white/30 px-4 py-2 text-sm"
            >
              <Upload className="h-4 w-4" />
              Or upload a photo
            </button>
          </div>
        </div>
      )}

      {storyCheckpoint && (
        <StoryModal
          checkpoint={storyCheckpoint}
          onClose={() => setStoryCheckpoint(null)}
        />
      )}
    </div>
  );
}
