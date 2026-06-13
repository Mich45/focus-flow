import { create } from "zustand";
import { loadSettings, saveSetting } from "../lib/queries";
import { importMedia, listUserMedia, renameUserMedia, removeUserMedia, type UserMedia } from "../lib/media";
import { audioEngine, type ChimeId } from "../lib/audio";
import { BUNDLED_TRACKS } from "../lib/tracks";

export type PlaybackMode = "focus" | "always" | "manual";

interface AudioState {
  currentTrackId: string; // bundled id or "user:<mediaId>"
  playing: boolean; // user intent; gated by playbackMode + timer in the engine
  ambientVolume: number; // 0–1
  chimeId: ChimeId;
  chimeVolume: number; // 0–1
  playbackMode: PlaybackMode;
  muteAll: boolean; 
  loop: boolean; // replay file tracks when they end
  userTracks: UserMedia[];
  hydrated: boolean;

  hydrate: () => Promise<void>;
  selectTrack: (id: string) => void;
  next: () => void;
  togglePlay: () => void;
  setPlaying: (v: boolean) => void;
  setAmbientVolume: (v: number) => void;
  setChime: (id: ChimeId) => void;
  setChimeVolume: (v: number) => void;
  setPlaybackMode: (m: PlaybackMode) => void;
  toggleMute: () => void;
  toggleLoop: () => void;
  importTrack: (file: File) => Promise<void>;
  renameTrack: (id: number, name: string) => Promise<void>;
  removeTrack: (item: UserMedia) => Promise<void>;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export const useAudio = create<AudioState>((set, get) => ({
  currentTrackId: "light-rain",
  playing: false,
  ambientVolume: 0.5,
  chimeId: "soft",
  chimeVolume: 0.6,
  playbackMode: "focus",
  muteAll: false,
  loop: true,
  userTracks: [],
  hydrated: false,

  hydrate: async () => {
    try {
      const s = await loadSettings();
      const userTracks = await listUserMedia("audio");
      set({
        currentTrackId: (s.ambientTrackId as string) ?? "light-rain",
        ambientVolume: typeof s.ambientVolume === "number" ? s.ambientVolume : 0.5,
        chimeId: (s.chimeId as ChimeId) ?? "soft",
        chimeVolume: typeof s.chimeVolume === "number" ? s.chimeVolume : 0.6,
        playbackMode: (s.playbackMode as PlaybackMode) ?? "focus",
        muteAll: Boolean(s.muteAll),
        loop: s.loop === undefined ? true : Boolean(s.loop),
        userTracks,
        hydrated: true,
      });
      audioEngine.setLoop(s.loop === undefined ? true : Boolean(s.loop));
    } catch {
      set({ hydrated: true });
    }
  },

  selectTrack: (id) => {
    audioEngine.ensure(); // called from a user gesture → satisfies autoplay policy
    set({ currentTrackId: id, playing: true });
    void saveSetting("ambientTrackId", id);
  },
  next: () => {
    const ids = [...BUNDLED_TRACKS.map((t) => t.id), ...get().userTracks.map((t) => `user:${t.id}`)];
    if (ids.length === 0) return;
    const i = ids.indexOf(get().currentTrackId);
    get().selectTrack(ids[(i + 1) % ids.length]);
  },
  togglePlay: () => {
    audioEngine.ensure();
    set({ playing: !get().playing });
  },
  setPlaying: (v) => set({ playing: v }),
  setAmbientVolume: (v) => {
    const val = clamp01(v);
    set({ ambientVolume: val });
    void saveSetting("ambientVolume", val);
  },
  setChime: (id) => {
    set({ chimeId: id });
    void saveSetting("chimeId", id);
  },
  setChimeVolume: (v) => {
    const val = clamp01(v);
    set({ chimeVolume: val });
    void saveSetting("chimeVolume", val);
  },
  setPlaybackMode: (m) => {
    set({ playbackMode: m });
    void saveSetting("playbackMode", m);
  },
  toggleMute: () => {
    const v = !get().muteAll;
    set({ muteAll: v });
    void saveSetting("muteAll", v);
  },
  toggleLoop: () => {
    const v = !get().loop;
    set({ loop: v });
    audioEngine.setLoop(v);
    void saveSetting("loop", v);
  },

  importTrack: async (file) => {
    const t = await importMedia(file, "audio");
    set((st) => ({ userTracks: [...st.userTracks, t], currentTrackId: `user:${t.id}`, playing: true }));
    void saveSetting("ambientTrackId", `user:${t.id}`);
  },
  renameTrack: async (id, name) => {
    await renameUserMedia(id, name);
    set((st) => ({ userTracks: st.userTracks.map((t) => (t.id === id ? { ...t, name } : t)) }));
  },
  removeTrack: async (item) => {
    await removeUserMedia(item);
    set((st) => {
      const userTracks = st.userTracks.filter((t) => t.id !== item.id);
      const fallback = st.currentTrackId === `user:${item.id}` ? "light-rain" : st.currentTrackId;
      if (fallback !== st.currentTrackId) void saveSetting("ambientTrackId", fallback);
      return { userTracks, currentTrackId: fallback };
    });
  },
}));
