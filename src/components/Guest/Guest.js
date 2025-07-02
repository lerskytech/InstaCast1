import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PeerContext } from '../../contexts/PeerContext';
import useMedia from '../../hooks/useMedia';
import Modal from '../Modal/Modal';
import jsQR from 'jsqr';
import './Guest.css';

const Guest = () => {
  const navigate = useNavigate();
  const [selectedHost, setSelectedHost] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scanError, setScanError] = useState('');
  
  const { 
    joinAsGuest, 
    availableHosts, 
    hostId, 
    connectionStatus, 
    error,
    discoverHosts 
  } = useContext(PeerContext);
  
  const { 
    audioLevel, 
    isMuted, 
    error: mediaError, 
    requestMedia, 
    toggleMute 
  } = useMedia();
  
  const searchTimerRef = useRef(null);
  const scannerRef = useRef(null);
  const scannerStreamRef = useRef(null);
  const videoRef = useRef(null);

  // Start host discovery when component mounts
  useEffect(() => {
    discoverHosts();
    
    // Refresh host list periodically
    searchTimerRef.current = setInterval(() => {
      discoverHosts();
    }, 5000);
    
    // Clean up on unmount
    return () => {
      if (searchTimerRef.current) {
        clearInterval(searchTimerRef.current);
      }
    };
  }, [discoverHosts]);

  useEffect(() => {
    // Handle connection status changes
    if (connectionStatus === 'connected' && hostId) {
      setIsJoining(false);
      // Close scanner if open when connected
      if (showScanner) {
        stopScanner();
      }
    } else if (connectionStatus === 'disconnected') {
      setIsJoining(false);
    }
  }, [connectionStatus, hostId, showScanner]);

  // Handle host selection
  const handleHostSelect = (hostId) => {
    setSelectedHost(hostId);
  };
  
  // Handle join button click
  const handleJoin = async () => {
    if (!selectedHost) return;
    
    try {
      setIsJoining(true);
      
      // Request microphone permission
      await requestMedia({ audio: true, video: false });
      
      // Join selected host
      await joinAsGuest(selectedHost);
      
      // Stop refreshing host list once connected
      if (searchTimerRef.current) {
        clearInterval(searchTimerRef.current);
      }
    } catch (err) {
      console.error('Error joining host:', err);
    } finally {
      setIsJoining(false);
    }
  };

  const startScanner = async () => {
    setScanError('');
    try {
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      scannerStreamRef.current = stream;
      
      // Set showScanner first so the ref will be available in the next render
      setShowScanner(true);
      
      // Use a timeout to ensure the video element is rendered and ref is attached
      setTimeout(() => {
        if (scannerRef.current) {
          scannerRef.current.srcObject = stream;
          
          // Set up canvas to detect QR codes
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          const scanInterval = setInterval(() => {
            if (scannerRef.current && scannerRef.current.videoWidth > 0) {
              canvas.width = scannerRef.current.videoWidth;
              canvas.height = scannerRef.current.videoHeight;
              context.drawImage(scannerRef.current, 0, 0, canvas.width, canvas.height);
              
              try {
                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                  inversionAttempts: 'dontInvert',
                });
                
                if (code) {
                  // Found QR code
                  clearInterval(scanInterval);
                  const scannedHostId = code.data;
                  console.log('QR code detected:', scannedHostId);
                  
                  // Set the host ID and close scanner
                  setSelectedHost(scannedHostId);
                  stopScanner();
                  
                  // Auto-join with the scanned code after a short delay
                  setTimeout(() => {
                    // Need to request media before joining
                    requestMedia({ audio: true, video: false })
                      .then(() => joinAsGuest(scannedHostId))
                      .catch(err => {
                        console.error('Failed to join host after QR scan:', err);
                        setIsJoining(false);
                      });
                    setIsJoining(true);
                  }, 500);
                }
              } catch (err) {
                console.error('Error processing QR code:', err);
              }
            }
          }, 200);
          
          // Store the interval ID so we can clear it when stopping the scanner
          scannerRef.current.scanInterval = scanInterval;
        }
      }, 100);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setScanError('Cannot access camera. Please check permissions.');
      setShowScanner(false);
    }
  };
  
  const stopScanner = () => {
    // Stop all video tracks
    if (scannerStreamRef.current) {
      scannerStreamRef.current.getTracks().forEach(track => track.stop());
      scannerStreamRef.current = null;
    }
    
    // Clear the scan interval if it exists
    if (scannerRef.current && scannerRef.current.scanInterval) {
      clearInterval(scannerRef.current.scanInterval);
      scannerRef.current.scanInterval = null;
    }
    
    // Close the modal
    setShowScanner(false);
  };

  // Return to home
  const handleBack = () => {
    // Clean up scanner if active
    if (showScanner) {
      stopScanner();
    }
    navigate('/');
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Make sure to clean up all resources when component unmounts
      if (showScanner) {
        stopScanner();
      }
      if (searchTimerRef.current) {
        clearInterval(searchTimerRef.current);
      }
    };
  }, [showScanner]);

  return (
    <div className="guest-container">
      <header>
        <button className="back-button" onClick={handleBack}>←</button>
        <h1>Instacast Guest</h1>
        <div className="connection-status">
          Status: <span className={`status-${connectionStatus}`}>{connectionStatus}</span>
        </div>
      </header>
      
      {(error || mediaError) && (
        <div className="error-message">
          {error || mediaError}
        </div>
      )}
      {scanError && (
        <div className="error-message">
          {scanError}
        </div>
      )}
      
      <div className="guest-content">
        {connectionStatus === 'connected' ? (
          <div className="connected-state">
            <h2>Connected to Host</h2>
            
            <div className="audio-controls">
              <div className="audio-level-meter">
                <div 
                  className="audio-level-bar" 
                  style={{ width: `${audioLevel}%` }}
                />
              </div>
              
              <button 
                className={`mute-button ${isMuted ? 'muted' : ''}`}
                onClick={toggleMute}
              >
                {isMuted ? 'Unmute' : 'Mute'}
              </button>
            </div>
            
            <p className="host-info">
              Host ID: {hostId}
            </p>
          </div>
        ) : (
          <div className="discovery-state">
            <h2>Available Hosts</h2>
            
            {availableHosts.length === 0 ? (
              <div className="searching-hosts">
                <p>Searching for available hosts...</p>
                <div className="loading-spinner"></div>
                
                <div className="manual-entry">
                  <p>Or enter a host ID manually:</p>
                  <input 
                    type="text"
                    value={selectedHost}
                    onChange={(e) => setSelectedHost(e.target.value)}
                    placeholder="Enter host ID"
                  />
                </div>
                
                <div className="qr-scanner-option">
                  <p>Or scan the host's QR code:</p>
                  <button 
                    className="scan-button" 
                    onClick={startScanner}
                  >
                    Scan QR Code
                  </button>
                </div>
              </div>
            ) : (
              <>
                <ul className="hosts-list">
                  {availableHosts.map(host => (
                    <li 
                      key={host.id}
                      className={`host-item ${selectedHost === host.id ? 'selected' : ''}`}
                      onClick={() => handleHostSelect(host.id)}
                    >
                      <span className="host-name">{host.name || host.id}</span>
                      {selectedHost === host.id && (
                        <span className="selected-indicator">✓</span>
                      )}
                    </li>
                  ))}
                </ul>
                <div className="qr-scan-option">
                  <p>Can't see your host? Scan their QR code instead:</p>
                  <button 
                    className="scan-button secondary" 
                    onClick={startScanner}
                  >
                    Scan QR Code
                  </button>
                </div>
              </>
            )}
            
            <button 
              className="join-button"
              onClick={handleJoin}
              disabled={!selectedHost || isJoining}
            >
              {isJoining ? 'Joining...' : 'Join Selected Host'}
            </button>
          </div>
        )}
      </div>
      
      {/* QR Code Scanner Modal */}
      <Modal
        isOpen={showScanner}
        onClose={stopScanner}
        title="Scan QR Code"
      >
        <div className="scanner-container">
          {scanError ? (
            <div className="scanner-error">{scanError}</div>
          ) : (
            <>
              <video 
                ref={scannerRef} 
                className="scanner-video" 
                autoPlay 
                playsInline 
              />
              <div className="scanner-overlay">
                <div className="scanner-marker"></div>
              </div>
              <p className="scanner-instructions">
                Point your camera at the QR code shared by the host
              </p>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Guest;
