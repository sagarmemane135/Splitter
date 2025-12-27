import React, { useState } from 'react';
import { CopyIcon } from './icons/CopyIcon';
import { WhatsAppIcon } from './icons/WhatsAppIcon';

interface CollaborationManagerProps {
  peerId: string | null;
  connections: any[];
  onJoinSession: (peerId: string, name: string) => void;
  onClose: () => void;
  activeGroupName: string | null;
  initialPeerId?: string | null;
}

const CollaborationManager: React.FC<CollaborationManagerProps> = ({ peerId, connections, onJoinSession, onClose, activeGroupName, initialPeerId }) => {
  const [remotePeerId, setRemotePeerId] = useState(initialPeerId || '');
  const [userName, setUserName] = useState('');
  const [copied, setCopied] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (remotePeerId.trim() && userName.trim()) {
      setIsConnecting(true);
      onJoinSession(remotePeerId.trim(), userName.trim());
      // Reset after 15 seconds (connection timeout)
      setTimeout(() => setIsConnecting(false), 15000);
    }
  };

  const handleCopy = () => {
    if (peerId) {
      navigator.clipboard.writeText(peerId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  const handleShareOnWhatsApp = () => {
    if (!peerId || !activeGroupName) return;
    const appUrl = `${window.location.origin}${window.location.pathname}?join=${peerId}`;
    const message = `Join my expense group "${activeGroupName}" on Splitter! Click the link to join:\n\n${appUrl}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-surface rounded-lg shadow-2xl p-4 sm:p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-4 text-on-surface">Collaboration</h2>
        
        {activeGroupName ? (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-on-surface-secondary mb-2">Invite others to "{activeGroupName}"</h3>
            <p className="text-xs text-on-surface-secondary mb-2">Share a link to let others join your active group.</p>
            
            <button
              onClick={handleShareOnWhatsApp}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-3 rounded-md transition-colors flex items-center justify-center gap-2"
              disabled={!peerId}
              title="Share on WhatsApp"
            >
              <WhatsAppIcon />
              Share via WhatsApp
            </button>
            
            <div className="flex items-center my-4">
                <div className="flex-grow border-t border-gray-600"></div>
                <span className="flex-shrink mx-4 text-on-surface-secondary text-sm">or</span>
                <div className="flex-grow border-t border-gray-600"></div>
            </div>
            
            <p className="text-xs text-on-surface-secondary mb-1 text-center">copy the ID manually:</p>

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
          </div>
        ) : (
          <div className="mb-6 p-4 text-center bg-background/50 rounded-lg border border-gray-700">
            <p className="text-on-surface-secondary">Create or select a group to invite others.</p>

          </div>
        )}

        <div className="border-t border-gray-700 my-6"></div>

        <form onSubmit={handleJoin}>
            <h3 className="text-xl font-bold mb-4 text-on-surface">Join a Group</h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-on-surface-secondary mb-2">Friend's Session ID</label>
                    <input
                      type="text"
                      value={remotePeerId}
                      onChange={(e) => setRemotePeerId(e.target.value)}
                      placeholder="Enter Session ID from link"
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
                      autoFocus={!!initialPeerId}
                    />
                </div>
            </div>
            <button 
              type="submit" 
              className="mt-4 w-full bg-secondary hover:opacity-80 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
              disabled={isConnecting}
            >
              {isConnecting ? 'Connecting...' : 'Join & Sync'}
            </button>
        </form>

        <div className="mt-6">
            <h3 className="text-lg font-semibold text-on-surface-secondary mb-2">Connection Status</h3>
            <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${peerId ? 'bg-green-500' : 'bg-yellow-500'} ${peerId ? 'animate-pulse' : ''}`}></div>
                <p className="text-on-surface text-sm">
                    {!peerId && 'Initializing...'}
                    {peerId && connections.length === 0 && 'Ready to connect'}
                    {peerId && connections.length > 0 && `Connected to ${connections.length} peer(s)`}
                </p>
            </div>
            
            {peerId && connections.length === 0 && activeGroupName && (
                <div className="mt-3 p-3 bg-blue-900/20 border border-blue-500/30 rounded text-xs text-blue-300">
                    <strong>💡 Tips for better connectivity:</strong>
                    <ul className="mt-1 ml-4 list-disc space-y-1">
                        <li>Keep this page open while others join</li>
                        <li>Ensure stable internet on both devices</li>
                        <li>If connection fails, try refreshing both devices</li>
                        <li>Mobile networks may take 10-15 seconds to connect</li>
                    </ul>
                </div>
            )}
        </div>
        
        <button onClick={onClose} className="mt-6 w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md transition">
          Close
        </button>
      </div>
    </div>
  );
};

export default CollaborationManager;