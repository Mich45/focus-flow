import { format } from "date-fns";

/**
 * ISO 8601 with the local UTC offset (e.g. 2026-06-12T14:30:00+02:00).
 * Stored this way so day-boundary stats respect the user's timezone (SRS §5).
 */
export function localIso(d: Date = new Date()): string {
  return format(d, "yyyy-MM-dd'T'HH:mm:ssXXX");
}

/** 'YYYY-MM-DD' in local time — the day a task/session belongs to. */
export function localDay(d: Date = new Date()): string {
  return format(d, "yyyy-MM-dd");
}
