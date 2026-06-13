import { ModeTabs } from "../timer/ModeTabs";
import { TimerCard } from "../timer/TimerCard";
import { TimerControls } from "../timer/TimerControls";
import { SessionDots } from "../timer/SessionDots";
import { NowPlaying } from "../audio/NowPlaying";

/** Immersive timer over the wallpaper (SRS §6.1). No frosted sheet. */
export function TimerScreen() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-white">
      {/* legibility scrim */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg,rgba(0,0,0,.30),transparent 26%,transparent 64%,rgba(0,0,0,.34))",
        }}
      />
      <ModeTabs />
      <TimerCard />
      <TimerControls />
      <SessionDots />
      <NowPlaying />
    </div>
  );
}
