import { useState, type ReactNode } from "react";
import { Sun, Moon, Monitor, Minus, Plus, Download, Trash2 } from "lucide-react";
import { useAppearance, type ThemeChoice } from "../../stores/appearanceStore";
import { useSettings } from "../../stores/settingsStore";
import { exportData, factoryReset } from "../../lib/export";

const THEMES: { id: ThemeChoice; label: string; icon: typeof Sun }[] = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "Auto", icon: Monitor },
];

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="relative h-[22px] w-[38px] flex-shrink-0 rounded-full transition-colors" style={{ background: on ? "var(--accent)" : "var(--ui-border-2)" }} role="switch" aria-checked={on}>
      <span className="absolute top-[2px] h-[18px] w-[18px] rounded-full bg-white transition-all" style={{ left: on ? 18 : 2 }} />
    </button>
  );
}

function Stepper({ value, min, max, suffix = "", onChange }: { value: number; min: number; max: number; suffix?: string; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      <button onClick={() => onChange(Math.max(min, value - 1))} className="flex h-7 w-7 items-center justify-center rounded-md" style={{ background: "var(--ui-sunken)", color: "var(--ui-text-2)" }} aria-label="Decrease">
        <Minus size={14} />
      </button>
      <span className="w-[58px] text-center text-[13px] font-semibold tabular-nums" style={{ color: "var(--ui-text)" }}>
        {value}
        {suffix}
      </span>
      <button onClick={() => onChange(Math.min(max, value + 1))} className="flex h-7 w-7 items-center justify-center rounded-md" style={{ background: "var(--ui-sunken)", color: "var(--ui-text-2)" }} aria-label="Increase">
        <Plus size={14} />
      </button>
    </div>
  );
}

function Row({ title, desc, children }: { title: string; desc?: string; children: ReactNode }) {
  return (
    <div className="card mt-2 flex items-center justify-between gap-4 p-[13px_16px]">
      <div className="min-w-0">
        <div className="text-[14px] font-semibold" style={{ color: "var(--ui-text)" }}>{title}</div>
        {desc && <div className="text-[12px]" style={{ color: "var(--ui-text-3)" }}>{desc}</div>}
      </div>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="mb-1 mt-6 text-[12px] font-bold uppercase tracking-wide first:mt-0" style={{ color: "var(--ui-text-2)" }}>
      {children}
    </div>
  );
}

