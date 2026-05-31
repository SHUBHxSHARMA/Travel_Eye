"use client";

interface ProgressRingProps {
  discovered: number;
  total: number;
  size?: number;
}

export function ProgressRing({
  discovered,
  total,
  size = 88,
}: ProgressRingProps) {
  const pct = total === 0 ? 0 : (discovered / total) * 100;
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#fed7aa"
          strokeWidth="8"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#ea580c"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-lg font-bold leading-none text-primary">{discovered}</p>
        <p className="text-[10px] uppercase tracking-wide text-muted">of {total}</p>
      </div>
    </div>
  );
}
