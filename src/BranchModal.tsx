import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { X, GitBranch, Plus, Loader2 } from 'lucide-react';

interface BranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  repoPath: string;
  branches: string[];
  currentBranch: string | null;
  onBranchCreated: () => void;
}

export function BranchModal({ isOpen, onClose, repoPath, branches, currentBranch, onBranchCreated }: BranchModalProps) {
  const [newBranchName, setNewBranchName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleCreateBranch = async () => {
    if (!newBranchName.trim()) return;
    setIsLoading(true);
    try {
      await invoke('create_branch', { path: repoPath, name: newBranchName.trim() });
      setNewBranchName('');
      onBranchCreated();
    } catch (e) {
      alert('Failed to create branch: ' + e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card border border-border rounded-lg shadow-xl w-[450px] overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <h2 className="text-sm font-semibold flex items-center">
            <GitBranch className="w-4 h-4 mr-2" />
            Manage Branches
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-md text-muted-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-4 overflow-hidden">
          {/* Create New Branch */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Create New Branch</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateBranch()}
                placeholder="feature/new-branch-name"
                className="flex-1 px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                disabled={isLoading}
              />
              <button 
                onClick={handleCreateBranch}
                disabled={isLoading || !newBranchName.trim()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
                Add
              </button>
            </div>
          </div>

          {/* Existing Branches List */}
          <div className="flex-1 flex flex-col min-h-0">
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Local Branches</label>
            <div className="flex-1 overflow-y-auto border border-border rounded-md bg-background">
              {branches.length > 0 ? (
                branches.map(branch => {
                  const isCurrent = branch === `refs/heads/${currentBranch}`;
                  const branchName = branch.replace('refs/heads/', '');
                  return (
                    <div 
                      key={branch} 
                      className={`px-3 py-2 text-sm border-b border-border last:border-0 flex items-center justify-between hover:bg-muted/50 ${isCurrent ? 'bg-primary/5' : ''}`}
                    >
                      <div className="flex items-center">
                        <GitBranch className="w-3.5 h-3.5 mr-2 opacity-50" />
                        <span className={isCurrent ? 'font-semibold text-primary' : ''}>{branchName}</span>
                      </div>
                      {isCurrent && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-medium uppercase">Current</span>}
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">No branches found</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
