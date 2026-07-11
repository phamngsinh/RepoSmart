import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { FolderGit2, FolderOpen, Settings, ChevronDown, GitBranch, TerminalSquare, Search, DownloadCloud, FolderSearch, Moon, Sun } from 'lucide-react';
import { open } from '@tauri-apps/plugin-dialog';
import { GitGraph, GitGraphProps } from './GitGraph';
import { AddRepoModal } from './AddRepoModal';
import { SettingsModal } from './SettingsModal';
import { BranchModal } from './BranchModal';
import { CommitPushModal } from './CommitPushModal';
import './App.css';

interface RepoInfo {
  name: string;
  path: string;
  current_branch: string | null;
  groupId?: string;
}

interface RemoteInfo {
  name: string;
  url: string;
}

interface RepoGroup {
  id: string;
  name: string;
  isExpanded: boolean;
}

interface RepoHistory {
  commits: GitGraphProps['commits'];
  local_branches: string[];
  remote_branches: string[];
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  repoPath: string;
}

interface FileDiff {
  path: string;
  status: string;
}

interface CommitDetails {
  hash: string;
  message: string;
  author: string;
  timestamp: number;
  files: FileDiff[];
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [repos, setRepos] = useState<RepoInfo[]>(() => {
    const saved = localStorage.getItem('smartrepo_repos');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [groups, setGroups] = useState<RepoGroup[]>(() => {
    const saved = localStorage.getItem('smartrepo_groups');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Tab System State
  const [tabs, setTabs] = useState<RepoInfo[]>(() => {
    const saved = localStorage.getItem('smartrepo_tabs');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeTabId, setActiveTabId] = useState<string | null>(() => {
    const saved = localStorage.getItem('smartrepo_activeTabId');
    return saved ? JSON.parse(saved) : null;
  });
  const [histories, setHistories] = useState<Record<string, RepoHistory>>({});
  
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCommitHash, setSelectedCommitHash] = useState<string | null>(null);
  const [commitDetails, setCommitDetails] = useState<CommitDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalDefaultTab, setModalDefaultTab] = useState<'local' | 'clone'>('local');
  const [draggedRepoPath, setDraggedRepoPath] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [activeBranchId, setActiveBranchId] = useState<Record<string, string | null>>({});
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [isCommitPushModalOpen, setIsCommitPushModalOpen] = useState(false);
  
  const [remotes, setRemotes] = useState<RemoteInfo[]>([]);
  const [repoStatus, setRepoStatus] = useState<FileDiff[]>([]);
  const [activeMainTab, setActiveMainTab] = useState<'history' | 'changes'>('history');
  const [commitMessage, setCommitMessage] = useState('');
  const [repoSearchQuery, setRepoSearchQuery] = useState('');

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('smartrepo_theme');
    return (saved as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    localStorage.setItem('smartrepo_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('smartrepo_repos', JSON.stringify(repos));
  }, [repos]);

  useEffect(() => {
    localStorage.setItem('smartrepo_groups', JSON.stringify(groups));
  }, [groups]);

  useEffect(() => {
    localStorage.setItem('smartrepo_tabs', JSON.stringify(tabs));
  }, [tabs]);

  useEffect(() => {
    localStorage.setItem('smartrepo_activeTabId', JSON.stringify(activeTabId));
  }, [activeTabId]);

  // Load history for active tab when the app starts
  useEffect(() => {
    if (activeTabId && !histories[activeTabId]) {
      const activeRepoInfo = tabs.find(t => t.path === activeTabId);
      if (activeRepoInfo) {
        setIsLoading(true);
        invoke<RepoHistory>('get_repo_history', { path: activeTabId, branch: activeBranchId[activeTabId] || null })
          .then(hist => setHistories(prev => ({ ...prev, [activeTabId]: hist })))
          .catch(e => console.error('Failed to load initial history', e))
          .finally(() => setIsLoading(false));
      }
    }

    if (activeTabId) {
      invoke<RemoteInfo[]>('get_remotes', { path: activeTabId })
        .then(setRemotes)
        .catch(console.error);
        
      invoke<FileDiff[]>('get_repo_status', { path: activeTabId })
        .then(setRepoStatus)
        .catch(console.error);
    } else {
      setRemotes([]);
      setRepoStatus([]);
    }
  }, [activeTabId]);

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const addGroup = () => {
    const name = prompt('Enter group name:');
    if (name) {
      setGroups([...groups, { id: Date.now().toString(), name, isExpanded: true }]);
    }
  };

  const toggleGroup = (id: string) => {
    setGroups(groups.map(g => g.id === id ? { ...g, isExpanded: !g.isExpanded } : g));
  };

  const handleDragStart = (e: React.DragEvent, repoPath: string) => {
    setDraggedRepoPath(repoPath);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData('text/plain', repoPath);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, groupId?: string) => {
    e.preventDefault();
    const repoPath = draggedRepoPath || e.dataTransfer.getData('text/plain');
    if (repoPath) {
      setRepos(prev => prev.map(r => r.path === repoPath ? { ...r, groupId } : r));
    }
    setDraggedRepoPath(null);
  };

  const handleContextMenu = (e: React.MouseEvent, repoPath: string) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      repoPath
    });
  };

