import { persistenceAvailable } from "./db";

/** Native notifications (FR-N1). No-ops outside the Tauri runtime. */

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!persistenceAvailable()) return false;
  const { isPermissionGranted, requestPermission } = await import("@tauri-apps/plugin-notification");
  let granted = await isPermissionGranted();
  if (!granted) granted = (await requestPermission()) === "granted";
  return granted;
}

export async function notify(title: string, body: string): Promise<void> {
  if (!persistenceAvailable()) return;
  try {
    const { sendNotification, isPermissionGranted } = await import("@tauri-apps/plugin-notification");
    if (await isPermissionGranted()) sendNotification({ title, body });
  } catch {
    /* notification failure is non-critical — degrade silently */
  }
}
