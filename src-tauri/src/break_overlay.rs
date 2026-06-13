use std::sync::atomic::{AtomicBool, Ordering};
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager, PhysicalPosition, PhysicalSize, WebviewUrl, WebviewWindowBuilder};

/// True while a break overlay is on screen. Drives the focus guard (FR-E3).
static OVERLAY_ACTIVE: AtomicBool = AtomicBool::new(false);

/// Show the break overlay on every connected monitor (FR-E1/E2). One borderless,
/// always-on-top window per monitor, sized to it. Only the primary renders the
/// countdown; others show the dimmed blank.
#[tauri::command]
pub fn show_break_overlay(app: AppHandle, duration_secs: u64, hold_secs: u64) -> Result<(), String> {
    if OVERLAY_ACTIVE.swap(true, Ordering::SeqCst) {
        return Ok(()); // already showing
    }
    let monitors = app.available_monitors().map_err(|e| e.to_string())?;
    for (i, m) in monitors.iter().enumerate() {
        let primary = i == 0;
        let label = format!("break-{i}");
        let url = format!(
            "index.html?overlay=break&primary={primary}&secs={duration_secs}&hold={hold_secs}"
        );
        let pos = *m.position();
        let size = *m.size();
        let win = WebviewWindowBuilder::new(&app, &label, WebviewUrl::App(url.into()))
            .title("Break")
            .decorations(false)
            .always_on_top(true)
            .skip_taskbar(true)
            .closable(false)
            .minimizable(false)
            .maximizable(false)
            .resizable(false)
            .visible(false)
            .build()
            .map_err(|e| e.to_string())?;

        let _ = win.set_position(PhysicalPosition::new(pos.x, pos.y));
        let _ = win.set_size(PhysicalSize::new(size.width, size.height));
        #[cfg(target_os = "macos")]
        let _ = win.set_visible_on_all_workspaces(true);
        let _ = win.show();
        if primary {
            let _ = win.set_focus();
        }
    }
    spawn_focus_guard(app);
    Ok(())
}

/// Re-assert always-on-top and re-grab focus on the primary overlay at ≤1 s
/// intervals while active (FR-E3). Makes working around the break impractical.
fn spawn_focus_guard(app: AppHandle) {
    std::thread::spawn(move || {
        while OVERLAY_ACTIVE.load(Ordering::SeqCst) {
            if let Some(w) = app.get_webview_window("break-0") {
                let _ = w.set_always_on_top(true);
                let _ = w.set_focus();
            }
            std::thread::sleep(Duration::from_millis(800));
        }
    });
}

/// Close every overlay window and stop the guard (FR-E4).
#[tauri::command]
pub fn close_break_overlay(app: AppHandle) {
    OVERLAY_ACTIVE.store(false, Ordering::SeqCst);
    close_all(&app);
}

/// Emergency escape from the overlay (FR-E5): notify the main window (which
/// records the break as incomplete and resumes), then tear down the overlay.
#[tauri::command]
pub fn escape_break(app: AppHandle) {
    OVERLAY_ACTIVE.store(false, Ordering::SeqCst);
    let _ = app.emit("break://escaped", ());
    close_all(&app);
}

fn close_all(app: &AppHandle) {
    let labels: Vec<String> = app
        .webview_windows()
        .keys()
        .filter(|k| k.starts_with("break-"))
        .cloned()
        .collect();
    for label in labels {
        if let Some(w) = app.get_webview_window(&label) {
            let _ = w.close();
        }
    }
}
