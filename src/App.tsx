import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { FolderGit2, FolderOpen, Settings, ChevronRight, ChevronDown, GitBranch, TerminalSquare, Search } from 'lucide-react';
import { GitGraph, GitGraphProps } from './GitGraph';
import './App.css';

interface RepoInfo {
  name: string;
  path: string;
  current_branch: string | null;
}

interface RepoHistory {
  commits: GitGraphProps['commits'];
  local_branches: string[];
  remote_branches: string[];
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [repos, setRepos] = useState<RepoInfo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<RepoInfo | null>(null);
  const [history, setHistory] = useState<RepoHistory | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const scanFolder = async () => {
    try {
      // Hardcoded for testing, ideally use a dialog to pick folder
      const result = await invoke<RepoInfo[]>('scan_repositories', { path: 'c:\\www' });
      setRepos(result);
    } catch (e) {
      console.error(e);
      alert('Error scanning folder: ' + e);
    }
  };

  const loadRepo = async (repo: RepoInfo) => {
    setSelectedRepo(repo);
    setIsLoading(true);
    try {
      const hist = await invoke<RepoHistory>('get_repo_history', { path: repo.path });
      setHistory(hist);
    } catch (e) {
      console.error(e);
      alert('Error loading history: ' + e);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="flex h-screen w-screen bg-background text-foreground overflow-hidden font-sans">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-16'
        } flex flex-col border-r border-border transition-all duration-300 bg-muted/30`}
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
            <div className="space-y-1">
              <div className="text-xs font-semibold text-muted-foreground uppercase px-2 py-1 flex justify-between items-center group">
                <span>Groups</span>
                <button className="opacity-0 group-hover:opacity-100 hover:text-foreground">+</button>
              </div>
              
              {/* Dynamic Group */}
              <div>
                <button className="flex items-center w-full px-2 py-1.5 text-sm hover:bg-muted rounded-md text-left">
                  <ChevronDown className="w-4 h-4 mr-1 opacity-70" />
                  <FolderOpen className="w-4 h-4 mr-2 text-blue-500" />
                  <span className="flex-1 truncate">c:\www</span>
                </button>
                <div className="pl-6 space-y-0.5 mt-0.5">
                  {repos.map((repo) => (
                    <button 
                      key={repo.path}
                      onClick={() => loadRepo(repo)}
                      className={`flex items-center w-full px-2 py-1 text-sm hover:bg-muted rounded-md text-left ${selectedRepo?.path === repo.path ? 'bg-muted/50' : ''}`}
                    >
                      <GitBranch className={`w-4 h-4 mr-2 ${selectedRepo?.path === repo.path ? 'text-green-500' : 'text-gray-500'}`} />
                      <span className="flex-1 truncate">{repo.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sidebar Footer */}
        <div className="p-2 border-t border-border">
          <button className="flex items-center justify-center w-full p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-background relative">
        {/* Top Header / Tabs */}
        <div className="h-10 flex border-b border-border bg-muted/10 items-end px-2 pt-1 relative">
          <div className="absolute top-2 right-4 text-xs font-semibold text-muted-foreground/50 pointer-events-none">
            PNS Repo Smart © 2026
          </div>
          {selectedRepo && (
            <div className="flex items-center px-4 py-1.5 bg-background border border-b-0 border-border rounded-t-md text-sm cursor-default min-w-[150px]">
              <GitBranch className="w-4 h-4 mr-2 text-green-500" />
              <span className="truncate">{selectedRepo.name}</span>
              <button className="ml-auto opacity-50 hover:opacity-100 px-1" onClick={() => setSelectedRepo(null)}>×</button>
            </div>
          )}
        </div>

        {/* Toolbar */}
        <div className="h-12 border-b border-border flex items-center px-4 justify-between bg-card">
          <div className="flex items-center space-x-2">
            <button 
              onClick={scanFolder}
              className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md shadow hover:bg-primary/90 flex items-center"
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              Scan c:\www
            </button>
            <div className="h-4 w-px bg-border mx-2"></div>
            <div className="flex space-x-1">
              <button className="px-3 py-1.5 text-sm hover:bg-muted rounded-md text-muted-foreground font-medium disabled:opacity-50" disabled={!selectedRepo}>Pull</button>
              <button className="px-3 py-1.5 text-sm hover:bg-muted rounded-md text-muted-foreground font-medium disabled:opacity-50" disabled={!selectedRepo}>Push</button>
              <button className="px-3 py-1.5 text-sm hover:bg-muted rounded-md text-muted-foreground font-medium disabled:opacity-50" disabled={!selectedRepo}>Branch</button>
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
                  {history?.local_branches.map(branch => (
                    <div key={branch} className="px-2 py-1 text-sm hover:bg-muted rounded flex items-center cursor-pointer">
                      <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                      {branch.replace('refs/heads/', '')}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-1">Remote</div>
                <div className="space-y-0.5 text-muted-foreground">
                  {history?.remote_branches.map(branch => (
                    <div key={branch} className="px-2 py-1 text-sm hover:bg-muted rounded flex items-center cursor-pointer">
                      <span className="w-2 h-2 rounded-full bg-gray-500 mr-2"></span>
                      {branch.replace('refs/remotes/', '')}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Graph & Commit list */}
          <div className="flex-1 flex flex-col relative">
            {isLoading && (
              <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}
            
            {/* Table Header */}
            <div className="grid grid-cols-[auto_1fr_150px_150px] gap-4 px-4 py-2 border-b border-border bg-muted/20 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <div className="w-20 text-center">Graph</div>
              <div>Message</div>
              <div>Author</div>
              <div>Date</div>
            </div>
            {/* Scrollable list (Placeholder for React Flow graph) */}
            <div className="flex-1 overflow-hidden bg-background">
               {history && history.commits.length > 0 ? (
                 <GitGraph commits={history.commits} />
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
    </div>
  );
}

export default App;
