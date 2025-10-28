import React, { useState } from 'react';
import { CopyIcon } from './icons/CopyIcon';

interface CollaborationManagerProps {
  peerId: string | null;
  connections: any[];
  onJoinSession: (peerId: string, name: string) => void;
  onClose: () => void;
  activeGroupName: string | null;
}

const CollaborationManager: React.FC<CollaborationManagerProps> = ({ peerId, connections, onJoinSession, onClose, activeGroupName }) => {
  const [remotePeerId, setRemotePeerId] = useState('');
  const [userName, setUserName] = useState('');
  const [copied, setCopied] = useState(false);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (remotePeerId.trim() && userName.trim()) {
      onJoinSession(remotePeerId.trim(), userName.trim());
    }
  };

  const handleCopy = () => {
    if (peerId) {
      navigator.clipboard.writeText(peerId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-surface rounded-lg shadow-2xl p-4 sm:p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-4 text-on-surface">Collaboration</h2>
        
        {/* Invite Section */}
        {activeGroupName ? (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-on-surface-secondary mb-2">Invite others to "{activeGroupName}"</h3>
            <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={peerId || 'Initializing...'}
                  className="flex-grow bg-background border border-gray-600 rounded-md px-3 py-2 text-on-surface-secondary"
                  aria-label="Your Session ID"
                />
                <button 
                  onClick={handleCopy} 
                  className="bg-primary hover:bg-primary-focus text-white font-bold py-2 px-3 rounded-md transition-colors flex items-center gap-2"
                  disabled={!peerId}
                  title="Copy Session ID"
                >
                    <CopyIcon />
                    {copied ? 'Copied!' : 'Copy'}
                </button>
            </div>
            <p className="text-xs text-on-surface-secondary mt-1">Share this ID to let others join your active group.</p>
          </div>
        ) : (
          <div className="mb-6 p-4 text-center bg-background/50 rounded-lg border border-gray-700">
            <p className="text-on-surface-secondary">Create or select a group to invite others.</p>
          </div>
        )}

        <div className="border-t border-gray-700 my-6"></div>

        {/* Join Section */}
        <form onSubmit={handleJoin}>
            <h3 className="text-xl font-bold mb-4 text-on-surface">Join a Group</h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-on-surface-secondary mb-2">Friend's Session ID</label>
                    <input
                      type="text"
                      value={remotePeerId}
                      onChange={(e) => setRemotePeerId(e.target.value)}
                      placeholder="Enter Session ID"
                      className="w-full bg-background border border-gray-600 rounded-md px-3 py-2 text-on-surface focus:ring-primary focus:border-primary transition"
                      required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-on-surface-secondary mb-2">Your Name</label>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Enter your name for this session"
                      className="w-full bg-background border border-gray-600 rounded-md px-3 py-2 text-on-surface focus:ring-primary focus:border-primary transition"
                      required
                    />
                </div>
            </div>
            <button type="submit" className="mt-4 w-full bg-secondary hover:opacity-80 text-white font-bold py-2 px-4 rounded-md transition-colors">
              Join & Sync
            </button>
        </form>

        <div className="mt-6">
            <h3 className="text-lg font-semibold text-on-surface-secondary mb-2">Connection Status</h3>
            <p className="text-on-surface">
                {connections.length > 0 
                    ? `Connected to ${connections.length} peer(s).`
                    : 'Not connected to any peers.'
                }
            </p>
        </div>
        
        <button onClick={onClose} className="mt-6 w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md transition">
          Close
        </button>
      </div>
    </div>
  );
};

export default CollaborationManager;