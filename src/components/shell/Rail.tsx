import { Timer, ListChecks, BarChart3, Image, Music, Settings } from "lucide-react";
import { useUi, type View } from "../../stores/uiStore";

const NAV: { id: View; label: string; icon: typeof Timer }[] = [
  { id: "timer", label: "Timer", icon: Timer },
  { id: "tasks", label: "Tasks", icon: ListChecks },
  { id: "stats", label: "Stats", icon: BarChart3 },
  { id: "scene", label: "Scene", icon: Image },
  { id: "sounds", label: "Sounds", icon: Music },
  { id: "settings", label: "Settings", icon: Settings },
];

/** Left navigation rail (full design parity). */
export function Rail() {
  const view = useUi((s) => s.view);
  const setView = useUi((s) => s.setView);

  return (
    <nav className="rail">
      {NAV.map((n) => {
        const Ico = n.icon;
        const active = view === n.id;
        return (
          <button
            key={n.id}
            className={`nav-btn${active ? " active" : ""}`}
            onClick={() => setView(n.id)}
            aria-current={active ? "page" : undefined}
          >
            <span className="nav-ico">
              <Ico size={19} strokeWidth={1.9} />
            </span>
            <span className="nav-lbl">{n.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
