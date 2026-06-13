import { useState, useEffect } from "react";
import { Play, Pause, Repeat, SkipForward } from "lucide-react";
import { useAudio } from "../../stores/audioStore";
import { audioEngine, type FileStatus } from "../../lib/audio";
import { BUNDLED_TRACKS } from "../../lib/tracks";

const fmt = (s: number) => {
  if (!Number.isFinite(s) || s < 0) s = 0;
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
};

export function NowPlaying() {
  const a = useAudio();
  const [fs, setFs] = useState<FileStatus>(audioEngine.fileStatus());

  useEffect(() => {
    const id = window.setInterval(() => setFs(audioEngine.fileStatus()), 500);
    return () => window.clearInterval(id);
  }, []);

  const name = a.currentTrackId.startsWith("user:")
    ? a.userTracks.find((t) => `user:${t.id}` === a.currentTrackId)?.name ?? "Imported"
    : BUNDLED_TRACKS.find((t) => t.id === a.currentTrackId)?.name ?? "Ambient";

  const seekable = fs.isFile && fs.duration > 0;

  return (
    <div className="glass absolute bottom-[18px] right-[18px] z-20 w-[268px] rounded-2xl px-3 py-2.5 text-white">
      <div className="flex items-center gap-2.5">
        <button
          onClick={a.togglePlay}
          className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-full"
          style={{ background: "var(--accent)" }}
          aria-label={a.playing ? "Pause ambient" : "Play ambient"}
        >
          {a.playing ? <Pause size={15} strokeWidth={2.2} /> : <Play size={15} strokeWidth={2.2} />}
        </button>

        <div className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="truncate text-[12px] font-semibold">{name}</span>
          <span className="text-[9.5px]" style={{ color: "rgba(255,255,255,.6)" }}>
            {a.muteAll ? "Muted" : a.playing ? "Now playing" : "Paused"}
          </span>
        </div>

        {a.playing && !a.muteAll && (
          <div className="flex h-4 items-end gap-[2px]">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="w-[2.5px] rounded-[2px] bg-white"
                style={{ height: "100%", transformOrigin: "bottom", animation: `eq .9s ${i * 0.12}s var(--ease-std) infinite` }}
              />
            ))}
          </div>
        )}

        <button
          onClick={a.next}
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full transition"
          style={{ color: "rgba(255,255,255,.8)" }}
          title="Next track"
          aria-label="Next track"
        >
          <SkipForward size={15} />
        </button>

        <button
          onClick={a.toggleLoop}
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full transition"
          style={{ background: a.loop ? "rgba(255,255,255,.22)" : "transparent", color: a.loop ? "#fff" : "rgba(255,255,255,.5)" }}
          title={a.loop ? "Looping on" : "Looping off"}
          aria-pressed={a.loop}
        >
          <Repeat size={14} />
        </button>
      </div>

      {seekable && (
        <div className="mt-2 flex items-center gap-2">
          <span className="w-7 text-[9.5px] tabular-nums" style={{ color: "rgba(255,255,255,.6)" }}>{fmt(fs.current)}</span>
          <input
            type="range"
            min={0}
            max={fs.duration}
            step={0.5}
            value={Math.min(fs.current, fs.duration)}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              audioEngine.seek(v);
              setFs((s) => ({ ...s, current: v }));
            }}
            className="h-1 flex-1"
            style={{ accentColor: "#fff" }}
            aria-label="Seek"
          />
          <span className="w-7 text-right text-[9.5px] tabular-nums" style={{ color: "rgba(255,255,255,.6)" }}>{fmt(fs.duration)}</span>
        </div>
      )}
    </div>
  );
}
