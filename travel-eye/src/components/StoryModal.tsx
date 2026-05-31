"use client";

import { Volume2, VolumeX, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { Checkpoint } from "@/types";

interface StoryModalProps {
  checkpoint: Checkpoint;
  onClose: () => void;
}

export function StoryModal({ checkpoint, onClose }: StoryModalProps) {
  const [speaking, setSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  function toggleAudio() {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    if (!("speechSynthesis" in window)) {
      alert("Audio is not supported in this browser.");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(
      `${checkpoint.name}. ${checkpoint.story}`,
    );
    utterance.lang = "en-IN";
    utterance.rate = 0.95;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div className="max-h-[85vh] w-full max-w-lg overflow-hidden rounded-3xl bg-surface shadow-2xl">
        <div className="relative h-44 w-full bg-orange-100">
          <Image
            src={checkpoint.referenceImageUrl}
            alt={checkpoint.name}
            fill
            className="object-cover"
            unoptimized
          />
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 rounded-full bg-black/40 p-2 text-white backdrop-blur-sm"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4 p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">
              {checkpoint.category}
            </p>
            <h2 className="text-2xl font-bold text-foreground">{checkpoint.name}</h2>
            <p className="mt-1 text-sm text-muted">{checkpoint.shortDescription}</p>
          </div>
          <p className="max-h-48 overflow-y-auto text-sm leading-relaxed text-foreground/90">
            {checkpoint.story}
          </p>
          <button
            type="button"
            onClick={toggleAudio}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3 font-medium text-white hover:bg-primary-dark"
          >
            {speaking ? (
              <>
                <VolumeX className="h-5 w-5" /> Stop audio guide
              </>
            ) : (
              <>
                <Volume2 className="h-5 w-5" /> Listen to story
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
