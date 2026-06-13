import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/index.css";
import { BreakOverlay } from "./components/break/BreakOverlay";
import { useSettings } from "./stores/settingsStore";
import { useAppearance } from "./stores/appearanceStore";
import { useAudio } from "./stores/audioStore";
import { useTaskStore } from "./stores/taskStore";

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
const params = new URLSearchParams(window.location.search);

if (params.get("overlay") === "break") {
  // Break overlay window (FR-E7): render only the minimal overlay — no store
  // hydration, no timer/audio engines, no DB access.
  root.render(
    <React.StrictMode>
      <BreakOverlay
        primary={params.get("primary") === "true"}
        durationSecs={Number(params.get("secs")) || 300}
        holdSecs={Number(params.get("hold")) || 5}
      />
    </React.StrictMode>
  );
} else {
  // Begin hydrating all stores from SQLite before first paint (plan §7.1.5: gate
  // the UI on hydration to avoid a defaults→real-values flicker).
  void useSettings.getState().hydrate();
  void useAppearance.getState().hydrate();
  void useAudio.getState().hydrate();
  void useTaskStore.getState().hydrate();

  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
