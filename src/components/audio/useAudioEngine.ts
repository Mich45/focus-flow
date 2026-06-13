import { useEffect, useRef } from "react";
import { useAudio } from "../../stores/audioStore";
import { useTimerStore } from "../../stores/timerStore";
import { audioEngine } from "../../lib/audio";
import { BUNDLED_TRACKS } from "../../lib/tracks";

/**
 * Bridges the audio store + timer to the engine. Mount once near the app root.
 */
export function useAudioEngine(): void {
  const audio = useAudio();
  const status = useTimerStore((s) => s.status);
  const mode = useTimerStore((s) => s.mode);
  const completions = useTimerStore((s) => s.completions);

  // --- Output: play exactly what intent says. ---
  useEffect(() => {
    if (!audio.playing || audio.muteAll) {
      audioEngine.pauseOutput(); // keep source + position for resume
      return;
    }
    audioEngine.setVolume(audio.ambientVolume);
    if (audio.currentTrackId.startsWith("user:")) {
      const id = Number(audio.currentTrackId.slice(5));
      const t = audio.userTracks.find((u) => u.id === id);
      if (t) audioEngine.playFile(t.src);
      else audioEngine.stop();
    } else {
      const t = BUNDLED_TRACKS.find((b) => b.id === audio.currentTrackId) ?? BUNDLED_TRACKS[0];
      if (t.src) audioEngine.playFile(t.src);
      else if (t.tone) audioEngine.playTone(t.tone);
    }
  }, [audio.playing, audio.muteAll, audio.currentTrackId, audio.ambientVolume, audio.userTracks]);

  // --- Timer auto-control: toggle `playing` only at transitions, so it never
  //     fights manual play/pause between transitions. ---
  const desired =
    audio.playbackMode === "manual"
      ? null
      : audio.playbackMode === "always"
        ? status === "running"
        : status === "running" && mode === "focus"; // "focus"
  const prevDesired = useRef<boolean | null>(null);
  const inited = useRef(false);
  useEffect(() => {
    if (desired === null) {
      prevDesired.current = null;
      return;
    }
    if (!inited.current) {
      inited.current = true;
      prevDesired.current = desired;
      return; // don't auto-start on first mount
    }
    if (desired !== prevDesired.current) {
      prevDesired.current = desired;
      useAudio.getState().setPlaying(desired);
    }
  }, [desired]);

  // --- End-of-session chime on natural completion. ---
  const prevCompletions = useRef(completions);
  useEffect(() => {
    if (completions > prevCompletions.current && !audio.muteAll) {
      audioEngine.playChime(audio.chimeId, audio.chimeVolume);
    }
    prevCompletions.current = completions;
  }, [completions, audio.muteAll, audio.chimeId, audio.chimeVolume]);
}
