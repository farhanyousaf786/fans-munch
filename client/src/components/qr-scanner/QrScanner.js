import React, { useRef, useEffect, useState } from 'react';
import { showToast } from '../toast/ToastContainer';

const QrScanner = ({ onScanSuccess, onClose, visible }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [stream, setStream] = useState(null);
  const scanIntervalRef = useRef(null);

  useEffect(() => {
    if (visible) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [visible]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
        setStream(mediaStream);
        setIsScanning(true);
        
        // Start scanning for QR codes
        scanIntervalRef.current = setInterval(scanForQrCode, 500);
      }
    } catch (error) {
      console.error('Camera access failed:', error);
      showToast('Camera access denied. Please allow camera permission.', 'error', 4000);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setIsScanning(false);
  };

  const scanForQrCode = () => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Since we don't have a QR library, we'll use manual input
      // In production, you'd use jsQR library here to detect QR codes
    }
  };

  // Placeholder QR detection - would use jsQR library in production
  const detectQrCode = (imageData) => {
    // This is a placeholder. In production, you'd use a library like jsQR
    return null;
  };

  const handleQrDetected = (qrData) => {
    try {
      console.log('Processing QR data:', qrData);
      
      // Parse the QR data (should be a URL)
      let url;
      let params;
      
      try {
        url = new URL(qrData);
        params = new URLSearchParams(url.search);
      } catch {
        // If not a full URL, try to parse as query string directly
        try {
          params = new URLSearchParams(qrData);
        } catch {
          console.warn('Could not parse QR data as URL or query string');
          return;
        }
      }
      
      // If we have a URL, validate the domain
      if (url) {
        const validDomains = ['fanmunch.com', 'www.fanmunch.com', 'localhost'];
        const isValidDomain = validDomains.some(domain => 
          url.hostname === domain || url.hostname.includes(domain)
        );
        
        if (!isValidDomain) {
          console.warn('QR code contains invalid domain:', url.hostname);
          return;
        }
      }
      
      const seatData = {
        row: params.get('row') || '',
        seatNo: params.get('seat') || params.get('seatNo') || '',
        section: params.get('section') || '',
        sectionId: params.get('sectionId') || '',
        entrance: params.get('entrance') || params.get('gate') || '',
        stand: params.get('stand') || '',
        seatDetails: params.get('details') || params.get('seatDetails') || '',
        area: params.get('area') || ''
      };

      // Check if we got meaningful data
      const hasData = Object.values(seatData).some(v => v && String(v).trim() !== '');
      if (hasData) {
        stopCamera();
        onScanSuccess(seatData);
        showToast('QR code scanned successfully!', 'success', 2000);
      }
    } catch (error) {
      console.warn('Failed to parse QR data:', error);
    }
  };

  // Manual URL input as fallback
  const handleManualInput = () => {
    const currentDomain = window.location.hostname.includes('localhost') 
      ? 'http://localhost:3000' 
      : 'https://fanmunch.com';
    
    const defaultUrl = `${currentDomain}?row=1&seat=1&section=Section%201`;
    const input = prompt('Enter the QR code URL or parameters manually:', defaultUrl);
    if (input && input.trim()) {
      handleQrDetected(input.trim());
    }
  };

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.9)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      {/* Header */}
      <div style={{
        color: 'white',
        textAlign: 'center',
        marginBottom: '20px'
      }}>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '1.5rem' }}>Scan QR Code</h2>
        <p style={{ margin: 0, opacity: 0.8 }}>Point your camera at the QR code</p>
      </div>

      {/* Camera View */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '400px',
        aspectRatio: '1',
        background: '#000',
        borderRadius: '12px',
        overflow: 'hidden',
        marginBottom: '20px'
      }}>
        <video
          ref={videoRef}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
          playsInline
          muted
        />
        
        {/* Scanning overlay */}
        <div style={{
          position: 'absolute',
          inset: '20px',
          border: '2px solid #3b82f6',
          borderRadius: '8px',
          boxShadow: 'inset 0 0 0 2px rgba(59, 130, 246, 0.3)'
        }}>
          {/* Corner indicators */}
          {[
            { top: '-2px', left: '-2px' },
            { top: '-2px', right: '-2px' },
            { bottom: '-2px', left: '-2px' },
            { bottom: '-2px', right: '-2px' }
          ].map((pos, i) => (
            <div key={i} style={{
              position: 'absolute',
              width: '20px',
              height: '20px',
              border: '3px solid #3b82f6',
              ...pos,
              ...(pos.top !== undefined && pos.left !== undefined && { borderRight: 'none', borderBottom: 'none' }),
              ...(pos.top !== undefined && pos.right !== undefined && { borderLeft: 'none', borderBottom: 'none' }),
              ...(pos.bottom !== undefined && pos.left !== undefined && { borderRight: 'none', borderTop: 'none' }),
              ...(pos.bottom !== undefined && pos.right !== undefined && { borderLeft: 'none', borderTop: 'none' })
            }} />
          ))}
        </div>
      </div>

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Controls */}
      <div style={{
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        <button
          onClick={handleManualInput}
          style={{
            padding: '12px 20px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          📝 Enter URL Manually
        </button>
        
        <button
          onClick={onClose}
          style={{
            padding: '12px 20px',
            background: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Close Scanner
        </button>
      </div>

      {/* Instructions */}
      <div style={{
        color: 'rgba(255, 255, 255, 0.7)',
        textAlign: 'center',
        marginTop: '20px',
        fontSize: '14px',
        maxWidth: '300px'
      }}>
        <p style={{ margin: 0 }}>
          Position the QR code within the blue frame. 
          If scanning doesn't work, use "Enter URL Manually".
        </p>
      </div>
    </div>
  );
};

export default QrScanner;
