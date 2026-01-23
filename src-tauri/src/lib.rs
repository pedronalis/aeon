mod db;
mod notifications;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            notifications::send_system_notification
        ])
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(db::setup_database().build())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
