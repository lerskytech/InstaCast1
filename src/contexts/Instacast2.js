import React, { createContext, useState, useRef, useEffect } from 'react';
import Peer from 'peerjs';

export const PeerContext = createContext();

export const PeerProvider = ({ children }) => {
  const [myPeerId, setMyPeerId] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [hostId, setHostId] = useState('');
  const [availableHosts, setAvailableHosts] = useState([]);
  const [connectedGuests, setConnectedGuests] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'disconnected', 'connecting', 'connected'
  const [error, setError] = useState(null);

  const peerInstance = useRef(null);
  const localStreamRef = useRef(null);
  const connectionsRef = useRef({});
  const audioStreamsRef = useRef({});
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  // Initialize PeerJS
  const initializePeer = () => {
    try {
      // Generate a random ID for this peer
      const peerId = Math.random().toString(36).substr(2, 9);

      const peer = new Peer(peerId, {
        config: {
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        },
      });

      peer.on('open', id => {
        console.log('My peer ID is: ' + id);
        setMyPeerId(id);
        setConnectionStatus('disconnected');
      });

      peer.on('error', err => {
        console.error('PeerJS error:', err);
        setError(`Connection error: ${err.message || 'Unknown error'}`);
        setConnectionStatus('disconnected');
      });

      peerInstance.current = peer;
    } catch (err) {
      setError(`Failed to initialize connection: ${err.message || 'Unknown error'}`);
    }
  };

  // Initialize as a host
  const startAsHost = async () => {
    try {
      setIsHost(true);
      setConnectionStatus('connecting');

      // Get local media stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      localStreamRef.current = stream;

      // Setup listeners for incoming connections
      peerInstance.current.on('connection', handleGuestConnection);
      peerInstance.current.on('call', handleIncomingCall);

      setConnectionStatus('connected');
      return stream;
    } catch (err) {
      setError(`Failed to start as host: ${err.message || 'Permission denied'}`);
      setConnectionStatus('disconnected');
      throw err;
    }
  };

  // Handle incoming connection from a guest
  const handleGuestConnection = conn => {
    conn.on('open', () => {
      console.log(`Guest connected: ${conn.peer}`);

      const newGuest = {
        id: conn.peer,
        connection: conn,
        muted: false,
        connected: true,
      };

      setConnectedGuests(prev => [...prev, newGuest]);
      connectionsRef.current[conn.peer] = conn;

      // Listen for messages from this guest
      conn.on('data', data => {
        console.log(`Received data from ${conn.peer}:`, data);

        // Handle mute/unmute messages
        if (data.type === 'toggleMute') {
          setConnectedGuests(prev =>
            prev.map(guest => (guest.id === conn.peer ? { ...guest, muted: data.muted } : guest))
          );
        }
      });

      conn.on('close', () => {
        console.log(`Guest disconnected: ${conn.peer}`);
        handleGuestDisconnection(conn.peer);
      });
    });
  };

  // Handle incoming call from a guest
  const handleIncomingCall = call => {
    // Answer the call with our stream
    call.answer(localStreamRef.current);

    call.on('stream', remoteStream => {
      console.log(`Received stream from ${call.peer}`);
      audioStreamsRef.current[call.peer] = remoteStream;

      // Update the guest's connected status
      setConnectedGuests(prev =>
        prev.map(guest => (guest.id === call.peer ? { ...guest, hasAudio: true } : guest))
      );
    });

    call.on('close', () => {
      console.log(`Call ended with ${call.peer}`);
      // Remove the audio stream
      delete audioStreamsRef.current[call.peer];
    });
  };

  // Handle guest disconnection
  const handleGuestDisconnection = guestId => {
    setConnectedGuests(prev =>
      prev.map(guest => (guest.id === guestId ? { ...guest, connected: false } : guest))
    );

    delete connectionsRef.current[guestId];
    delete audioStreamsRef.current[guestId];
  };

  // Join as a guest
  const joinAsGuest = async selectedHostId => {
    try {
      setIsHost(false);
      setHostId(selectedHostId);
      setConnectionStatus('connecting');

      // Get local media stream (audio only for guests)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;

      // Connect to the host
      const conn = peerInstance.current.connect(selectedHostId);
      connectionsRef.current[selectedHostId] = conn;

      conn.on('open', () => {
        console.log('Connected to host:', selectedHostId);
        setConnectionStatus('connected');

        // Call the host to establish audio stream
        const call = peerInstance.current.call(selectedHostId, stream);

        call.on('stream', remoteStream => {
          console.log('Received host stream');
          audioStreamsRef.current[selectedHostId] = remoteStream;
        });
      });

      conn.on('close', () => {
        console.log('Disconnected from host');
        setConnectionStatus('disconnected');
        setHostId('');
      });

      return stream;
    } catch (err) {
      setError(`Failed to join as guest: ${err.message || 'Permission denied'}`);
      setConnectionStatus('disconnected');
      throw err;
    }
  };

  // Toggle mute for a guest (host only)
  const toggleGuestMute = guestId => {
    if (!isHost) return;

    setConnectedGuests(prev =>
      prev.map(guest => (guest.id === guestId ? { ...guest, muted: !guest.muted } : guest))
    );

    const connection = connectionsRef.current[guestId];
    if (connection) {
      connection.send({
        type: 'toggleMute',
        muted: !connectedGuests.find(g => g.id === guestId)?.muted,
      });
    }
  };

  // Toggle local mute
  const toggleMute = muted => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !muted;
      });

      // If guest, inform host
      if (!isHost && hostId) {
        const connection = connectionsRef.current[hostId];
        if (connection) {
          connection.send({ type: 'toggleMute', muted });
        }
      }
    }
  };

  // Discover available hosts
  const discoverHosts = () => {
    // In a real app, you might use a service for discovery
    // For demo purposes, we'll simulate discovering hosts
    // In a production app, you would implement actual LAN discovery

    setAvailableHosts([]);

    // Demo: simulate host discovery
    setTimeout(() => {
      if (peerInstance.current) {
        const demoHostId = 'demo-host-id'; // In real app, this would be discovered
        setAvailableHosts([{ id: demoHostId, name: 'Demo Host' }]);
      }
    }, 1000);
  };

  // Start recording
  const startRecording = (includeVideo = false) => {
    if (!localStreamRef.current) {
      console.error('No local stream available for recording');
      return null;
    }

    try {
      // Create a new MediaStream with all audio tracks
      const recordingStream = new MediaStream();

      // Add all audio tracks (local and remote guests)
      // First add the local audio track
      localStreamRef.current.getAudioTracks().forEach(track => {
        recordingStream.addTrack(track);
      });

      // Add all connected guest audio tracks
      Object.values(audioStreamsRef.current).forEach(stream => {
        if (stream && stream.getAudioTracks().length > 0) {
          stream.getAudioTracks().forEach(track => {
            recordingStream.addTrack(track);
          });
        }
      });

      // Add video track if requested
      if (includeVideo && localStreamRef.current.getVideoTracks().length > 0) {
        localStreamRef.current.getVideoTracks().forEach(track => {
          recordingStream.addTrack(track);
        });
      }

      // Set up MediaRecorder with the combined stream
      const options = { mimeType: includeVideo ? 'video/webm' : 'audio/webm' };
      recordedChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(recordingStream, options);

      mediaRecorder.ondataavailable = event => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(100); // Record in 100ms chunks
      mediaRecorderRef.current = mediaRecorder;
      console.log('Recording started with video:', includeVideo);
      return true;
    } catch (err) {
      console.error('Error starting recording:', err);
      return false;
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
      console.log('No active recording to stop');
      return null;
    }

    return new Promise(resolve => {
      mediaRecorderRef.current.onstop = () => {
        const recordingType = mediaRecorderRef.current.mimeType;
        const blob = new Blob(recordedChunksRef.current, { type: recordingType });
        recordedChunksRef.current = [];
        mediaRecorderRef.current = null;
        resolve({ blob, type: recordingType });
      };

      mediaRecorderRef.current.stop();
    });
  };

  // Clean up on unmount
  // We are intentionally not including dependencies here as this should only run once on mount/unmount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    initializePeer();

    return () => {
      // Clean up media streams
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }

      // Capture connections reference at cleanup time to avoid stale ref
      const connections = connectionsRef.current;

      // Close all connections
      if (connections) {
        Object.values(connections).forEach(conn => {
          if (conn && typeof conn.close === 'function') {
            conn.close();
          }
        });
      }

      // Close peer connection
      if (peerInstance.current) {
        peerInstance.current.destroy();
      }
    };
  }, []);

  // Context value
  const value = {
    myPeerId,
    isHost,
    hostId,
    availableHosts,
    connectedGuests,
    connectionStatus,
    error,
    startAsHost,
    joinAsGuest,
    toggleGuestMute,
    toggleMute,
    discoverHosts,
    startRecording,
    stopRecording,
  };

  return <PeerContext.Provider value={value}>{children}</PeerContext.Provider>;
};
