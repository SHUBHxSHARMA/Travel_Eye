const EXPLORER_KEY = "travel-eye-explorer";

export function getExplorerName(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(EXPLORER_KEY);
}

export function setExplorerName(name: string): void {
  localStorage.setItem(EXPLORER_KEY, name.trim());
}

export function clearExplorerName(): void {
  localStorage.removeItem(EXPLORER_KEY);
}
