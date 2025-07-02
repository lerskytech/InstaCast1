import React, { useState, useRef, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { PeerContext } from '../../contexts/PeerContext';
import Modal from '../Modal/Modal';
import QRCode from '../QRCode/QRCode';
import './Host.css';

// Helper function to format time (MM:SS)
const formatTime = seconds => {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${mins}:${secs}`;
};

const Host = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingTimerRef = useRef(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [recordingType, setRecordingType] = useState('audio'); // 'audio' or 'video'
  const [recordingData, setRecordingData] = useState(null); // Store recording blob and type

  const {
    startAsHost,
    connectedGuests,
    myPeerId,
    toggleGuestMute,
    toggleMute,
    connectionStatus,
    error,
    startRecording,
    stopRecording,
  } = useContext(PeerContext);

  // Local state for media
  const [isMuted, setIsMuted] = useState(false);
  const [mediaError] = useState(null);
  const [audioLevel] = useState(0);

  // Initialize host when component mounts
  useEffect(() => {
    // Request media access (moved inside useEffect)
    const requestMedia = async ({ audio, video }) => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ audio, video });
        return mediaStream;
      } catch (err) {
        console.error('Error accessing media devices:', err);
        return null;
      }
    };

    const initializeHost = async () => {
      try {
        // Request camera and mic permissions
        const mediaStream = await requestMedia({ audio: true, video: true });

        // Initialize as host
        await startAsHost();

        // Display local video preview
        if (videoRef.current && mediaStream) {
          videoRef.current.srcObject = mediaStream;
        }

        // Show QR code after successful initialization
        setTimeout(() => {
          setShowQRModal(true);
        }, 1000);
      } catch (err) {
        console.error('Error initializing host:', err);
      }
    };

    initializeHost();

    // Clean up on unmount
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [startAsHost]);

  // Toggle recording
  const toggleRecording = async () => {
    if (isRecording) {
      try {
        const recordedData = await stopRecording();
        setRecordingData(recordedData); // Store the recording data for download
        setIsRecording(false);

        // Stop the timer
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
      } catch (err) {
        console.error('Error stopping recording:', err);
      }
    } else {
      const success = startRecording(recordingType === 'video');

      if (success) {
        setIsRecording(true);
        setRecordingData(null); // Clear previous recording
        setRecordingDuration(0);

        // Start timer
        recordingTimerRef.current = setInterval(() => {
          setRecordingDuration(prev => prev + 1);
        }, 1000);
      }
    }
  };

  // Toggle QR code modal
  const toggleQRModal = () => {
    setShowQRModal(!showQRModal);
  };

  // Toggle recording type (audio/video)
  const toggleRecordingType = () => {
    if (!isRecording) {
      setRecordingType(recordingType === 'audio' ? 'video' : 'audio');
    }
  };

  // Handle download of recording
  const handleDownload = () => {
    if (!recordingData) return;

    const { blob, type } = recordingData;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const extension = type.includes('video') ? 'webm' : 'mp3';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    a.href = url;
    a.download = `instacast-recording-${timestamp}.${extension}`;
    document.body.appendChild(a);
    a.click();

    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  // Return to home
  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="host-container">
      <header>
        <button className="back-button" onClick={handleBack}>
          ←
        </button>
        <h1>Instacast Host</h1>
        <div className="connection-status">
          Status: <span className={`status-${connectionStatus}`}>{connectionStatus}</span>
        </div>
      </header>

      {(error || mediaError) && <div className="error-message">{error || mediaError}</div>}

      <div className="host-content">
        <div className="video-preview">
          <video ref={videoRef} autoPlay muted playsInline />

          <div className="status-box">
            {mediaError ? (
              <div className="error-message">{mediaError}</div>
            ) : (
              <div className="audio-level">
                <div className="level-bar" style={{ width: `${audioLevel}%` }}></div>
              </div>
            )}
          </div>

          <button
            className={`mute-button ${isMuted ? 'muted' : ''}`}
            onClick={() => {
              toggleMute();
              setIsMuted(!isMuted);
            }}
          >
            {isMuted ? 'Unmute' : 'Mute'}
          </button>
        </div>

        <div className="guests-section">
          <div className="guests-header">
            <h2>Connected Guests ({connectedGuests.length})</h2>
            <button className="share-button" onClick={toggleQRModal}>
              Share Session
            </button>
          </div>

          {connectedGuests.length === 0 ? (
            <p className="no-guests">No guests connected yet</p>
          ) : (
            <ul className="guests-list">
              {connectedGuests.map(guest => (
                <li
                  key={guest.id}
                  className={`guest-item ${!guest.connected ? 'disconnected' : ''}`}
                >
                  <div className="guest-info">
                    <span className="guest-id">{guest.id.substring(0, 6)}</span>
                    <span
                      className={`guest-status ${guest.connected ? 'connected' : 'disconnected'}`}
                    >
                      {guest.connected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>

                  <button
                    className={`guest-mute-button ${guest.muted ? 'muted' : ''}`}
                    onClick={() => toggleGuestMute(guest.id)}
                    disabled={!guest.connected}
                  >
                    {guest.muted ? 'Unmute' : 'Mute'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="recording-controls">
        {isRecording && (
          <div className="recording-indicator">
            <span className="recording-dot"></span>
            Recording: {formatTime(recordingDuration)}
          </div>
        )}

        <div className="record-options">
          <button
            className="record-type-toggle"
            onClick={toggleRecordingType}
            disabled={isRecording}
          >
            {recordingType === 'audio' ? '🎙️ Audio Only' : '🎥 Audio + Video'}
          </button>

          <button
            className={`record-button ${isRecording ? 'recording' : ''}`}
            onClick={toggleRecording}
          >
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </button>

          {recordingData && !isRecording && (
            <button className="download-button" onClick={handleDownload}>
              Download Recording
            </button>
          )}
        </div>

        {isRecording ? (
          <div className="recording-indicator">
            <div className="recording-dot"></div>
            Recording... {formatTime(recordingDuration)}
          </div>
        ) : (
          recordingData && (
            <div className="recording-info">
              <span>Recording ready for download ({formatTime(recordingDuration)})</span>
            </div>
          )
        )}
      </div>

      {/* QR Code Modal */}
      <Modal isOpen={showQRModal} onClose={toggleQRModal} title="Share Session">
        <div className="session-sharing">
          <p>Share this QR code or session ID with guests:</p>

          <QRCode value={myPeerId} size={200} includeMargin={true} />

          <div className="session-instructions">
            <ol>
              <li>Ask guests to scan the QR code or enter the ID above</li>
              <li>Ensure guests are on the same network for best quality</li>
              <li>Guest and host must both allow microphone permissions</li>
            </ol>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Host;
