import Link from "next/link";
import Image from "next/image";
import { Camera, MapPin, Trophy, Users } from "lucide-react";
import { RED_FORT } from "@/lib/data/red-fort";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-lg px-4 pb-12">
      <section className="relative mt-4 overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary-dark p-6 text-white shadow-xl">
        <div className="relative z-10">
          <p className="text-sm font-medium uppercase tracking-widest text-orange-100">
            Your adventure guide
          </p>
          <h1 className="mt-2 text-4xl font-bold leading-tight">Travel Eye</h1>
          <p className="mt-3 max-w-sm text-orange-50/95">
            Point your lens at historic monuments. Discover stories, track checkpoints,
            and feel the thrill of exploration.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/start"
              className="rounded-2xl bg-white px-5 py-3 font-semibold text-primary shadow-md hover:bg-orange-50"
            >
              Start exploring
            </Link>
            <Link
              href="/explore/red-fort"
              className="rounded-2xl border border-white/40 px-5 py-3 font-semibold text-white hover:bg-white/10"
            >
              Preview Red Fort
            </Link>
          </div>
        </div>
        <div className="absolute -right-6 -top-6 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      </section>

      <section className="mt-8 grid grid-cols-2 gap-3">
        {[
          { icon: Camera, label: "Live lens", text: "Camera + landmark scan" },
          { icon: MapPin, label: "GPS checkpoints", text: "Popups when you're close" },
          { icon: Trophy, label: "Progress", text: "Track discoveries" },
          { icon: Users, label: "Your name", text: "No email — saves on device" },
        ].map(({ icon: Icon, label, text }) => (
          <div
            key={label}
            className="rounded-2xl border border-orange-100 bg-surface p-4 shadow-sm"
          >
            <Icon className="h-6 w-6 text-accent" />
            <p className="mt-2 font-semibold">{label}</p>
            <p className="text-xs text-muted">{text}</p>
          </div>
        ))}
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold">Featured site</h2>
        <p className="text-sm text-muted">MVP launch — more monuments coming soon</p>
        <Link
          href="/explore/red-fort"
          className="mt-4 block overflow-hidden rounded-3xl border border-orange-100 bg-surface shadow-md transition hover:shadow-lg"
        >
          <div className="relative h-44">
            <Image
              src={RED_FORT.coverImage}
              alt={RED_FORT.name}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">
              {RED_FORT.city}, {RED_FORT.country}
            </p>
            <h3 className="text-lg font-bold">{RED_FORT.name}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-muted">{RED_FORT.description}</p>
            <p className="mt-3 text-sm font-medium text-primary">
              {RED_FORT.checkpoints.length} checkpoints to discover →
            </p>
          </div>
        </Link>
      </section>
    </div>
  );
}
