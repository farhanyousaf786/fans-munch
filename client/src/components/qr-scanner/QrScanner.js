import React, { useRef, useEffect, useState } from 'react';
import jsQR from 'jsqr';
import { showToast } from '../toast/ToastContainer';

const QrScanner = ({ onScanSuccess, onClose, visible }) => {
  const videoRef = useRef(null);
  // Offscreen canvas used for jsQR processing
  const canvasRef = useRef(null);
  // Optional visible debug canvas (mirrors processing frame)
  const debugCanvasRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const isScanningRef = useRef(false);
  const [stream, setStream] = useState(null);
  const scanRafRef = useRef(null);
  const [debugEnabled, setDebugEnabled] = useState(false);
  const [lastStatus, setLastStatus] = useState('idle');
  const [metrics, setMetrics] = useState({ fps: 0, vw: 0, vh: 0, cw: 0, ch: 0, tw: 0, th: 0 });
  const lastFrameTsRef = useRef(performance.now());
  const frameCounterRef = useRef(0);
  const imageCaptureBusyRef = useRef(false);

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
      // Try preferred back camera; fall back to any camera if not available
      let mediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          }
        });
      } catch (_) {
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      }
      
      if (videoRef.current) {
        const video = videoRef.current;
        // Ensure best chance for autoplay inline across browsers (iOS requires attributes)
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');
        video.setAttribute('muted', 'true');
        video.setAttribute('autoplay', 'true');
        video.srcObject = mediaStream;
        setStream(mediaStream);
        
        // Ensure metadata is loaded to get correct dimensions
        const onLoaded = async (evtName) => {
          console.info(`[QR DEBUG] ${evtName} fired. readyState=${video.readyState}, dims=${video.videoWidth}x${video.videoHeight}`);
          try {
            await video.play();
          } catch (e) {
            console.warn('[QR DEBUG] video.play() blocked, will continue polling', e);
          }
          // If dimensions are not ready yet, fall back to polling
          waitForDimensionsAndStart(video);
        };

        // Attach multiple readiness events
        video.onloadedmetadata = () => onLoaded('loadedmetadata');
        video.onloadeddata = () => onLoaded('loadeddata');
        video.oncanplay = () => onLoaded('canplay');
        video.onresize = () => onLoaded('resize');

        // If already has metadata, proceed immediately
        if (video.readyState >= 1) {
          onLoaded('immediate');
        }
      }
    } catch (error) {
      console.error('Camera access failed:', error);
      showToast('Camera access denied. Please allow camera permission.', 'error', 4000);
    }
  };

  // Poll for non-zero dimensions before starting scanning (handles browsers that delay dims)
  const waitForDimensionsAndStart = (video, attempts = 0) => {
    const vw = video.videoWidth || 0;
    const vh = video.videoHeight || 0;
    if (vw > 0 && vh > 0) {
      console.info(`[QR DEBUG] Dimensions ready: ${vw}x${vh}. Starting scan loop.`);
      setIsScanning(true);
      isScanningRef.current = true;
      if (!scanRafRef.current) {
        scanRafRef.current = requestAnimationFrame(scanForQrCode);
      }
      return;
    }
    if (attempts > 50) { // ~2.5s at 50ms
      console.warn('[QR DEBUG] Dimensions still 0 after retries. Will keep running loop anyway.');
      setIsScanning(true);
      isScanningRef.current = true;
      if (!scanRafRef.current) {
        scanRafRef.current = requestAnimationFrame(scanForQrCode);
      }
      return;
    }
    // Not ready: keep polling
    setLastStatus('warming-up');
    setTimeout(() => waitForDimensionsAndStart(video, attempts + 1), 50);
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (scanRafRef.current) {
      cancelAnimationFrame(scanRafRef.current);
      scanRafRef.current = null;
    }
    setIsScanning(false);
    isScanningRef.current = false;
  };

  const scanForQrCode = () => {
    if (!videoRef.current || !canvasRef.current) {
      console.warn('[QR DEBUG] scanForQrCode: missing refs, stopping');
      return;
    }
    if (!isScanningRef.current) {
      console.warn('[QR DEBUG] scanForQrCode: isScanningRef=false, stopping');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d', { willReadFrequently: true });

    // Some browsers report readyState but keep videoWidth/Height at 0 for a while.
    // Gate on actual dimensions instead.
    const track = stream?.getVideoTracks?.()[0];
    const tSettings = track?.getSettings?.() || {};
    const tW = tSettings.width || 0;
    const tH = tSettings.height || 0;
    
    console.log('[QR DEBUG] scanForQrCode tick, isScanningRef=', isScanningRef.current, 'dims=', video.videoWidth, 'x', video.videoHeight);
    
    if ((video.videoWidth || 0) > 0 && (video.videoHeight || 0) > 0) {
      const vw = video.videoWidth || 640;
      const vh = video.videoHeight || 480;
      // 1) Try full frame first (helps with rotated sources)
      canvas.width = vw;
      canvas.height = vh;
      context.drawImage(video, 0, 0, vw, vh);
      let imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      let qrCode = detectQrCode(imageData);
      
      // 2) If not found, try center square crop as fallback
      if (!qrCode) {
        const size = Math.min(vw, vh);
        const sx = Math.max(0, Math.floor((vw - size) / 2));
        const sy = Math.max(0, Math.floor((vh - size) / 2));
        canvas.width = size;
        context.drawImage(video, sx, sy, size, size, 0, 0, size, size);
        imageData = context.getImageData(0, 0, size, size);
        qrCode = detectQrCode(imageData);
      }

      // Debug: mirror processing frame to visible debug canvas and log metrics
      if (debugEnabled && debugCanvasRef.current) {
        try {
          const dctx = debugCanvasRef.current.getContext('2d');
          debugCanvasRef.current.width = canvas.width;
          debugCanvasRef.current.height = canvas.height;
          dctx.drawImage(canvas, 0, 0);
          if (debugEnabled && typeof qrCode === 'object' && qrCode.location) {
            const loc = qrCode.location;
            const drawLine = (begin, end, color) => {
              dctx.beginPath();
              dctx.moveTo(begin.x, begin.y);
              dctx.lineTo(end.x, end.y);
              dctx.lineWidth = 3;
              dctx.strokeStyle = color;
              dctx.stroke();
            };
            drawLine(loc.topLeftCorner, loc.topRightCorner, '#22c55e');
            drawLine(loc.topRightCorner, loc.bottomRightCorner, '#22c55e');
            drawLine(loc.bottomRightCorner, loc.bottomLeftCorner, '#22c55e');
            drawLine(loc.bottomLeftCorner, loc.topLeftCorner, '#22c55e');
          }
        } catch (e) {
          // ignore
        }
      }

      // FPS + metrics
      frameCounterRef.current += 1;
      const now = performance.now();
      const dt = now - lastFrameTsRef.current;
      if (dt >= 1000) {
        const fps = Math.round((frameCounterRef.current * 1000) / dt);
        frameCounterRef.current = 0;
        lastFrameTsRef.current = now;
        setMetrics({ fps, vw, vh, cw: canvas.width, ch: canvas.height, tw: tW, th: tH });
        if (debugEnabled) {
          console.info(`[QR DEBUG] fps=${fps} video=${vw}x${vh} track=${tW}x${tH} canvas=${canvas.width}x${canvas.height}`);
        }
      }
      
      if (qrCode) {
        setLastStatus('detected');
        handleQrDetected(typeof qrCode === 'object' ? qrCode.data : qrCode);
        return; // stop loop, stopCamera will cancel RAF
      } else {
      }
    }
    // Continue scanning on next animation frame
    if (isScanningRef.current) {
      scanRafRef.current = requestAnimationFrame(scanForQrCode);
    } else {
      console.warn('[QR DEBUG] Not continuing RAF, isScanningRef=false');
      return;
    }
  };

  // Real QR detection using jsQR library
  const detectQrCode = (imageData) => {
    try {
      // Try with inversion attempts for better detection in various lighting
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'attemptBoth', // Try both normal and inverted
      });
      
      if (code) {
        console.log('🎯 QR Code detected:', code.data);
        return code; // return the full object for optional box drawing
      }
      return null;
    } catch (error) {
      console.warn('QR detection error:', error);
      return null;
    }
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
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        color: 'white',
        background: lastStatus === 'detected' ? 'rgba(34,197,94,0.9)' : 'rgba(59, 130, 246, 0.9)',
        padding: '12px 20px',
        borderRadius: '25px',
        fontSize: '14px',
        fontWeight: '600',
        textAlign: 'center',
        maxWidth: '280px',
        lineHeight: '1.4'
      }}>
        {lastStatus === 'detected' ? '✅ QR Detected' : '📱 Scanning for QR Codes...'}
      </div>

      {/* Camera container */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '600px',
        aspectRatio: '4/3',
        background: '#1f2937',
        borderRadius: '12px',
        overflow: 'hidden',
        marginBottom: '20px'
      }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'scaleX(1)' // ensure no mirror; change to 'scaleX(-1)' if device mirrors
          }}
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

      {/* Optional visible debug canvas */}
      {debugEnabled && (
        <div style={{
          marginTop: '8px',
          background: '#111827',
          padding: '8px',
          borderRadius: '8px'
        }}>
          <div style={{ color: '#9CA3AF', fontSize: 12, marginBottom: 6 }}>Processed frame preview</div>
          <canvas ref={debugCanvasRef} style={{ maxWidth: 320, width: '100%', borderRadius: 6, border: '1px solid #374151' }} />
        </div>
      )}

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
            padding: '16px 32px',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => e.target.style.background = '#059669'}
          onMouseOut={(e) => e.target.style.background = '#10b981'}
        >
          ✏️ Enter URL Manually
        </button>
        
        <button
          onClick={onClose}
          style={{
            padding: '16px 32px',
            background: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600',
            boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => e.target.style.background = '#b91c1c'}
          onMouseOut={(e) => e.target.style.background = '#dc2626'}
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
          Position the QR code within the blue frame and hold steady.
        </p>
      </div>
    </div>
  );
};

export default QrScanner;
