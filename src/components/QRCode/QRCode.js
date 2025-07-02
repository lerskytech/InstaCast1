import React, { useEffect, useRef } from 'react';
import QRCodeLib from 'qrcode';
import './QRCode.css';

const QRCode = ({ value, size = 200, includeMargin = true }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!value) return;
    
    const generateQR = async () => {
      try {
        if (canvasRef.current) {
          await QRCodeLib.toCanvas(canvasRef.current, value, {
            width: size,
            margin: includeMargin ? 4 : 0,
            color: {
              dark: '#000000',
              light: '#ffffff',
            }
          });
        }
      } catch (err) {
        console.error('Error generating QR code:', err);
      }
    };

    generateQR();
  }, [value, size, includeMargin]);

  if (!value) {
    return <div className="qr-placeholder">No QR data available</div>;
  }

  return (
    <div className="qr-container">
      <canvas ref={canvasRef} />
      <div className="qr-info">
        <p className="qr-value">{value}</p>
        <p className="qr-help-text">Scan to join or share code</p>
      </div>
    </div>
  );
};

export default QRCode;
