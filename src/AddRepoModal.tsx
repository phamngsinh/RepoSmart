import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { FolderGit2, DownloadCloud, X, Loader2, FolderSearch } from 'lucide-react';

interface AddRepoModalProps {
  isOpen: boolean;
  defaultTab?: 'local' | 'clone';
  onClose: () => void;
  onSuccess: (repo: any) => void;
}

export function AddRepoModal({ isOpen, defaultTab = 'local', onClose, onSuccess }: AddRepoModalProps) {
  const [tab, setTab] = useState<'local' | 'clone'>(defaultTab);
  const [localPath, setLocalPath] = useState('');
  const [cloneUrl, setCloneUrl] = useState('');
  const [cloneDest, setCloneDest] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // React to defaultTab changes when modal opens
  useEffect(() => {
    if (isOpen) {
      setTab(defaultTab);
    }
  }, [isOpen, defaultTab]);

  if (!isOpen) return null;

  const handleAddLocal = async () => {
    if (!localPath) return;
    setIsLoading(true);
    setError(null);
    try {
      const repo = await invoke('open_local_repo', { path: localPath });
      onSuccess(repo);
      onClose();
    } catch (err: any) {
      setError(err.toString());
    } finally {
      setIsLoading(false);
    }
  };

  const handleClone = async () => {
    if (!cloneUrl || !cloneDest) return;
    setIsLoading(true);
    setError(null);
    try {
      const repo = await invoke('clone_repo', { url: cloneUrl, path: cloneDest });
      onSuccess(repo);
      onClose();
    } catch (err: any) {
      setError(err.toString());
    } finally {
      setIsLoading(false);
    }
  };

  const handleBrowseLocal = async () => {
    try {
      const selected = await open({ directory: true, multiple: false });
      if (selected && typeof selected === 'string') {
        setLocalPath(selected);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleBrowseDest = async () => {
    try {
      const selected = await open({ directory: true, multiple: false });
      if (selected && typeof selected === 'string') {
        setCloneDest(selected);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card border border-border rounded-lg shadow-xl w-[500px] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <h2 className="font-semibold">Add Repository</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex border-b border-border">
          <button 
            className={`flex-1 py-2 text-sm font-medium transition-colors ${tab === 'local' ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'}`}
            onClick={() => setTab('local')}
          >
            <FolderGit2 className="w-4 h-4 inline-block mr-2" />
            Open Local
          </button>
          <button 
            className={`flex-1 py-2 text-sm font-medium transition-colors ${tab === 'clone' ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'}`}
            onClick={() => setTab('clone')}
          >
            <DownloadCloud className="w-4 h-4 inline-block mr-2" />
            Clone Remote
          </button>
        </div>

        <div className="p-5">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm px-3 py-2 rounded mb-4 break-words">
              {error}
            </div>
          )}

          {tab === 'local' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Local Directory Path</label>
                <div className="flex space-x-2">
                  <input 
                    type="text" 
                    value={localPath}
                    onChange={(e) => setLocalPath(e.target.value)}
                    placeholder="e.g. C:\Projects\my-app"
                    className="flex-1 px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    disabled={isLoading}
                  />
                  <button 
                    onClick={handleBrowseLocal}
                    disabled={isLoading}
                    className="px-3 py-2 bg-muted hover:bg-muted/80 text-foreground border border-input rounded-md transition-colors"
                  >
                    <FolderSearch className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <button 
                onClick={handleAddLocal}
                disabled={isLoading || !localPath}
                className="w-full py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading...</> : 'Open Repository'}
              </button>
            </div>
          )}

          {tab === 'clone' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Git Repository URL</label>
                <input 
                  type="text" 
                  value={cloneUrl}
                  onChange={(e) => setCloneUrl(e.target.value)}
                  placeholder="https://github.com/user/repo.git"
                  className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Destination Directory</label>
                <div className="flex space-x-2">
                  <input 
                    type="text" 
                    value={cloneDest}
                    onChange={(e) => setCloneDest(e.target.value)}
                    placeholder="e.g. C:\Projects\new-repo"
                    className="flex-1 px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    disabled={isLoading}
                  />
                  <button 
                    onClick={handleBrowseDest}
                    disabled={isLoading}
                    className="px-3 py-2 bg-muted hover:bg-muted/80 text-foreground border border-input rounded-md transition-colors"
                  >
                    <FolderSearch className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <button 
                onClick={handleClone}
                disabled={isLoading || !cloneUrl || !cloneDest}
                className="w-full py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Cloning Repository...</> : 'Clone Repository'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