  const assignToGroup = (groupId?: string) => {
    if (contextMenu) {
      setRepos(prev => prev.map(r => r.path === contextMenu.repoPath ? { ...r, groupId } : r));
      setContextMenu(null);
    }
  };

  const scanFolder = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
      });

      if (selected && typeof selected === 'string') {
        setIsLoading(true);
        const result = await invoke<RepoInfo[]>('scan_repositories', { path: selected });
        
        // Merge unique repos
        const newRepos = [...repos];
        result.forEach(r => {
          if (!newRepos.find(existing => existing.path === r.path)) {
            newRepos.push(r);
          }
        });
        setRepos(newRepos);
        setIsLoading(false);
      }
    } catch (e) {
      console.error(e);
      alert('Error scanning folder: ' + e);
      setIsLoading(false);
    }
  };

  const activeRepo = tabs.find(t => t.path === activeTabId) || null;
  const history = activeTabId ? histories[activeTabId] : null;



  const loadRepo = async (repo: RepoInfo) => {
    let newTabs = [...tabs];
    
    const existingTabIndex = newTabs.findIndex(t => t.path === repo.path);
    if (existingTabIndex >= 0) {
      // Already open, just focus
      setActiveTabId(repo.path);
    } else {
      newTabs.push(repo);
      setTabs(newTabs);
      setActiveTabId(repo.path);
    }

    // Clear commit selection when switching
    setSelectedCommitHash(null);
    setCommitDetails(null);

    // Fetch history if not cached
    if (!histories[repo.path]) {
      setIsLoading(true);
      try {
        const hist = await invoke<RepoHistory>('get_repo_history', { path: repo.path, branch: activeBranchId[repo.path] || null });
        setHistories(prev => ({ ...prev, [repo.path]: hist }));
      } catch (e) {
        console.error(e);
        alert('Error loading history: ' + e);
      } finally {
        setIsLoading(false);
      }
    }
    
    // Refresh remotes and status
    try {
      const rem = await invoke<RemoteInfo[]>('get_remotes', { path: repo.path });
      setRemotes(rem);
      const stat = await invoke<FileDiff[]>('get_repo_status', { path: repo.path });
      setRepoStatus(stat);
    } catch(e) {
      console.error('Failed to load remotes/status', e);
    }
  };

  const reloadActiveRepo = async () => {
    if (!activeTabId) return;
    try {
      const hist = await invoke<RepoHistory>('get_repo_history', { path: activeTabId, branch: activeBranchId[activeTabId] || null });
      setHistories(prev => ({ ...prev, [activeTabId]: hist }));
      
      const rem = await invoke<RemoteInfo[]>('get_remotes', { path: activeTabId });
      setRemotes(rem);
      const stat = await invoke<FileDiff[]>('get_repo_status', { path: activeTabId });
      setRepoStatus(stat);
    } catch (e) {
      console.error('Failed to reload active repo', e);
    }
  };

  const handleBranchClick = async (branchName: string | null) => {
    if (!activeTabId) return;
    setActiveBranchId(prev => ({ ...prev, [activeTabId]: branchName }));
    setIsLoading(true);
    try {
      const hist = await invoke<RepoHistory>('get_repo_history', { path: activeTabId, branch: branchName });
      setHistories(prev => ({ ...prev, [activeTabId]: hist }));
    } catch (e) {
      console.error(e);
      alert('Error loading branch history: ' + e);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePull = async () => {
    if (!activeTabId) return;
    setIsLoading(true);
    try {
      const result = await invoke<string>('git_pull', { path: activeTabId });
      alert('Pull successful:\n' + result);
      // Reload history
      const hist = await invoke<RepoHistory>('get_repo_history', { path: activeTabId, branch: activeBranchId[activeTabId] || null });
      setHistories(prev => ({ ...prev, [activeTabId]: hist }));
    } catch (e) {
      alert('Pull failed:\n' + e);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePush = async () => {
    if (!activeTabId) return;

    if (repoStatus.length > 0) {
      setIsCommitPushModalOpen(true);
      return;
    }

    setIsLoading(true);
    try {
      const result = await invoke<string>('git_push', { path: activeTabId });
      alert('Push successful:\n' + result);
    } catch (e) {
      alert('Push failed:\n' + e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBranchCreate = () => {
    if (!activeTabId) return;
    setIsBranchModalOpen(true);
  };

  const handleCommit = async (andPush: boolean) => {
    if (!activeTabId || !commitMessage.trim()) return;
    setIsLoading(true);
    try {
      await invoke('git_commit', { path: activeTabId, message: commitMessage });
      setCommitMessage('');
      
      if (andPush) {
        await invoke('git_push', { path: activeTabId });
        alert('Committed and pushed successfully!');
      } else {
        alert('Committed successfully!');
      }
      
      await reloadActiveRepo();
    } catch (e) {
      alert('Failed to commit:\n' + e);
    } finally {
      setIsLoading(false);
    }
  };

  const closeTab = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    const newTabs = tabs.filter(t => t.path !== path);
    setTabs(newTabs);
    if (activeTabId === path) {
      setActiveTabId(newTabs.length > 0 ? newTabs[newTabs.length - 1].path : null);
    }
  };

  const handleCommitClick = async (hash: string) => {
    if (!activeRepo) return;
    setSelectedCommitHash(hash);
    setIsLoadingDetails(true);
    try {
      const details = await invoke<CommitDetails>('get_commit_details', { path: activeRepo.path, hash });
      setCommitDetails(details);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingDetails(false);
    }
  };


  return (
    <div className="flex h-screen w-screen bg-background text-foreground overflow-hidden font-sans">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-16'
        } flex flex-col border-r border-border transition-all duration-300 bg-muted/30 z-20`}
      >
        <div className="flex h-12 items-center justify-between px-4 border-b border-border">
          {sidebarOpen && (
            <div className="flex items-center space-x-2 select-none">
              <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain rounded-md" />
              <span className="font-bold text-sm tracking-tight text-foreground/90">PNS Repo Smart</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 hover:bg-muted rounded-md"
          >
            <FolderGit2 className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Content */}
        {sidebarOpen && (
          <div className="flex-1 overflow-y-auto p-2">
            <div className="mb-4 space-y-2">
              <button 
                onClick={() => { setModalDefaultTab('local'); setIsAddModalOpen(true); }}
                className="w-full flex items-center px-3 py-1.5 text-sm bg-primary/10 text-primary hover:bg-primary/20 rounded-md transition-colors border border-primary/20"
              >
                <FolderOpen className="w-4 h-4 mr-2" />
                Add Local Repo
              </button>
              <button 
                onClick={() => { setModalDefaultTab('clone'); setIsAddModalOpen(true); }}
                className="w-full flex items-center px-3 py-1.5 text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors shadow-sm"
              >
                <DownloadCloud className="w-4 h-4 mr-2" />
                Clone Remote
              </button>
              <button 
                onClick={scanFolder}
                className="w-full flex items-center px-3 py-1.5 text-sm bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground rounded-md transition-colors border border-border"
              >
                <FolderSearch className="w-4 h-4 mr-2" />
                Scan Folder...
              </button>
            </div>
            
            <div className="space-y-1">
              <div className="text-xs font-semibold text-muted-foreground uppercase px-2 py-1 flex justify-between items-center group">
                <span>Repositories</span>
                <button className="opacity-0 group-hover:opacity-100 hover:text-foreground" onClick={addGroup}>+</button>
              </div>

              {/* Repo Search */}
              <div className="px-2 mb-2 relative">
                <Search className="w-3.5 h-3.5 absolute left-4 top-1.5 text-muted-foreground/70" />
                <input 
                  type="text" 
                  value={repoSearchQuery}
                  onChange={(e) => setRepoSearchQuery(e.target.value)}
                  placeholder="Filter repos..." 
                  className="w-full pl-7 pr-2 py-1 text-xs border border-input rounded bg-background/50 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-background transition-colors"
                />
              </div>
              
              {/* Repo List */}
              <div className="space-y-0.5 mt-2">
                {groups.map((group) => {
                  const groupRepos = repos.filter(r => r.groupId === group.id && r.name.toLowerCase().includes(repoSearchQuery.toLowerCase()));
                  // If searching, auto-expand groups that have matching repos
                  const isExpanded = repoSearchQuery ? groupRepos.length > 0 : group.isExpanded;
                  
                  if (repoSearchQuery && groupRepos.length === 0) return null;

                  return (
                    <div 
                      key={group.id} 
                      className="mb-1"
                      onDragEnter={handleDragOver}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, group.id)}
                    >
                      <button 
                        onClick={() => toggleGroup(group.id)}
                        className="flex items-center w-full px-2 py-1.5 text-sm hover:bg-muted rounded-md text-left"
                      >
                        <ChevronDown className={`w-4 h-4 mr-1 opacity-70 transition-transform ${!isExpanded ? '-rotate-90' : ''}`} />
                        <FolderOpen className="w-4 h-4 mr-2 text-blue-500" />
                        <span className="flex-1 truncate font-semibold">{group.name}</span>
                        <span className="text-xs text-muted-foreground opacity-50">{groupRepos.length}</span>
                      </button>
                      
                      {isExpanded && (
                        <div className="pl-6 space-y-0.5 mt-0.5 min-h-[20px]">
                          {groupRepos.length === 0 && !repoSearchQuery && (
                            <div className="px-2 py-1 text-xs text-muted-foreground italic opacity-50">Empty</div>
                          )}
                          {groupRepos.map(repo => (
                            <button 
                              key={repo.path}
                              draggable
                              onDragStart={(e) => handleDragStart(e, repo.path)}
                              onContextMenu={(e) => handleContextMenu(e, repo.path)}
                              onClick={() => loadRepo(repo)}
                              className={`flex items-center w-full px-2 py-1 text-sm hover:bg-muted rounded-md text-left cursor-grab active:cursor-grabbing ${activeTabId === repo.path ? 'bg-muted/50' : ''}`}
                            >
                              <GitBranch className={`w-4 h-4 mr-2 ${activeTabId === repo.path ? 'text-green-500' : 'text-gray-500'}`} />
                              <span className="flex-1 truncate">{repo.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Ungrouped */}
                <div 
                  className="pt-2 mt-2 border-t border-border/50 min-h-[50px] pb-4"
                  onDragEnter={handleDragOver}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, undefined)}
                >
                  <div className="px-2 py-1 text-xs text-muted-foreground mb-1">Ungrouped</div>
                  {repos.filter(r => !r.groupId && r.name.toLowerCase().includes(repoSearchQuery.toLowerCase())).map((repo) => (
                    <button 
                      key={repo.path}
                      draggable
                      onDragStart={(e) => handleDragStart(e, repo.path)}
                      onContextMenu={(e) => handleContextMenu(e, repo.path)}
                      onClick={() => loadRepo(repo)}
                      className={`flex items-center w-full px-2 py-1.5 text-sm hover:bg-muted rounded-md text-left cursor-grab active:cursor-grabbing ${activeTabId === repo.path ? 'bg-muted/50' : ''}`}
                    >
                      <GitBranch className={`w-4 h-4 mr-2 ${activeTabId === repo.path ? 'text-green-500' : 'text-gray-500'}`} />
                      <span className="flex-1 truncate font-medium">{repo.name}</span>
                    </button>
                  ))}
                  {repos.filter(r => !r.groupId && r.name.toLowerCase().includes(repoSearchQuery.toLowerCase())).length === 0 && (
                    <div className="px-2 py-1 text-xs text-muted-foreground italic opacity-50">
                      {repoSearchQuery ? 'No matching repos' : 'No ungrouped repos'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sidebar Footer */}
        <div className="p-2 border-t border-border flex justify-between">
          <button 
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="flex items-center justify-center p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
          <button 
            onClick={() => setIsSettingsModalOpen(true)}
            className="flex items-center justify-center p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
            title="Global Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-background relative">
        {/* Top Header / Tabs */}
        <div className="h-10 flex border-b border-border bg-muted/10 items-end px-2 pt-1 relative overflow-x-auto overflow-y-hidden no-scrollbar">
          <div className="absolute top-2 right-4 text-xs font-semibold text-muted-foreground/50 pointer-events-none z-10">
            PNS Repo Smart © 2026
          </div>
          <div className="flex space-x-1">
            {tabs.map((tab) => (
              <div 
                key={tab.path}
                onClick={() => setActiveTabId(tab.path)}
                className={`flex items-center px-4 py-1.5 border border-b-0 rounded-t-md text-sm cursor-pointer min-w-[140px] max-w-[200px] transition-colors ${
                  activeTabId === tab.path 
                    ? 'bg-background border-border text-foreground' 
                    : 'bg-muted/30 border-transparent text-muted-foreground hover:bg-muted/50'
                }`}
              >
                <GitBranch className={`w-4 h-4 mr-2 shrink-0 ${activeTabId === tab.path ? 'text-green-500' : 'opacity-70'}`} />
                <span className="truncate flex-1">{tab.name}</span>
                <button 
                  className="ml-2 opacity-50 hover:opacity-100 px-1 rounded hover:bg-muted shrink-0" 
                  onClick={(e) => closeTab(e, tab.path)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Toolbar */}
        <div className="h-12 border-b border-border flex items-center px-4 justify-between bg-card">
          <div className="flex items-center space-x-4">
            <div className="flex space-x-1">
              <button 
                onClick={handlePull}
                className="px-3 py-1.5 text-sm hover:bg-muted rounded-md text-muted-foreground font-medium disabled:opacity-50" 
                disabled={!activeRepo}
              >Pull</button>
              <button 
                onClick={handlePush}
                className="px-3 py-1.5 text-sm hover:bg-muted rounded-md text-muted-foreground font-medium disabled:opacity-50" 
                disabled={!activeRepo}
              >Push</button>
              <button 
                onClick={handleBranchCreate}
                className="px-3 py-1.5 text-sm hover:bg-muted rounded-md text-muted-foreground font-medium disabled:opacity-50" 
                disabled={!activeRepo}
              >Branch</button>
            </div>
            
            <div className="h-6 w-px bg-border"></div>
            
            <div className="flex space-x-2">
              <button 
                onClick={() => setActiveMainTab('history')}
                className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${activeMainTab === 'history' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
              >
                History
              </button>
              <button 
                onClick={() => setActiveMainTab('changes')}
                className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors flex items-center ${activeMainTab === 'changes' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
              >
                Changes
                {repoStatus.length > 0 && (
                  <span className="ml-1.5 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                    {repoStatus.length}
                  </span>
                )}
              </button>
            </div>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2.5 top-2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search commits..." 
              className="pl-8 pr-3 py-1.5 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring w-64"
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left panel: Local/Remote Branches */}
          <div className="w-60 border-r border-border flex flex-col bg-muted/10">
            <div className="p-3 border-b border-border text-sm font-semibold flex items-center">
              <GitBranch className="w-4 h-4 mr-2" />
              Branches
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-4">
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-1">Local</div>
                <div className="space-y-0.5">
                  <div 
                    onClick={() => handleBranchClick(null)}
                    className={`px-2 py-1 text-sm hover:bg-muted rounded flex items-center cursor-pointer ${(!activeTabId || !activeBranchId[activeTabId]) ? 'bg-muted/50 font-semibold' : ''}`}
                  >
                    <span className="w-2 h-2 rounded-full bg-primary/20 mr-2"></span>
                    All Branches
                  </div>
                  {history?.local_branches.map(branch => (
                    <div 
                      key={branch} 
                      onClick={() => handleBranchClick(branch)}
                      className={`px-2 py-1 text-sm hover:bg-muted rounded flex items-center cursor-pointer ${(activeTabId && activeBranchId[activeTabId] === branch) ? 'bg-muted/50 font-semibold text-primary' : ''}`}
                    >
                      <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                      {branch.replace('refs/heads/', '')}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-1">Remote</div>
                <div className="space-y-2 text-muted-foreground">
                  {(() => {
                    if (!history) return null;
                    const remotes: Record<string, { full: string, short: string }[]> = {};
                    history.remote_branches.forEach(branch => {
                      const parts = branch.replace('refs/remotes/', '').split('/');
                      const remoteName = parts[0];
                      const branchName = parts.slice(1).join('/');
                      if (!remotes[remoteName]) remotes[remoteName] = [];
                      remotes[remoteName].push({ full: branch, short: branchName });
                    });
                    
                    return Object.entries(remotes).map(([remoteName, branches]) => (
                      <div key={remoteName} className="space-y-0.5">
                        <div className="px-2 text-xs font-medium opacity-70 mb-0.5 uppercase tracking-wide">{remoteName}</div>
                        {branches.map(b => (
                          <div 
                            key={b.full} 
                            onClick={() => handleBranchClick(b.full)}
                            className={`px-2 py-1 text-sm hover:bg-muted rounded flex items-center cursor-pointer ml-1 ${(activeTabId && activeBranchId[activeTabId] === b.full) ? 'bg-muted/50 font-semibold text-primary' : ''}`}
                          >
                            <span className="w-2 h-2 rounded-full bg-gray-500 mr-2"></span>
                            {b.short}
                          </div>
                        ))}
                      </div>
                    ));
                  })()}
                </div>
              </div>
              
              <div className="pt-2 mt-2 border-t border-border/50">
                <div className="text-xs font-semibold text-muted-foreground mb-1">Remotes</div>
                <div className="space-y-0.5 text-muted-foreground">
                  {remotes.map(r => (
                    <div key={r.name} className="px-2 py-1.5 text-sm hover:bg-muted rounded flex flex-col cursor-pointer">
                      <span className="font-medium text-foreground flex items-center">
                        <DownloadCloud className="w-3 h-3 mr-2" />
                        {r.name}
                      </span>
                      <span className="text-xs opacity-70 truncate ml-5" title={r.url}>{r.url}</span>
                    </div>
                  ))}
                  {remotes.length === 0 && (
                    <div className="px-2 py-1 text-xs italic opacity-50">No remotes</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main Workspace Area */}
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 flex flex-col relative">
              {isLoading && (
                <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-50">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              )}
              
              {activeMainTab === 'history' ? (
                <>
                  {/* Table Header */}
                  <div className="grid grid-cols-[auto_1fr_150px_150px] gap-4 px-4 py-2 border-b border-border bg-muted/20 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <div className="w-20 text-center">Graph</div>
                    <div>Message</div>
                    <div>Author</div>
                    <div>Date</div>
                  </div>
                  {/* Scrollable list */}
                  <div className="flex-1 overflow-hidden bg-background">
                     {history && history.commits.length > 0 ? (
                       <GitGraph commits={history.commits} onCommitClick={handleCommitClick} />
                     ) : (
                       <div className="h-full flex items-center justify-center text-center space-y-4 p-4">
                         <TerminalSquare className="w-12 h-12 text-muted-foreground mx-auto opacity-20" />
                         <h2 className="text-lg font-medium text-muted-foreground">No Repository Selected</h2>
                         <p className="text-sm text-muted-foreground max-w-sm">
                           Select a repository from the sidebar to view its commit history.
                         </p>
                       </div>
                     )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col p-4 overflow-y-auto bg-muted/5">
                  <h2 className="text-lg font-semibold mb-4 border-b border-border pb-2">Uncommitted Changes</h2>
                  
                  {/* Commit Input Area */}
                  <div className="mb-6 bg-card border border-border rounded-lg p-3 shadow-sm flex flex-col gap-3">
                    <textarea 
                      value={commitMessage}
                      onChange={(e) => setCommitMessage(e.target.value)}
                      placeholder="Commit message (e.g. 'feat: added branch modal')"
                      className="w-full min-h-[80px] bg-background border border-input rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-y"
                    />
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleCommit(false)}
                        disabled={!commitMessage.trim() || isLoading || repoStatus.length === 0}
                        className="px-4 py-1.5 bg-muted text-foreground rounded-md text-sm font-medium hover:bg-muted/80 disabled:opacity-50 transition-colors"
                      >
                        Commit
                      </button>
                      <button 
                        onClick={() => handleCommit(true)}
                        disabled={!commitMessage.trim() || isLoading || repoStatus.length === 0}
                        className="px-4 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                      >
                        Commit & Push
                      </button>
                    </div>
                  </div>

                  {repoStatus.length > 0 ? (
                    <div className="space-y-1 bg-card border border-border rounded-lg overflow-hidden">
                      {repoStatus.map((file, i) => (
                        <div key={i} className="flex items-center px-4 py-2 hover:bg-muted/50 border-b border-border last:border-0">
                          <span className={`w-2 h-2 rounded-full mr-3 shrink-0 ${
                            file.status === 'Added' ? 'bg-green-500' :
                            file.status === 'Modified' ? 'bg-yellow-500' :
                            file.status === 'Deleted' ? 'bg-red-500' : 'bg-gray-500'
                          }`}></span>
                          <span className="text-sm flex-1 truncate">{file.path}</span>
                          <span className={`text-xs px-2 py-0.5 rounded uppercase font-semibold ${
                            file.status === 'Added' ? 'bg-green-500/10 text-green-600' :
                            file.status === 'Modified' ? 'bg-yellow-500/10 text-yellow-600' :
                            file.status === 'Deleted' ? 'bg-red-500/10 text-red-600' : 'bg-gray-500/10 text-gray-600'
                          }`}>{file.status}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <div className="w-12 h-12 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-foreground mb-1">Working tree clean</h3>
                      <p className="text-sm">Nothing to commit, working directory clean.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Panel for Commit Details */}
            {activeMainTab === 'history' && selectedCommitHash && (
              <div className="w-[350px] border-l border-border bg-card flex flex-col shadow-[-4px_0_15px_rgba(0,0,0,0.1)] z-10">
                <div className="p-4 border-b border-border bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-bold font-mono px-2 py-0.5 bg-primary/10 text-primary rounded">{selectedCommitHash.substring(0, 7)}</div>
                    <button className="text-muted-foreground hover:text-foreground p-1" onClick={() => setSelectedCommitHash(null)}>✕</button>
                  </div>
                  <div className="text-sm font-semibold text-foreground break-words">{commitDetails?.message || 'Loading...'}</div>
                  {commitDetails && (
                    <div className="text-xs text-muted-foreground mt-3 flex items-center">
                      <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center mr-2 font-bold">{commitDetails.author.charAt(0)}</span>
                      <div>
                        <div className="font-medium text-foreground">{commitDetails.author}</div>
                        <div>{new Date(commitDetails.timestamp * 1000).toLocaleString()}</div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                  {isLoadingDetails ? (
                     <div className="flex items-center justify-center h-full">
                       <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                     </div>
                  ) : (
                     <div className="space-y-1 text-sm">
                       <div className="text-xs font-semibold text-muted-foreground uppercase px-2 mb-2 pt-2 border-b border-border pb-2">
                         {commitDetails?.files.length || 0} files changed
                       </div>
                       {commitDetails?.files.map((file, i) => (
                         <div key={i} className="flex items-center px-2 py-1.5 hover:bg-muted rounded-md cursor-pointer group">
                           <div className={`w-1.5 h-4 rounded-full mr-3 shrink-0 ${file.status === 'Added' ? 'bg-green-500' : file.status === 'Deleted' ? 'bg-red-500' : file.status === 'Renamed' ? 'bg-orange-500' : 'bg-blue-500'}`}></div>
                           <span className="truncate flex-1 text-foreground/80 group-hover:text-foreground text-xs font-mono">{file.path}</span>
                         </div>
                       ))}
                     </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Status Bar */}
        <div className="h-7 border-t border-border bg-muted/30 flex items-center justify-between px-3 text-[11px] text-muted-foreground select-none">
          <div className="flex items-center space-x-3">
            <span className="font-medium text-foreground/70">© 2026 PNS Repo Smart</span>
            <span className="opacity-50">|</span>
            <span className="opacity-70">Apache 2.0 with Commons Clause (Not for Sale)</span>
          </div>
          <div className="flex items-center space-x-4">
            <button className="hover:text-foreground transition-colors flex items-center">ⓘ About</button>
            <button className="hover:text-foreground transition-colors flex items-center">🔗 Share</button>
            <button className="hover:text-foreground transition-colors flex items-center">💬 Feedback</button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddRepoModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        defaultTab={modalDefaultTab}
        onSuccess={(repo) => {
          if (!repos.find(r => r.path === repo.path)) {
            setRepos([...repos, repo]);
          }
          loadRepo(repo);
        }} 
      />
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
      <BranchModal
        isOpen={isBranchModalOpen}
        onClose={() => setIsBranchModalOpen(false)}
        repoPath={activeTabId || ''}
        branches={history?.local_branches || []}
        currentBranch={activeRepo?.current_branch || null}
        onBranchCreated={reloadActiveRepo}
      />
      <CommitPushModal
        isOpen={isCommitPushModalOpen}
        onClose={() => setIsCommitPushModalOpen(false)}
        repoPath={activeTabId || ''}
        onSuccess={reloadActiveRepo}
      />

      {/* Context Menu */}
      {contextMenu && contextMenu.visible && (
        <div 
          className="fixed z-50 bg-popover border border-border rounded-md shadow-md py-1 min-w-[160px] text-sm text-popover-foreground overflow-hidden"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase border-b border-border/50 mb-1">Move to Group</div>
          {groups.map(g => (
            <button 
              key={g.id}
              onClick={() => assignToGroup(g.id)}
              className="w-full text-left px-3 py-1.5 hover:bg-muted transition-colors truncate"
            >
              {g.name}
            </button>
          ))}
          <button 
            onClick={() => assignToGroup(undefined)}
            className="w-full text-left px-3 py-1.5 hover:bg-muted transition-colors text-muted-foreground italic border-t border-border/50 mt-1"
          >
            Ungrouped
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
