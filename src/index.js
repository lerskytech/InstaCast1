import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Check for WebRTC compatibility
const checkBrowserCompatibility = () => {
  // Check for required browser features
  const requirements = {
    mediaDevices: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    webRTC: !!window.RTCPeerConnection,
    mediaRecorder: !!window.MediaRecorder,
    audioContext: !!(window.AudioContext || window.webkitAudioContext),
  };

  // Check if all requirements are met
  const compatible = Object.values(requirements).every(Boolean);

  // Return compatibility status and details
  return {
    compatible,
    requirements,
  };
};

// Render the app or a fallback message
const root = ReactDOM.createRoot(document.getElementById('root'));
const { compatible, requirements } = checkBrowserCompatibility();

if (compatible) {
  // Render the main app if browser is compatible
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  // Render a fallback message if browser is not compatible
  const missingFeatures = Object.entries(requirements)
    .filter(([, supported]) => !supported)
    .map(([feature]) => feature)
    .join(', ');

  root.render(
    <div className="browser-compatibility-warning">
      <h2>Browser Not Supported</h2>
      <p>
        Your browser doesn&apos;t support all the features needed to run Instacast. Missing
        features: {missingFeatures}.
      </p>
      <p>Please try a modern browser like Chrome, Firefox, or Edge.</p>
    </div>
  );
}

reportWebVitals();
