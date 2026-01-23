use tauri::AppHandle;

#[cfg(target_os = "linux")]
use notify_rust::{Hint, Notification, Timeout, Urgency};
#[cfg(target_os = "linux")]
use std::collections::HashMap;
#[cfg(target_os = "linux")]
use zbus::blocking::Connection;
#[cfg(target_os = "linux")]
use zbus::blocking::Proxy;
#[cfg(target_os = "linux")]
use zbus::zvariant::Value;

#[cfg(not(target_os = "linux"))]
use tauri_plugin_notification::NotificationExt;

#[tauri::command]
pub fn send_system_notification(app: AppHandle, title: String, body: String) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        let app_name = app
            .config()
            .product_name
            .clone()
            .unwrap_or_else(|| "Aeon".to_string());
        let desktop_entry_id = to_desktop_entry_id(&app_name);
        let desktop_entry = format!("{desktop_entry_id}.desktop");

        if let Err(error) = send_portal_notification(&desktop_entry_id, &title, &body) {
            println!("[notifications] portal notification failed: {error}");
        } else {
            if cfg!(debug_assertions) {
                println!("[notifications] portal notification sent");
            }
            return Ok(());
        }

        let mut notification = Notification::new();
        notification
            .appname(&desktop_entry_id)
            .summary(&title)
            .body(&body)
            .icon(&desktop_entry_id)
            .hint(Hint::DesktopEntry(desktop_entry))
            .hint(Hint::Urgency(Urgency::Normal))
            .timeout(Timeout::Milliseconds(6000));

        notification
            .show()
            .map(|_| {
                if cfg!(debug_assertions) {
                    println!("[notifications] system notification sent (notify-rust)");
                }
            })
            .map_err(|error| {
                println!("[notifications] failed to show system notification: {error}");
                error.to_string()
            })
    }

    #[cfg(not(target_os = "linux"))]
    {
        app.notification()
            .builder()
            .title(title)
            .body(body)
            .show()
            .map(|_| {
                if cfg!(debug_assertions) {
                    println!("[notifications] system notification sent");
                }
            })
            .map_err(|error| {
                println!("[notifications] failed to show system notification: {error}");
                error.to_string()
            })
    }
}

#[cfg(target_os = "linux")]
fn to_desktop_entry_id(value: &str) -> String {
    let mut out = String::with_capacity(value.len());
    for ch in value.chars() {
        if ch.is_ascii_alphanumeric() {
            out.push(ch.to_ascii_lowercase());
        } else if ch == ' ' || ch == '_' || ch == '-' {
            if !out.ends_with('-') {
                out.push('-');
            }
        }
    }
    if out.is_empty() {
        "aeon".to_string()
    } else {
        out.trim_matches('-').to_string()
    }
}

#[cfg(target_os = "linux")]
fn send_portal_notification(app_id: &str, title: &str, body: &str) -> Result<(), String> {
    let connection = Connection::session()
        .map_err(|error| format!("session bus error: {error}"))?;
    let proxy = Proxy::new(
        &connection,
        "org.freedesktop.portal.Desktop",
        "/org/freedesktop/portal/desktop",
        "org.freedesktop.portal.Notification",
    )
    .map_err(|error| format!("portal proxy error: {error}"))?;

    let mut payload: HashMap<String, Value> = HashMap::new();
    payload.insert("title".to_string(), Value::from(title.to_string()));
    payload.insert("body".to_string(), Value::from(body.to_string()));
    payload.insert("priority".to_string(), Value::from("normal".to_string()));
    payload.insert("icon".to_string(), Value::from(app_id.to_string()));

    let notification_id = format!("aeon-{}", std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis())
        .unwrap_or(0));

    proxy
        .call_method("AddNotification", &(app_id, notification_id, payload))
        .map_err(|error| format!("portal notify error: {error}"))?;
    Ok(())
}
