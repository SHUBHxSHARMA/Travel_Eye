"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { getExplorerName, setExplorerName } from "@/lib/explorer";

export default function StartPage() {
  const router = useRouter();
  const [name, setName] = useState("");

  useEffect(() => {
    const saved = getExplorerName();
    if (saved) setName(saved);
  }, []);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setExplorerName(name);
    router.push("/explore/red-fort");
  }

  function handleSkip() {
    setExplorerName("Explorer");
    router.push("/explore/red-fort");
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-3xl font-bold">Start exploring</h1>
      <p className="mt-2 text-muted">
        No email needed. Pick a name and your progress saves on this device.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <label className="block">
          <span className="text-sm font-medium">Your explorer name</span>
          <input
            type="text"
            required
            maxLength={30}
            placeholder="e.g. Rahul, AdventureSeeker"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-orange-200 bg-surface px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
          />
        </label>
        <button
          type="submit"
          className="w-full rounded-2xl bg-primary py-3 font-semibold text-white hover:bg-primary-dark"
        >
          Let&apos;s go
        </button>
      </form>

      <button
        type="button"
        onClick={handleSkip}
        className="mt-4 w-full rounded-2xl border border-orange-200 py-3 text-sm font-medium text-muted hover:border-primary hover:text-primary"
      >
        Skip — explore as Guest
      </button>

      <p className="mt-6 text-center text-sm text-muted">
        Already started?{" "}
        <Link href="/explore/red-fort" className="font-medium text-primary hover:underline">
          Continue to Red Fort
        </Link>
      </p>
    </div>
  );
}
