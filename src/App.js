import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { PeerProvider } from './contexts/Instacast2';
import Home from './components/Home/Home';
import Host from './components/Host/Host';
import Guest from './components/Guest/Guest';
import './App.css';

function App() {
  return (
    <Router>
      <PeerProvider>
        <div className="App">
          <Routes>
            <Route path="/host" element={<Host />} />
            <Route path="/guest" element={<Guest />} />
            <Route path="/" element={<Home />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </PeerProvider>
    </Router>
  );
}

export default App;
