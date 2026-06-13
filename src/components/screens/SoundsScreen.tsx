import { useRef, useState, useEffect, type ChangeEvent } from "react";
import { Play, Pause, Upload, Music, X, BellRing, BellOff, Volume2, VolumeX, Repeat } from "lucide-react";
import { useAudio, type PlaybackMode } from "../../stores/audioStore";
import { BUNDLED_TRACKS, toneGradient } from "../../lib/tracks";
import { audioEngine, type ChimeId, type FileStatus } from "../../lib/audio";

const fmtSecs = (s: number) => {
  if (!Number.isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
};

const MODES: { id: PlaybackMode; label: string }[] = [
  { id: "focus", label: "Focus only" },
  { id: "always", label: "Focus + breaks" },
  { id: "manual", label: "Manual" },
];
const CHIMES: { id: ChimeId; label: string }[] = [
  { id: "soft", label: "Soft" },
  { id: "bell", label: "Bell" },
  { id: "blocks", label: "Blocks" },
];

/** Full-screen ambient sounds + chime + playback behaviour (FR-A). */
export function SoundsScreen() {
  const a = useAudio();
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) void a.importTrack(f);
    e.target.value = "";
  };

  const active = a.currentTrackId.startsWith("user:")
    ? a.userTracks.find((t) => `user:${t.id}` === a.currentTrackId)
    : BUNDLED_TRACKS.find((t) => t.id === a.currentTrackId);
  const activeName = active?.name ?? "Ambient";
  const activeHue = (active as { hue?: number })?.hue ?? 210;

  // Poll the file element for seekable position/duration (file tracks only).
  const [fileStatus, setFileStatus] = useState<FileStatus>(audioEngine.fileStatus());
  useEffect(() => {
    const id = window.setInterval(() => setFileStatus(audioEngine.fileStatus()), 500);
    return () => window.clearInterval(id);
  }, []);
  const seekable = fileStatus.isFile && fileStatus.duration > 0;

  return (
    <div className="sheet fade-up">
      <div className="sheet-head">
        <div>
          <h1 className="sheet-title">Ambient Sounds</h1>
          <div className="sheet-sub">Background audio to help you focus</div>
        </div>
      </div>
      <div className="sheet-body">
        {/* now playing */}
        <div className="card flex items-center gap-[18px] p-[18px]">
          <div className="relative flex h-[84px] w-[84px] flex-shrink-0 items-center justify-center overflow-hidden rounded-xl text-white" style={{ background: toneGradient(activeHue), boxShadow: "var(--shadow-8)" }}>
            <Music size={30} style={{ opacity: 0.92 }} />
            {a.playing && !a.muteAll && (
              <div className="absolute bottom-2 left-0 right-0 flex h-[18px] items-end justify-center gap-[3px]">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span key={i} className="w-[3px] rounded-[2px]" style={{ height: "100%", background: "rgba(255,255,255,.85)", transformOrigin: "bottom", animation: `eq ${0.7 + i * 0.1}s ${i * 0.08}s var(--ease-std) infinite` }} />
                ))}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--ui-text-3)" }}>
              {a.muteAll ? "Muted" : a.playing ? "Now Playing" : "Paused"}
            </div>
            <div className="text-[20px] font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--ui-text)" }}>
              {activeName}
            </div>
            <div className="mt-2 flex max-w-[320px] items-center gap-2.5">
              <button onClick={() => a.setAmbientVolume(a.ambientVolume > 0 ? 0 : 0.5)} style={{ color: "var(--ui-text-2)" }}>
                {a.ambientVolume > 0 ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>
              <input type="range" min={0} max={1} step={0.01} value={a.ambientVolume} onChange={(e) => a.setAmbientVolume(parseFloat(e.target.value))} className="h-1 flex-1" style={{ accentColor: "var(--accent)" }} />
              <span className="w-8 text-right text-[11.5px] tabular-nums" style={{ color: "var(--ui-text-3)" }}>
                {Math.round(a.ambientVolume * 100)}
              </span>
            </div>

            {/* seek bar for file tracks; bundled synth tracks loop continuously */}
            {seekable ? (
              <div className="mt-2 flex max-w-[320px] items-center gap-2.5">
                <span className="w-8 text-[11px] tabular-nums" style={{ color: "var(--ui-text-3)" }}>{fmtSecs(fileStatus.current)}</span>
                <input
                  type="range"
                  min={0}
                  max={fileStatus.duration}
                  step={0.5}
                  value={Math.min(fileStatus.current, fileStatus.duration)}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    audioEngine.seek(v);
                    setFileStatus((s) => ({ ...s, current: v }));
                  }}
                  className="h-1 flex-1"
                  style={{ accentColor: "var(--accent)" }}
                  aria-label="Seek"
                />
                <span className="w-8 text-right text-[11px] tabular-nums" style={{ color: "var(--ui-text-3)" }}>{fmtSecs(fileStatus.duration)}</span>
              </div>
            ) : (
              <div className="mt-1.5 text-[11.5px]" style={{ color: "var(--ui-text-3)" }}>Loops continuously</div>
            )}
          </div>

          <div className="flex flex-shrink-0 flex-col items-center gap-2">
            <button onClick={a.togglePlay} className="flex h-14 w-14 items-center justify-center rounded-full text-white" style={{ background: "var(--accent)", boxShadow: "var(--shadow-8)" }} aria-label={a.playing ? "Pause" : "Play"}>
              {a.playing ? <Pause size={24} strokeWidth={2.2} /> : <Play size={24} strokeWidth={2.2} />}
            </button>
            <button
              onClick={a.toggleLoop}
              className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold transition-colors"
              style={{ background: a.loop ? "var(--green-tint)" : "var(--ui-sunken)", color: a.loop ? "var(--green-primary)" : "var(--ui-text-3)" }}
              title={a.loop ? "Looping on" : "Looping off"}
              aria-pressed={a.loop}
            >
              <Repeat size={13} /> Loop
            </button>
          </div>
        </div>

        {/* track list */}
        <div className="mx-0.5 mb-2.5 mt-5 text-[12px] font-bold uppercase tracking-wide" style={{ color: "var(--ui-text-2)" }}>
          Sound Library
        </div>
        <div className="flex flex-col gap-1.5">
          {BUNDLED_TRACKS.map((tr) => (
            <TrackRow key={tr.id} id={tr.id} name={tr.name} artist={tr.artist} hue={tr.hue} />
          ))}
          {a.userTracks.map((tr) => (
            <TrackRow key={tr.id} id={`user:${tr.id}`} name={tr.name} artist="Imported" hue={210} onRemove={() => void a.removeTrack(tr)} />
          ))}
          <button onClick={() => fileRef.current?.click()} className="card flex items-center gap-3.5 p-[11px_14px] text-left" style={{ color: "var(--ui-text-2)" }}>
            <span className="flex h-[42px] w-[42px] items-center justify-center rounded-[9px]" style={{ border: "1.5px dashed var(--ui-border-2)" }}>
              <Upload size={17} />
            </span>
            <span className="text-[14px] font-semibold">Import a track</span>
            <input ref={fileRef} type="file" accept="audio/*" onChange={onFile} className="hidden" />
          </button>
        </div>

        {/* playback behaviour + chime */}
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div>
            <div className="mb-2 text-[12px] font-bold uppercase tracking-wide" style={{ color: "var(--ui-text-2)" }}>
              When to play
            </div>
            <div className="flex flex-col gap-1.5">
              {MODES.map((m) => {
                const on = a.playbackMode === m.id;
                return (
                  <button key={m.id} onClick={() => a.setPlaybackMode(m.id)} className="card p-[10px_14px] text-left text-[13px] font-semibold" style={{ border: on ? "0.5px solid var(--accent)" : "0.5px solid var(--ui-border)", background: on ? "var(--green-tint)" : "var(--ui-card)", color: on ? "var(--green-primary)" : "var(--ui-text)" }}>
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[12px] font-bold uppercase tracking-wide" style={{ color: "var(--ui-text-2)" }}>
                Session chime
              </span>
              <button onClick={a.toggleMute} className="flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: a.muteAll ? "var(--danger)" : "var(--ui-text-2)" }}>
                {a.muteAll ? <BellOff size={15} /> : <BellRing size={15} />}
                {a.muteAll ? "Muted" : "On"}
              </button>
            </div>
            <div className="seg mb-3 w-full" style={{ display: "flex" }}>
              {CHIMES.map((c) => (
                <button key={c.id} onClick={() => a.setChime(c.id)} className={`seg-btn flex-1${a.chimeId === c.id ? " on" : ""}`}>
                  {c.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-[12px]" style={{ color: "var(--ui-text-2)" }}>Volume</span>
              <input type="range" min={0} max={1} step={0.01} value={a.chimeVolume} onChange={(e) => a.setChimeVolume(parseFloat(e.target.value))} className="h-1 flex-1" style={{ accentColor: "var(--accent)" }} />
              <span className="w-8 text-right text-[11.5px] tabular-nums" style={{ color: "var(--ui-text-3)" }}>{Math.round(a.chimeVolume * 100)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrackRow({ id, name, artist, hue, onRemove }: { id: string; name: string; artist: string; hue: number; onRemove?: () => void }) {
  const a = useAudio();
  const active = a.currentTrackId === id;
  return (
    <button onClick={() => a.selectTrack(id)} className="card group flex items-center gap-3.5 p-[11px_14px] text-left" style={{ border: active ? "0.5px solid var(--accent)" : "0.5px solid var(--ui-border)", background: active ? "var(--green-tint)" : "var(--ui-card)" }}>
      <span className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-[9px] text-white" style={{ background: toneGradient(hue) }}>
        {active && a.playing ? (
          <span className="flex h-3.5 items-end gap-[2px]">
            {[0, 1, 2].map((i) => (
              <span key={i} className="w-[2.5px] rounded-[2px] bg-white" style={{ height: "100%", transformOrigin: "bottom", animation: `eq ${0.7 + i * 0.12}s ${i * 0.1}s var(--ease-std) infinite` }} />
            ))}
          </span>
        ) : (
          <Music size={17} style={{ opacity: 0.92 }} />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-semibold" style={{ color: active ? "var(--green-primary)" : "var(--ui-text)" }}>{name}</span>
        <span className="block text-[11.5px]" style={{ color: "var(--ui-text-3)" }}>{artist}</span>
      </span>
      {onRemove && (
        <span role="button" onClick={(e) => { e.stopPropagation(); onRemove(); }} className="hidden h-6 w-6 items-center justify-center rounded-full group-hover:flex" style={{ color: "var(--ui-text-3)" }}>
          <X size={13} />
        </span>
      )}
    </button>
  );
}
