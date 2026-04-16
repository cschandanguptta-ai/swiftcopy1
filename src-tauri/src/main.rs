// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod engine;

// IPC Command: Ping
// This verifies the React frontend can talk to the Rust backend.
#[tauri::command]
fn ping_engine() -> String {
    format!("pong_from_native_engine (I/O Threads Active)")
}

// IPC Command: Start Copy
// Represents the Phase 3 backend implementation endpoints
#[tauri::command]
async fn begin_copy_task(source: String, destination: String, allow_vss: bool) -> Result<String, String> {
    // 1. Simulate finding a locked file -> Trigger VSS
    let mut actual_source = source.clone();
    if allow_vss && source.contains("SQL") || source.contains("Locked") {
        let snapshot_path = engine::vss::create_vss_snapshot(&source)?;
        actual_source = snapshot_path;
    }

    // 2. Perform copy & hash using I/O Completion Ports
    let hash = engine::iocp::copy_file_with_iocp(&actual_source, &destination)?;

    // 3. Migrate Metadata (ACLs & ADS) via Backup API
    engine::metadata::preserve_acls_and_ads(&actual_source, &destination)?;

    // Return the Blake3 hash directly to the React frontend
    Ok(hash)
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            ping_engine,
            begin_copy_task
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
