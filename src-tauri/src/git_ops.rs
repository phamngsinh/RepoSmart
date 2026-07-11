use git2::{Repository, BranchType};
use serde::{Deserialize, Serialize};
use walkdir::WalkDir;
use std::path::Path;

#[derive(Debug, Serialize, Deserialize)]
pub struct RepoInfo {
    pub name: String,
    pub path: String,
    pub current_branch: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CommitNode {
    pub hash: String,
    pub message: String,
    pub author: String,
    pub timestamp: i64,
    pub parents: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RepoHistory {
    pub commits: Vec<CommitNode>,
    pub local_branches: Vec<String>,
    pub remote_branches: Vec<String>,
}

#[tauri::command]
pub fn scan_repositories(path: String) -> Result<Vec<RepoInfo>, String> {
    let mut repos = Vec::new();
    let root = Path::new(&path);
    
    if !root.exists() || !root.is_dir() {
        return Err("Invalid directory path".into());
    }

    // Limit depth to 3 to avoid infinite scanning of huge drives
    for entry in WalkDir::new(root).max_depth(3).into_iter().filter_map(|e| e.ok()) {
        if entry.file_type().is_dir() && entry.file_name() == ".git" {
            let repo_path = entry.path().parent().unwrap();
            
            if let Ok(repo) = Repository::open(repo_path) {
                let name = repo_path.file_name()
                    .unwrap_or_default()
                    .to_string_lossy()
                    .to_string();
                
                let current_branch = if let Ok(head) = repo.head() {
                    if let Ok(shorthand) = head.shorthand() {
                        Some(shorthand.to_string())
                    } else {
                        None
                    }
                } else {
                    None
                };

                repos.push(RepoInfo {
                    name,
                    path: repo_path.to_string_lossy().to_string(),
                    current_branch,
                });
            }
        }
    }

    Ok(repos)
}

#[tauri::command]
pub fn get_repo_history(path: String) -> Result<RepoHistory, String> {
    let repo = Repository::open(Path::new(&path)).map_err(|e| e.to_string())?;
    
    let mut commits = Vec::new();
    let mut local_branches = Vec::new();
    let mut remote_branches = Vec::new();

    // Get branches
    if let Ok(branches) = repo.branches(Some(BranchType::Local)) {
        for branch in branches.filter_map(|b| b.ok()) {
            if let Ok(Some(name)) = branch.0.name() {
                local_branches.push(name.to_string());
            }
        }
    }
    
    if let Ok(branches) = repo.branches(Some(BranchType::Remote)) {
        for branch in branches.filter_map(|b| b.ok()) {
            if let Ok(Some(name)) = branch.0.name() {
                remote_branches.push(name.to_string());
            }
        }
    }

    // Get commits (top 100 for performance in this prototype)
    let mut revwalk = repo.revwalk().map_err(|e| e.to_string())?;
    revwalk.push_head().unwrap_or_default();
    
    // Attempt to push all local branches to the revwalk to see full graph
    if let Ok(branches) = repo.branches(Some(BranchType::Local)) {
        for branch in branches.filter_map(|b| b.ok()) {
            if let Some(target) = branch.0.get().target() {
                let _ = revwalk.push(target);
            }
        }
    }

    revwalk.set_sorting(git2::Sort::TOPOLOGICAL | git2::Sort::TIME).unwrap_or_default();

    for oid in revwalk.filter_map(|id| id.ok()).take(100) {
        if let Ok(commit) = repo.find_commit(oid) {
            let hash = commit.id().to_string();
            let message = if let Ok(Some(msg)) = commit.summary() {
                msg.to_string()
            } else {
                String::new()
            };
            let author = commit.author().name().unwrap_or("Unknown").to_string();
            let timestamp = commit.time().seconds();
            let parents: Vec<String> = commit.parents().map(|p| p.id().to_string()).collect();

            commits.push(CommitNode {
                hash,
                message,
                author,
                timestamp,
                parents,
            });
        }
    }

    Ok(RepoHistory {
        commits,
        local_branches,
        remote_branches,
    })
}