/** Settings — Timer, System, Appearance (FR-C1). Data/export lands in Phase 8. */
export function SettingsScreen() {
  const a = useAppearance();
  const s = useSettings();
  const [exportNote, setExportNote] = useState<string | null>(null);

  const onExport = async (format: "json" | "csv") => {
    setExportNote(null);
    const path = await exportData(format);
    if (path) setExportNote(`Saved to ${path}`);
  };
  const onReset = () => {
    if (
      window.confirm(
        "Factory reset will permanently delete ALL your data:\n\n" +
          "• Focus sessions and statistics\n" +
          "• Tasks\n" +
          "• Imported sounds and backgrounds\n" +
          "• All settings\n\n" +
          "This cannot be undone. Continue?"
      )
    ) {
      void factoryReset();
    }
  };

  return (
    <div className="sheet fade-up">
      <div className="sheet-head">
        <div>
          <h1 className="sheet-title">Settings</h1>
          <div className="sheet-sub">Make FocusFlow yours</div>
        </div>
      </div>
      <div className="sheet-body">
        <SectionTitle>Timer</SectionTitle>
        <Row title="Focus duration">
          <Stepper value={s.focus} min={1} max={120} suffix=" min" onChange={(v) => s.setDuration("focus", v)} />
        </Row>
        <Row title="Short break">
          <Stepper value={s.short_break} min={1} max={120} suffix=" min" onChange={(v) => s.setDuration("short_break", v)} />
        </Row>
        <Row title="Long break">
          <Stepper value={s.long_break} min={1} max={120} suffix=" min" onChange={(v) => s.setDuration("long_break", v)} />
        </Row>
        <Row title="Sessions before long break">
          <Stepper value={s.sessionsBeforeLongBreak} min={1} max={12} onChange={(v) => s.set({ sessionsBeforeLongBreak: v })} />
        </Row>
        <Row title="Auto-start breaks" desc="Begin breaks automatically">
          <Toggle on={s.autoStartBreaks} onClick={() => s.set({ autoStartBreaks: !s.autoStartBreaks })} />
        </Row>
        <Row title="Auto-start focus" desc="Begin the next focus automatically">
          <Toggle on={s.autoStartFocus} onClick={() => s.set({ autoStartFocus: !s.autoStartFocus })} />
        </Row>
        <Row title="Strict mode" desc="Lock pause &amp; skip during focus">
          <Toggle on={s.strictMode} onClick={() => s.set({ strictMode: !s.strictMode })} />
        </Row>

        <SectionTitle>Break enforcement</SectionTitle>
        <Row title="Enforce breaks" desc="Full-screen takeover so you actually rest">
          <div className="seg">
            {([
              { id: "every", label: "Every" },
              { id: "long", label: "Long only" },
              { id: "off", label: "Off" },
            ] as const).map((o) => (
              <button key={o.id} onClick={() => s.set({ breakEnforcement: o.id })} className={`seg-btn${s.breakEnforcement === o.id ? " on" : ""}`}>
                {o.label}
              </button>
            ))}
          </div>
        </Row>
        <Row title="Escape hold" desc="Hold ESC this long to skip a break">
          <Stepper value={s.escapeHoldSecs} min={3} max={10} suffix="s" onChange={(v) => s.set({ escapeHoldSecs: v })} />
        </Row>

        <SectionTitle>System</SectionTitle>
        <Row title="Notifications" desc="Notify when a session ends">
          <Toggle on={s.notifications} onClick={() => s.set({ notifications: !s.notifications })} />
        </Row>
        <Row title="Close to tray" desc="Keep running in the tray on close">
          <Toggle on={s.closeToTray} onClick={() => s.set({ closeToTray: !s.closeToTray })} />
        </Row>
        <Row title="Launch at login" desc="Start FocusFlow when you sign in">
          <Toggle on={s.autostart} onClick={() => s.set({ autostart: !s.autostart })} />
        </Row>
        <Row title="Global shortcut" desc="Start / pause from anywhere">
          <input
            className="tin !w-[180px] !py-1.5 !text-[12px]"
            value={s.globalShortcut}
            onChange={(e) => s.set({ globalShortcut: e.target.value })}
            spellCheck={false}
          />
        </Row>

        <SectionTitle>Appearance</SectionTitle>
        <Row title="Theme">
          <div className="seg">
            {THEMES.map((t) => {
              const Ico = t.icon;
              return (
                <button key={t.id} onClick={() => a.setTheme(t.id)} className={`seg-btn flex items-center gap-1.5${a.theme === t.id ? " on" : ""}`}>
                  <Ico size={13} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </Row>
        <Row title="Accent follows mode" desc="Warm focus, calm breaks">
          <Toggle on={a.accentFollowsMode} onClick={() => a.setAccentFollowsMode(!a.accentFollowsMode)} />
        </Row>

        <SectionTitle>Data</SectionTitle>
        <Row title="Export your data" desc="Sessions and tasks as JSON or CSV">
          <div className="flex gap-2">
            <button onClick={() => void onExport("json")} className="btn btn-ghost !py-1.5 !text-[12.5px]">
              <Download size={14} /> JSON
            </button>
            <button onClick={() => void onExport("csv")} className="btn btn-ghost !py-1.5 !text-[12.5px]">
              <Download size={14} /> CSV
            </button>
          </div>
        </Row>
        {exportNote && (
          <div className="mt-1 px-1 text-[11.5px]" style={{ color: "var(--ui-text-3)" }}>{exportNote}</div>
        )}
        <Row title="Factory reset" desc="Erase all data and start fresh">
          <button onClick={onReset} className="btn !px-3.5 !py-1.5 !text-[12.5px]" style={{ background: "var(--danger-wash)", color: "var(--danger)" }}>
            <Trash2 size={14} /> Reset
          </button>
        </Row>
      </div>
    </div>
  );
}
