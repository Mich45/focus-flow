mod break_overlay;
mod tray;

use std::sync::atomic::{AtomicBool, Ordering};
use tauri::{Manager, State, WindowEvent};
use tauri_plugin_sql::{Migration, MigrationKind};

/// Shared backend state. `close_to_tray` mirrors the frontend setting (FR-N5)
/// so the close handler can decide synchronously.
struct AppState {
    close_to_tray: AtomicBool,
}

#[tauri::command]
fn set_close_to_tray(state: State<AppState>, value: bool) {
    state.close_to_tray.store(value, Ordering::Relaxed);
}

#[tauri::command]
fn update_tray_tooltip(app: tauri::AppHandle, tooltip: String) {
    if let Some(tray) = app.tray_by_id("main-tray") {
        let _ = tray.set_tooltip(Some(&tooltip));
    }
}

/// Write text to a path the user picked via the native save dialog (FR-X1).
/// Doing the write in Rust avoids granting the webview broad filesystem scope.
#[tauri::command]
fn save_text_file(path: String, contents: String) -> Result<(), String> {
    std::fs::write(&path, contents).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![Migration {
        version: 1,
        description: "init schema",
        sql: include_str!("../migrations/0001_init.sql"),
        kind: MigrationKind::Up,
    }];

    let mut builder = tauri::Builder::default();

    // single-instance must be the FIRST plugin registered (Tauri requirement).
    // Desktop-only: on a second launch, focus the existing main window (FR-N6).
    #[cfg(desktop)]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }));
    }

    builder
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_autostart::Builder::new().build())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(
            tauri_plugin_sql::Builder::new()
                .add_migrations("sqlite:focusflow.db", migrations)
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .manage(AppState {
            close_to_tray: AtomicBool::new(true),
        })
        .invoke_handler(tauri::generate_handler![
            set_close_to_tray,
            update_tray_tooltip,
            save_text_file,
            break_overlay::show_break_overlay,
            break_overlay::close_break_overlay,
            break_overlay::escape_break,
        ])
        .setup(|app| {
            tray::create_tray(app.handle())?;
            Ok(())
        })
        .on_window_event(|window, event| {
            // Close-to-tray: hide instead of quit when the setting is on (FR-N5).
            if let WindowEvent::CloseRequested { api, .. } = event {
                if window.label() == "main" {
                    let state = window.state::<AppState>();
                    if state.close_to_tray.load(Ordering::Relaxed) {
                        let _ = window.hide();
                        api.prevent_close();
                    }
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
