import { persistenceAvailable } from "./db";

/** Thin wrappers over the Tauri backend / plugins. All no-op in a plain browser. */

async function invokeSafe(cmd: string, args?: Record<string, unknown>): Promise<unknown> {
  if (!persistenceAvailable()) return undefined;
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke(cmd, args);
}

export const setCloseToTray = (value: boolean) => invokeSafe("set_close_to_tray", { value });
export const updateTrayTooltip = (tooltip: string) => invokeSafe("update_tray_tooltip", { tooltip });

/** Break overlay controls (FR-E). No-op in a plain browser. */
export const showBreakOverlay = (durationSecs: number, holdSecs: number) =>
  invokeSafe("show_break_overlay", { durationSecs, holdSecs });
export const closeBreakOverlay = () => invokeSafe("close_break_overlay");
export const escapeBreak = () => invokeSafe("escape_break");

/** Listen for a tray-menu event; returns an unlisten fn (no-op in browser). */
export async function onTrayEvent(event: string, handler: () => void): Promise<() => void> {
  if (!persistenceAvailable()) return () => {};
  const { listen } = await import("@tauri-apps/api/event");
  return listen(event, () => handler());
}

/** Register a global shortcut, replacing any prior one. Returns true on success (FR-N3). */
export async function registerGlobalShortcut(accelerator: string, handler: () => void): Promise<boolean> {
  if (!persistenceAvailable() || !accelerator) return false;
  try {
    const gs = await import("@tauri-apps/plugin-global-shortcut");
    await gs.unregisterAll();
    await gs.register(accelerator, (e) => {
      if (e.state === "Pressed") handler();
    });
    return true;
  } catch {
    return false; // e.g. accelerator already taken by the OS
  }
}

export async function unregisterAllShortcuts(): Promise<void> {
  if (!persistenceAvailable()) return;
  try {
    const gs = await import("@tauri-apps/plugin-global-shortcut");
    await gs.unregisterAll();
  } catch {
    /* ignore */
  }
}

/** Sync OS launch-at-login with the setting (FR-N4). */
export async function syncAutostart(enabled: boolean): Promise<void> {
  if (!persistenceAvailable()) return;
  try {
    const auto = await import("@tauri-apps/plugin-autostart");
    const isEnabled = await auto.isEnabled();
    if (enabled && !isEnabled) await auto.enable();
    else if (!enabled && isEnabled) await auto.disable();
  } catch {
    /* ignore */
  }
}
