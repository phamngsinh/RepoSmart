mod git_ops;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            git_ops::scan_repositories,
            git_ops::get_repo_history,
            git_ops::get_commit_details,
            git_ops::open_local_repo,
            git_ops::clone_repo,
            git_ops::git_pull,
            git_ops::git_push,
            git_ops::get_git_config,
            git_ops::set_git_config,
            git_ops::get_remotes,
            git_ops::get_repo_status,
            git_ops::create_branch,
            git_ops::git_commit,
            git_ops::open_in_explorer
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
