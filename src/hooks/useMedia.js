import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for handling media streams (audio/video)
 */
export const useMedia = () => {
  const [stream, setStream] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const audioContext = useRef(null);
  const analyser = useRef(null);
  const mediaSource = useRef(null);
  const animationFrameId = useRef(null);
  const dataArray = useRef(null);

  // Monitor audio levels from the microphone
  const monitorAudioLevels = useCallback(() => {
    if (!analyser.current || !dataArray.current) return;

    // Get audio data
    analyser.current.getByteFrequencyData(dataArray.current);

    // Calculate average level
    let sum = 0;
    for (let i = 0; i < dataArray.current.length; i++) {
      sum += dataArray.current[i];
    }
    const avg = sum / dataArray.current.length;

    // Normalize to 0-100
    const normalizedLevel = Math.min(100, Math.max(0, (avg / 255) * 100));
    setAudioLevel(normalizedLevel);

    // Continue monitoring
    animationFrameId.current = requestAnimationFrame(monitorAudioLevels);
  }, []);

  // Initialize audio context and analyser for audio levels
  const setupAudioAnalyser = useCallback(
    mediaStream => {
      if (!mediaStream) return;

      try {
        // Create audio context
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContext.current = new AudioContext();

        // Create analyser
        analyser.current = audioContext.current.createAnalyser();
        analyser.current.fftSize = 256;

        // Create media stream source
        mediaSource.current = audioContext.current.createMediaStreamSource(mediaStream);
        mediaSource.current.connect(analyser.current);

        // Set up data array for analysis
        const bufferLength = analyser.current.frequencyBinCount;
        dataArray.current = new Uint8Array(bufferLength);

        // Start monitoring audio levels
        monitorAudioLevels();
      } catch (err) {
        console.error('Error setting up audio analyser:', err);
      }
    },
    [monitorAudioLevels]
  );

  // Request user media (audio and optionally video)
  const requestMedia = useCallback(
    async ({ audio = true, video = false }) => {
      setIsLoading(true);
      setError(null);

      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ audio, video });
        setStream(mediaStream);

        // Set up audio analyser if audio is requested
        if (audio) {
          setupAudioAnalyser(mediaStream);
        }

        setIsLoading(false);
        return mediaStream;
      } catch (err) {
        setIsLoading(false);
        setError(`Media access denied: ${err.message || 'Unknown error'}`);
        throw err;
      }
    },
    [setupAudioAnalyser, setStream, setIsLoading, setError]
  );

  // Toggle mute status
  const toggleMute = useCallback(() => {
    if (!stream) return;

    const newMuteState = !isMuted;
    setIsMuted(newMuteState);

    // Enable/disable all audio tracks
    stream.getAudioTracks().forEach(track => {
      track.enabled = !newMuteState;
    });

    return newMuteState;
  }, [stream, isMuted]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Stop all tracks
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      // Stop audio monitoring
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }

      // Close audio context
      if (audioContext.current && audioContext.current.state !== 'closed') {
        audioContext.current.close();
      }
    };
  }, [stream]);

  return {
    stream,
    audioLevel,
    isMuted,
    error,
    isLoading,
    requestMedia,
    toggleMute,
  };
};

export default useMedia;
