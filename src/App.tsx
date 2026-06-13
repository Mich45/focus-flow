import { useEffect } from "react";
import { Rail } from "./components/shell/Rail";
import { TimerScreen } from "./components/screens/TimerScreen";
import { TasksScreen } from "./components/screens/TasksScreen";
import { StatsScreen } from "./components/screens/StatsScreen";
import { SceneScreen } from "./components/screens/SceneScreen";
import { SoundsScreen } from "./components/screens/SoundsScreen";
import { SettingsScreen } from "./components/screens/SettingsScreen";
import { useTimerEngine } from "./components/timer/useTimerEngine";
import { useAudioEngine } from "./components/audio/useAudioEngine";
import { useSystemIntegration } from "./components/system/useSystemIntegration";
import { useBreakEnforcement } from "./components/break/useBreakEnforcement";
import { useTimerStore } from "./stores/timerStore";
import { useSettings } from "./stores/settingsStore";
import { useAudio } from "./stores/audioStore";
import { useUi } from "./stores/uiStore";
import { useAppearance, wallpaperStyle } from "./stores/appearanceStore";
import { accentFor, resolveTheme } from "./lib/theme";

const SCREENS = {
  timer: TimerScreen,
  tasks: TasksScreen,
  stats: StatsScreen,
  scene: SceneScreen,
  sounds: SoundsScreen,
  settings: SettingsScreen,
};

function App() {
  useTimerEngine();
  useAudioEngine();
  useSystemIntegration();
  useBreakEnforcement();
  const toggle = useTimerStore((s) => s.toggle);
  const mode = useTimerStore((s) => s.mode);
  const view = useUi((s) => s.view);

  const settingsHydrated = useSettings((s) => s.hydrated);
  const audioHydrated = useAudio((s) => s.hydrated);
  const appearance = useAppearance();
  const accent = accentFor(mode, appearance.accentFollowsMode);

  // Apply theme to <html data-theme>, tracking the OS preference when "system".
  useEffect(() => {
    const apply = () =>
      document.documentElement.setAttribute("data-theme", resolveTheme(appearance.theme));
    apply();
    if (appearance.theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [appearance.theme]);

  // Space toggles start/pause on the timer view, unless typing or on a control.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space" || useUi.getState().view !== "timer") return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "BUTTON") return;
      e.preventDefault();
      // Strict mode locks pause mid-focus (FR-T7).
      const t = useTimerStore.getState();
      const strict = useSettings.getState().strictMode;
      if (strict && t.mode === "focus" && t.status === "running") return;
      toggle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  // Gate first paint on hydration of all stores (no defaults→real flicker).
  if (!settingsHydrated || !appearance.hydrated || !audioHydrated) {
    return <div className="h-full w-full" style={{ background: "#0c1310" }} />;
  }

  const blur = appearance.blurPx;
  const Screen = SCREENS[view];

  return (
    <div className="relative flex h-full w-full overflow-hidden" style={{ ["--accent" as string]: accent }}>
      {/* wallpaper — extended past the edges so blur never reveals the backdrop */}
      <div
        className="absolute"
        style={{
          inset: `${-blur * 2}px`,
          ...wallpaperStyle(appearance),
          filter: blur ? `blur(${blur}px)` : undefined,
          transition: "background .5s var(--ease-std)",
        }}
      />
      {/* dim (FR-B3) */}
      <div className="pointer-events-none absolute inset-0" style={{ background: `rgba(0,0,0,${appearance.dimPct / 100})` }} />

      <Rail />
      <div className="stage">
        <Screen />
      </div>
    </div>
  );
}

export default App;
