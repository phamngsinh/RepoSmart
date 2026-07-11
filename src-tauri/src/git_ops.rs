use git2::{BranchType, Delta, DiffFormat, Oid, Repository, StatusOptions, Status};
use serde::{Deserialize, Serialize};
use std::path::Path;
use std::process::Command;
use walkdir::WalkDir;

#[derive(Debug, Serialize, Deserialize)]
pub struct RepoInfo {
    pub name: String,
    pub path: String,
    pub current_branch: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RemoteInfo {
    pub name: String,
    pub url: String,
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

#[derive(Debug, Serialize, Deserialize)]
pub struct FileDiff {
    pub path: String,
    pub status: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CommitDetails {
    pub hash: String,
    pub message: String,
    pub author: String,
    pub timestamp: i64,
    pub files: Vec<FileDiff>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GitConfig {
    pub name: Option<String>,
    pub email: Option<String>,
}

#[tauri::command]
pub fn get_git_config() -> Result<GitConfig, String> {
    let name_output = Command::new("git")
        .args(["config", "--global", "user.name"])
        .output()
        .map_err(|e| e.to_string())?;
    
    let email_output = Command::new("git")
        .args(["config", "--global", "user.email"])
        .output()
        .map_err(|e| e.to_string())?;

    let name = if name_output.status.success() {
        Some(String::from_utf8_lossy(&name_output.stdout).trim().to_string())
    } else {
        None
    };

    let email = if email_output.status.success() {
        Some(String::from_utf8_lossy(&email_output.stdout).trim().to_string())
    } else {
        None
    };

    Ok(GitConfig { name, email })
}

#[tauri::command]
pub fn set_git_config(name: String, email: String) -> Result<(), String> {
    Command::new("git")
        .args(["config", "--global", "user.name", &name])
        .output()
        .map_err(|e| e.to_string())?;
        
    Command::new("git")
        .args(["config", "--global", "user.email", &email])
        .output()
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn scan_repositories(path: String) -> Result<Vec<RepoInfo>, String> {
    let mut repos = Vec::new();
    let root = Path::new(&path);

    if !root.exists() || !root.is_dir() {
        return Err("Invalid directory path".into());
    }

    // Limit depth to 3 to avoid infinite scanning of huge drives
    for entry in WalkDir::new(root)
        .max_depth(3)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        if entry.file_type().is_dir() && entry.file_name() == ".git" {
            let repo_path = entry.path().parent().unwrap();

            if let Ok(repo) = Repository::open(repo_path) {
                let name = repo_path
                    .file_name()
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
pub fn get_repo_history(path: String, branch: Option<String>) -> Result<RepoHistory, String> {
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
    
    if let Some(branch_name) = branch {
        if let Ok(obj) = repo.revparse_single(&branch_name) {
            let _ = revwalk.push(obj.id());
        } else {
            revwalk.push_head().unwrap_or_default();
        }
    } else {
        revwalk.push_head().unwrap_or_default();

        // Attempt to push all local branches to the revwalk to see full graph
        if let Ok(branches) = repo.branches(Some(BranchType::Local)) {
            for branch in branches.filter_map(|b| b.ok()) {
                if let Some(target) = branch.0.get().target() {
                    let _ = revwalk.push(target);
                }
            }
        }
        
        // Push remote branches too so they show up in default view
        if let Ok(branches) = repo.branches(Some(BranchType::Remote)) {
            for branch in branches.filter_map(|b| b.ok()) {
                if let Some(target) = branch.0.get().target() {
                    let _ = revwalk.push(target);
                }
            }
        }
    }

    revwalk
        .set_sorting(git2::Sort::TOPOLOGICAL | git2::Sort::TIME)
        .unwrap_or_default();

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

#[tauri::command]
pub fn get_commit_details(path: String, hash: String) -> Result<CommitDetails, String> {
    let repo = Repository::open(Path::new(&path)).map_err(|e| e.to_string())?;
    let oid = git2::Oid::from_str(&hash).map_err(|e| e.to_string())?;
    let commit = repo.find_commit(oid).map_err(|e| e.to_string())?;

    let message = commit.message().unwrap_or("").to_string();
    let author = commit.author().name().unwrap_or("Unknown").to_string();
    let timestamp = commit.time().seconds();

    let mut files = Vec::new();

    let tree = commit.tree().map_err(|e| e.to_string())?;

    // Find parent tree
    let parent_tree = if commit.parent_count() > 0 {
        let parent = commit.parent(0).map_err(|e| e.to_string())?;
        Some(parent.tree().map_err(|e| e.to_string())?)
    } else {
        None
    };

    let diff = repo
        .diff_tree_to_tree(parent_tree.as_ref(), Some(&tree), None)
        .map_err(|e| e.to_string())?;

    diff.print(git2::DiffFormat::NameStatus, |delta, _, _| {
        let status = match delta.status() {
            git2::Delta::Added => "Added",
            git2::Delta::Deleted => "Deleted",
            git2::Delta::Modified => "Modified",
            git2::Delta::Renamed => "Renamed",
            git2::Delta::Copied => "Copied",
            _ => "Unknown",
        }
        .to_string();

        let path = delta
            .new_file()
            .path()
            .or_else(|| delta.old_file().path())
            .map(|p| p.to_string_lossy().into_owned())
            .unwrap_or_default();

        files.push(FileDiff { path, status });
        true
    })
    .map_err(|e| e.to_string())?;

    Ok(CommitDetails {
        hash,
        message,
        author,
        timestamp,
        files,
    })
}

#[tauri::command]
pub fn create_branch(path: String, name: String) -> Result<(), String> {
    let repo = Repository::open(Path::new(&path)).map_err(|e| e.to_string())?;
    let head = repo.head().map_err(|e| e.to_string())?;
    let commit = head.peel_to_commit().map_err(|e| e.to_string())?;
    
    repo.branch(&name, &commit, false).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn clone_repo(url: String, path: String) -> Result<RepoInfo, String> {
    let repo_path = Path::new(&path);
    Repository::clone(&url, repo_path).map_err(|e| e.to_string())?;

    let name = repo_path
        .file_name()
        .unwrap_or_default()
        .to_string_lossy()
        .to_string();

    Ok(RepoInfo {
        name,
        path: repo_path.to_string_lossy().to_string(),
        current_branch: Some("main".to_string()),
    })
}

#[tauri::command]
pub fn get_remotes(path: String) -> Result<Vec<RemoteInfo>, String> {
    let repo = Repository::open(Path::new(&path)).map_err(|e| e.to_string())?;
    let mut remotes = Vec::new();
    
    if let Ok(remote_names) = repo.remotes() {
        for name in remote_names.iter().filter_map(|n| n.ok().flatten()) {
            if let Ok(remote) = repo.find_remote(name) {
                remotes.push(RemoteInfo {
                    name: name.to_string(),
                    url: remote.url().unwrap_or("").to_string(),
                });
            }
        }
    }
    
    Ok(remotes)
}

#[tauri::command]
pub fn get_repo_status(path: String) -> Result<Vec<FileDiff>, String> {
    let repo = Repository::open(Path::new(&path)).map_err(|e| e.to_string())?;
    let mut statuses = Vec::new();
    
    let mut options = StatusOptions::new();
    options.include_untracked(true).recurse_untracked_dirs(true);
    
    if let Ok(statuses_iter) = repo.statuses(Some(&mut options)) {
        for entry in statuses_iter.iter() {
            let path = entry.path().unwrap_or("").to_string();
            let status = entry.status();
            
            let status_str = if status.intersects(Status::INDEX_NEW | Status::WT_NEW) {
                "Added"
            } else if status.intersects(Status::INDEX_MODIFIED | Status::WT_MODIFIED) {
                "Modified"
            } else if status.intersects(Status::INDEX_DELETED | Status::WT_DELETED) {
                "Deleted"
            } else if status.intersects(Status::INDEX_RENAMED | Status::WT_RENAMED) {
                "Renamed"
            } else {
                "Modified"
            };
            
            statuses.push(FileDiff {
                path,
                status: status_str.to_string()
            });
        }
    }
    
    Ok(statuses)
}

#[tauri::command]
pub fn open_local_repo(path: String) -> Result<RepoInfo, String> {
    let repo_path = Path::new(&path);
    if let Ok(repo) = Repository::open(repo_path) {
        let name = repo_path
            .file_name()
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

        Ok(RepoInfo {
            name,
            path: repo_path.to_string_lossy().to_string(),
            current_branch,
        })
    } else {
        Err("Not a valid git repository".into())
    }
}

#[tauri::command]
pub fn git_pull(path: String) -> Result<String, String> {
    let repo = Repository::open(Path::new(&path)).map_err(|e| e.to_string())?;
    let head = repo.head().map_err(|e| e.to_string())?;
    let branch_name = head.shorthand().unwrap_or("main");

    let mut output = Command::new("git")
        .current_dir(Path::new(&path))
        .arg("pull")
        .output()
        .map_err(|e| format!("Failed to execute git pull: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr).to_lowercase();
        let stdout = String::from_utf8_lossy(&output.stdout).to_lowercase();
        let combined = format!("{} {}", stderr, stdout);
        
        if combined.contains("no tracking information") || combined.contains("specify a branch") {
            output = Command::new("git")
                .current_dir(Path::new(&path))
                .args(["pull", "origin", branch_name])
                .output()
                .map_err(|e| format!("Failed to execute git pull fallback: {}", e))?;
        }
    }

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        let err = String::from_utf8_lossy(&output.stderr).to_string();
        if err.is_empty() {
            Err(String::from_utf8_lossy(&output.stdout).to_string())
        } else {
            Err(err)
        }
    }
}

#[tauri::command]
pub fn git_push(path: String) -> Result<String, String> {
    let repo = Repository::open(Path::new(&path)).map_err(|e| e.to_string())?;
    let head = repo.head().map_err(|e| e.to_string())?;
    let branch_name = head.shorthand().unwrap_or("main");

    let mut output = Command::new("git")
        .current_dir(Path::new(&path))
        .arg("push")
        .output()
        .map_err(|e| format!("Failed to execute git push: {}", e))?;

    if !output.status.success() {
         let stderr = String::from_utf8_lossy(&output.stderr).to_lowercase();
         let stdout = String::from_utf8_lossy(&output.stdout).to_lowercase();
         let combined = format!("{} {}", stderr, stdout);
         
         if combined.contains("has no upstream branch") || combined.contains("set-upstream") {
             output = Command::new("git")
                .current_dir(Path::new(&path))
                .args(["push", "-u", "origin", branch_name])
                .output()
                .map_err(|e| format!("Failed to execute git push fallback: {}", e))?;
         }
    }

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        let err = String::from_utf8_lossy(&output.stderr).to_string();
        if err.is_empty() {
            Err(String::from_utf8_lossy(&output.stdout).to_string())
        } else {
            Err(err)
        }
    }
}

#[tauri::command]
pub fn git_commit(path: String, message: String) -> Result<String, String> {
    let add_output = Command::new("git")
        .current_dir(Path::new(&path))
        .args(["add", "."])
        .output()
        .map_err(|e| format!("Failed to git add: {}", e))?;
        
    if !add_output.status.success() {
        return Err(String::from_utf8_lossy(&add_output.stderr).to_string());
    }

    let commit_output = Command::new("git")
        .current_dir(Path::new(&path))
        .args(["commit", "-m", &message])
        .output()
        .map_err(|e| format!("Failed to git commit: {}", e))?;

    if commit_output.status.success() {
        Ok(String::from_utf8_lossy(&commit_output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&commit_output.stderr).to_string())
    }
}

