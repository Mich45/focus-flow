import type { AmbientTone } from "./audio";

/**
 * Bundled ambient tracks (FR-A1) — real Pixabay audio in /public/sounds/, served
 * at the webview root in dev and prod. A track plays its `src` file; `tone`
 * (synthesized) remains supported as a fallback for any file-less track.
 * Attribution lives in the README.
 */
export interface BundledTrack {
  id: string;
  name: string;
  artist: string;
  hue: number; // for the gradient swatch
  tone?: AmbientTone; // synthesized fallback
  src?: string; // public path to a bundled audio file (preferred when set)
}

export const BUNDLED_TRACKS: BundledTrack[] = [
  { id: "light-rain", name: "Light Rain Ambient", artist: "Mikhail", hue: 208, src: "/sounds/light-rain.mp3" },
  { id: "cosmic-ambient", name: "Cosmic Ambient", artist: "Alex Wit", hue: 268, src: "/sounds/cosmic-ambient.mp3" },
  { id: "heavenly-energy", name: "Heavenly Energy", artist: "Alex Wit", hue: 196, src: "/sounds/heavenly-energy.mp3" },
  { id: "ambient-occlusion", name: "Ambient Occlusion", artist: "Wilson Marumura", hue: 148, src: "/sounds/ambient-occlusion.mp3" },
  { id: "deep-meditation", name: "Deep Meditation", artist: "Roman Dudchyk", hue: 30, src: "/sounds/deep-meditation.mp3" },
  { id: "ambient-background", name: "Ambient Background", artist: "Tunetank", hue: 174, src: "/sounds/ambient-background.mp3" },
];

export const toneGradient = (hue: number) =>
  `linear-gradient(135deg,hsl(${hue},42%,46%),hsl(${(hue + 30) % 360},38%,30%))`;
