import { useState, useEffect, useRef, useCallback } from 'react';
import { CollabPayload } from '../types';

declare global {
  interface Window {
    Peer: any;
  }
}

export const useCollaboration = (onDataReceived: (data: CollabPayload, conn: any) => void) => {
  const [peerId, setPeerId] = useState<string | null>(null);
  const [connections, setConnections] = useState<any[]>([]);
  const peerRef = useRef<any>(null);
  const connectionsRef = useRef<any[]>([]);

  const setupConnection = useCallback((conn: any) => {
    conn.on('data', (data: any) => {
      try {
        const parsedData = JSON.parse(data);
        onDataReceived(parsedData, conn);
      } catch (e) {
        console.error('Failed to parse incoming data:', e, data);
      }
    });

    conn.on('open', () => {
      if (!connectionsRef.current.some(c => c.peer === conn.peer)) {
        connectionsRef.current = [...connectionsRef.current, conn];
        setConnections(prev => [...prev.filter(c => c.peer !== conn.peer), conn]);
      }
    });

    conn.on('close', () => {
      connectionsRef.current = connectionsRef.current.filter(c => c.peer !== conn.peer);
      setConnections(prev => prev.filter(c => c.peer !== conn.peer));
    });

    conn.on('error', (err: any) => {
        console.error('Peer connection error:', err);
        connectionsRef.current = connectionsRef.current.filter(c => c.peer !== conn.peer);
        setConnections(prev => prev.filter(c => c.peer !== conn.peer));
    });
  }, [onDataReceived]);

  useEffect(() => {
    if (!window.Peer) {
      console.warn("PeerJS is not loaded, collaboration disabled.");
      return;
    }

    let peer = new window.Peer(undefined, {
        // For production, you'd host your own PeerJS server.
        // For this demo, the default public server is fine.
    });
    peerRef.current = peer;

    peer.on('open', (id: string) => {
      setPeerId(id);
    });

    peer.on('connection', (conn: any) => {
      setupConnection(conn);
    });

    peer.on('error', (err: any) => {
      console.error('PeerJS error:', err);
      // Attempt to reconnect or inform user
      if (err.type === 'peer-unavailable') {
        alert("Could not connect to peer. The ID might be invalid or the user is offline.");
      }
    });
    
    return () => {
      peer.destroy();
    };
  }, [setupConnection]);

  const connectToPeer = (remotePeerId: string, name: string) => {
    if (!peerRef.current || !remotePeerId || remotePeerId === peerId) return;
    if (connectionsRef.current.some(c => c.peer === remotePeerId)) {
        console.log("Already connected to this peer.");
        return;
    }

    const conn = peerRef.current.connect(remotePeerId, { reliable: true });
    if(conn) {
        conn.on('open', () => {
            // Once connection is open, send join request
            const payload: CollabPayload = { type: 'JOIN_REQUEST', name };
            conn.send(JSON.stringify(payload));
            setupConnection(conn);
        });
    }
  };

  const broadcast = (data: CollabPayload) => {
    const dataString = JSON.stringify(data);
    connectionsRef.current.forEach(conn => {
      if (conn.open) {
        conn.send(dataString);
      }
    });
  };

  return { peerId, connections, connectToPeer, broadcast };
};
