import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { X, Loader2 } from 'lucide-react';

interface CommitPushModalProps {
  isOpen: boolean;
  onClose: () => void;
  repoPath: string;
  onSuccess: () => void;
}

export function CommitPushModal({ isOpen, onClose, repoPath, onSuccess }: CommitPushModalProps) {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleCommitPush = async () => {
    if (!message.trim()) return;
    setIsLoading(true);
    try {
      await invoke('git_commit', { path: repoPath, message: message.trim() });
      await invoke('git_push', { path: repoPath });
      alert('Committed and pushed successfully!');
      onSuccess();
      onClose();
      setMessage('');
    } catch (e) {
      alert('Failed to commit and push:\n' + e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card border border-border rounded-lg shadow-xl w-[400px] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <h2 className="text-sm font-semibold">Uncommitted Changes</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-md text-muted-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            You have uncommitted changes. Please enter a commit message to commit and push them.
          </p>
          <textarea 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Commit message..."
            className="w-full min-h-[80px] bg-background border border-input rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-y"
            disabled={isLoading}
          />
          <div className="flex justify-end gap-2">
            <button 
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 bg-muted text-foreground rounded-md text-sm font-medium hover:bg-muted/80 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleCommitPush}
              disabled={isLoading || !message.trim()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Commit & Push
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
