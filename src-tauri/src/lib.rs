mod git_ops;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            git_ops::scan_repositories,
            git_ops::get_repo_history,
            git_ops::get_commit_details
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
