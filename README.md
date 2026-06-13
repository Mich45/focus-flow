# FocusFlow

![FocusFlow home screen](public/focus-flow-home.png)

FocusFlow is a modern, offline-only desktop Pomodoro timer. It features focus and break cycles, ambient
sounds, custom backgrounds, daily to-dos, statistics, and full-screen break
enforcement. 

FocusFlow is built with Tauri 2, React, and TypeScript. All data is stored
locally; there is no account system and no network dependency.

## Development

```bash
npm install
npm run tauri dev      # run the desktop app
npm run dev            # run just the web UI (no native features)
npm run tauri build    # produce a packaged build
```

## Installing a released build

Release binaries are **not code-signed or notarized**, so your OS will warn you
the first time you open the app. This is expected for an independent project —
the app is unchanged, it simply hasn't been registered with Apple/Microsoft.

**macOS** — the first launch is blocked with "FocusFlow can't be opened because
Apple cannot check it for malicious software." Either:
- Right-click (or Control-click) the app → **Open** → **Open** in the dialog, or
- Open **System Settings → Privacy & Security** and click **Open Anyway**.

**Windows** — SmartScreen shows "Windows protected your PC." Click **More info**
→ **Run anyway**.

**Linux** — no warning; mark the AppImage executable (`chmod +x`) if needed.

You only need to do this once per installed version.

## Bundled ambient audio

Bundled tracks live in `public/sounds/` and are sourced from
[Pixabay](https://pixabay.com) under the Pixabay Content License (royalty-free).

| Track | Artist |
|---|---|
| Cosmic Ambient | [Alex Wit](https://pixabay.com/users/light_music-40074088/) |
| Heavenly Energy | [Alex Wit](https://pixabay.com/users/light_music-40074088/) |
| Ambient Occlusion | [Wilson Marumura](https://pixabay.com/users/blackwilson-44944329/) |
| Ambient Background | [Tunetank](https://pixabay.com/users/tunetank-50201703/) |
| Deep Meditation | [Roman Dudchyk](https://pixabay.com/users/grand_project-19033897/) |
| Light Rain Ambient | [Mikhail](https://pixabay.com/users/soundsforyou-4861230/) |

All music/sound effects from Pixabay. Thanks to the artists above.
