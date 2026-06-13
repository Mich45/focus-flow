import { persistenceAvailable, getDb } from "./db";

/**
 * User-imported media (FR-B2 images, FR-A2 audio). The file is read in the
 * webview as bytes (so we never need filesystem read-scope on the picked path),
 * then:
 *  - in the Tauri app: written into {appData}/<subdir>/ and recorded in the
 *    `media` table, rendered via the scoped asset protocol (convertFileSrc).
 *  - in a plain browser: returned as an ephemeral data URL for preview.
 */

export type MediaKind = "image" | "audio";

export interface UserMedia {
  id: number;
  name: string;
  src: string; // ready-to-use url() / Audio src
  path: string; // relative path in app data (or "" in browser)
}

const SUBDIR: Record<MediaKind, string> = { image: "backgrounds", audio: "sounds" };

export async function importMedia(file: File, kind: MediaKind): Promise<UserMedia> {
  const bytes = new Uint8Array(await file.arrayBuffer());

  if (!persistenceAvailable()) {
    return { id: Date.now(), name: file.name, src: await blobToDataUrl(file), path: "" };
  }

  const { writeFile, mkdir, BaseDirectory } = await import("@tauri-apps/plugin-fs");
  const { convertFileSrc } = await import("@tauri-apps/api/core");
  const { appDataDir, join } = await import("@tauri-apps/api/path");

  const sub = SUBDIR[kind];
  const rel = `${sub}/${Date.now()}-${sanitize(file.name)}`;
  await mkdir(sub, { baseDir: BaseDirectory.AppData, recursive: true });
  await writeFile(rel, bytes, { baseDir: BaseDirectory.AppData });

  const abs = await join(await appDataDir(), rel);
  const db = await getDb();
  const res = await db.execute(
    "INSERT INTO media (kind, source, name, path) VALUES ($1,'user',$2,$3)",
    [kind, file.name, rel]
  );
  return { id: res.lastInsertId ?? Date.now(), name: file.name, src: convertFileSrc(abs), path: rel };
}

export async function listUserMedia(kind: MediaKind): Promise<UserMedia[]> {
  if (!persistenceAvailable()) return [];
  const { convertFileSrc } = await import("@tauri-apps/api/core");
  const { appDataDir, join } = await import("@tauri-apps/api/path");
  const db = await getDb();
  const rows = await db.select<{ id: number; name: string; path: string }[]>(
    "SELECT id, name, path FROM media WHERE kind=$1 AND source='user' ORDER BY id",
    [kind]
  );
  const base = await appDataDir();
  return Promise.all(
    rows.map(async (r) => ({ id: r.id, name: r.name, path: r.path, src: convertFileSrc(await join(base, r.path)) }))
  );
}

export async function renameUserMedia(id: number, name: string): Promise<void> {
  if (!persistenceAvailable()) return;
  const db = await getDb();
  await db.execute("UPDATE media SET name = $1 WHERE id = $2", [name, id]);
}

export async function removeUserMedia(item: UserMedia): Promise<void> {
  if (!persistenceAvailable() || !item.path) return;
  const { remove, BaseDirectory } = await import("@tauri-apps/plugin-fs");
  try {
    await remove(item.path, { baseDir: BaseDirectory.AppData });
  } catch {
    /* file may already be gone; still drop the row */
  }
  const db = await getDb();
  await db.execute("DELETE FROM media WHERE id = $1", [item.id]);
}

/* Back-compat aliases used by the appearance store (Phase 3). */
export type UserImage = UserMedia;
export const importImage = (file: File) => importMedia(file, "image");
export const listUserImages = () => listUserMedia("image");
export const removeUserImage = (img: UserMedia) => removeUserMedia(img);

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function blobToDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}
