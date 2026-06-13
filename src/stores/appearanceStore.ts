import type { CSSProperties } from "react";
import { create } from "zustand";
import { loadSettings, saveSetting } from "../lib/queries";
import { gradientById, DEFAULT_BACKGROUND_ID } from "../lib/backgrounds";
import { importImage, listUserImages, removeUserImage, type UserImage } from "../lib/media";

export type ThemeChoice = "light" | "dark" | "system";

interface AppearanceState {
  /** Gradient id, "solid", or "user:<mediaId>". */
  backgroundId: string;
  solidColor: string;
  dimPct: number; // 0–80 (FR-B3)
  blurPx: number; // 0–20 (FR-B3)
  theme: ThemeChoice;
  accentFollowsMode: boolean; // FR-C4
  userImages: UserImage[];
  hydrated: boolean;

  hydrate: () => Promise<void>;
  setBackground: (id: string) => void;
  setSolidColor: (hex: string) => void;
  setDim: (pct: number) => void;
  setBlur: (px: number) => void;
  setTheme: (t: ThemeChoice) => void;
  setAccentFollowsMode: (v: boolean) => void;
  addUserImage: (file: File) => Promise<void>;
  removeImage: (img: UserImage) => Promise<void>;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export const useAppearance = create<AppearanceState>((set) => ({
  backgroundId: DEFAULT_BACKGROUND_ID,
  solidColor: "#0c1310",
  dimPct: 0,
  blurPx: 0,
  theme: "system",
  accentFollowsMode: false,
  userImages: [],
  hydrated: false,

  hydrate: async () => {
    try {
      const s = await loadSettings();
      const images = await listUserImages();
      set({
        backgroundId: (s.backgroundId as string) ?? DEFAULT_BACKGROUND_ID,
        solidColor: (s.solidColor as string) ?? "#0c1310",
        dimPct: typeof s.dimPct === "number" ? s.dimPct : 0,
        blurPx: typeof s.blurPx === "number" ? s.blurPx : 0,
        theme: (s.theme as ThemeChoice) ?? "system",
        accentFollowsMode: Boolean(s.accentFollowsMode),
        userImages: images,
        hydrated: true,
      });
    } catch {
      set({ hydrated: true });
    }
  },

  setBackground: (id) => {
    set({ backgroundId: id });
    void saveSetting("backgroundId", id);
  },
  setSolidColor: (hex) => {
    set({ solidColor: hex, backgroundId: "solid" });
    void saveSetting("solidColor", hex);
    void saveSetting("backgroundId", "solid");
  },
  setDim: (pct) => {
    const v = clamp(Math.round(pct), 0, 80);
    set({ dimPct: v });
    void saveSetting("dimPct", v);
  },
  setBlur: (px) => {
    const v = clamp(Math.round(px), 0, 20);
    set({ blurPx: v });
    void saveSetting("blurPx", v);
  },
  setTheme: (t) => {
    set({ theme: t });
    void saveSetting("theme", t);
  },
  setAccentFollowsMode: (v) => {
    set({ accentFollowsMode: v });
    void saveSetting("accentFollowsMode", v);
  },

  addUserImage: async (file) => {
    const img = await importImage(file);
    set((st) => ({ userImages: [...st.userImages, img], backgroundId: `user:${img.id}` }));
    void saveSetting("backgroundId", `user:${img.id}`);
  },

  removeImage: async (img) => {
    await removeUserImage(img);
    set((st) => {
      const userImages = st.userImages.filter((u) => u.id !== img.id);
      const fallback =
        st.backgroundId === `user:${img.id}` ? DEFAULT_BACKGROUND_ID : st.backgroundId;
      if (fallback !== st.backgroundId) void saveSetting("backgroundId", fallback);
      return { userImages, backgroundId: fallback };
    });
  },
}));

/** CSS for the wallpaper layer given the current appearance state. */
export function wallpaperStyle(s: AppearanceState): CSSProperties {
  if (s.backgroundId === "solid") return { background: s.solidColor };
  if (s.backgroundId.startsWith("user:")) {
    const id = Number(s.backgroundId.slice(5));
    const img = s.userImages.find((u) => u.id === id);
    if (img) {
      return { backgroundImage: `url("${img.src}")`, backgroundSize: "cover", backgroundPosition: "center" };
    }
  }
  const g = gradientById(s.backgroundId) ?? gradientById(DEFAULT_BACKGROUND_ID)!;
  return { background: g.css };
}
