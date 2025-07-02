import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../Modal/Modal';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  const handleStartAsHost = () => {
    navigate('/host');
  };

  const handleJoinAsGuest = () => {
    navigate('/guest');
  };

  const openHelpModal = () => {
    setIsHelpModalOpen(true);
  };

  const closeHelpModal = () => {
    setIsHelpModalOpen(false);
  };

  return (
    <div className="home-container">
      <header>
        <h1>Instacast</h1>
        <p>Simple peer-to-peer podcast recording</p>
      </header>

      <div className="action-buttons">
        <button className="action-button host-button" onClick={handleStartAsHost}>
          Start as Host
        </button>

        <button className="action-button guest-button" onClick={handleJoinAsGuest}>
          Join as Guest
        </button>
      </div>

      <footer>
        <p>Instacast works best on modern browsers with camera and microphone permissions</p>
        <button className="help-button" onClick={openHelpModal}>
          About / Help
        </button>
      </footer>

      <Modal isOpen={isHelpModalOpen} onClose={closeHelpModal} title="About Instacast">
        <div className="help-content">
          <h3>How to use Instacast</h3>

          <h4>For Hosts:</h4>
          <ol>
            <li>Click &quot;Start as Host&quot; to create a new podcast session</li>
            <li>Grant camera and microphone permissions when prompted</li>
            <li>Share your unique session code or QR code with guests</li>
            <li>Manage connected guests and recording from the host panel</li>
          </ol>

          <h4>For Guests:</h4>
          <ol>
            <li>Click &quot;Join as Guest&quot; to join an existing podcast session</li>
            <li>Grant microphone permissions when prompted</li>
            <li>Enter the host&apos;s session code or scan their QR code</li>
            <li>Participate in the podcast through your microphone</li>
          </ol>

          <h4>Technology:</h4>
          <p>
            Instacast uses WebRTC for direct peer-to-peer communication without a central server.
            This enables high-quality, low-latency audio streaming with minimal setup.
          </p>

          <h4>Privacy & Security:</h4>
          <p>
            All communication happens directly between devices, not through our servers. Session
            codes are randomly generated and temporary for each session.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default Home;
