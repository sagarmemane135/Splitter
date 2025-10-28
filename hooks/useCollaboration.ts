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
  const onDataReceivedRef = useRef(onDataReceived);

  useEffect(() => {
    onDataReceivedRef.current = onDataReceived;
  }, [onDataReceived]);

  const setupConnection = useCallback((conn: any) => {
    conn.on('data', (data: any) => {
      try {
        const parsedData = JSON.parse(data);
        onDataReceivedRef.current(parsedData, conn);
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

    const handleCloseOrError = (err?: any) => {
      if (err) {
        console.error(`Connection error with peer ${conn.peer}:`, err);
      }
      console.log(`Connection to peer ${conn.peer} has been closed.`);
      connectionsRef.current = connectionsRef.current.filter(c => c.peer !== conn.peer);
      setConnections(prev => prev.filter(c => c.peer !== conn.peer));
    };

    conn.on('close', () => handleCloseOrError());
    conn.on('error', (err: any) => handleCloseOrError(err));
  }, []);

  const initializePeer = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.destroy();
    }
    if (!window.Peer) {
        console.warn("PeerJS is not loaded, collaboration disabled.");
        return;
    }

    const peer = new window.Peer(undefined, {});
    peerRef.current = peer;

    peer.on('open', setPeerId);
    peer.on('connection', setupConnection);
    peer.on('disconnected', () => {
      console.warn('Disconnected from PeerJS server, attempting to reconnect...');
    });
    peer.on('error', (err: any) => {
      console.error('PeerJS error:', err);
      if (err.type === 'peer-unavailable') {
        alert("Could not connect to peer. The ID might be invalid or the user is offline.");
      } else if (['network', 'server-error', 'socket-error', 'webrtc'].includes(err.type)) {
        console.log(`Fatal error (${err.type}). Re-initializing PeerJS connection in 3 seconds.`);
        setTimeout(initializePeer, 3000);
      }
    });
  }, [setupConnection]);

  useEffect(() => {
    initializePeer();
    return () => {
      if (peerRef.current) {
        peerRef.current.destroy();
      }
    };
  }, [initializePeer]);

  const connectToPeer = (remotePeerId: string, name: string) => {
    if (!peerRef.current || !remotePeerId || remotePeerId === peerId) return;
    if (connectionsRef.current.some(c => c.peer === remotePeerId)) {
        console.log("Already connected to this peer.");
        return;
    }

    const conn = peerRef.current.connect(remotePeerId, { reliable: true });
    if (conn) {
      // Set up listeners immediately to avoid race conditions
      setupConnection(conn);
      conn.on('open', () => {
        const payload: CollabPayload = { type: 'JOIN_REQUEST', name };
        conn.send(JSON.stringify(payload));
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