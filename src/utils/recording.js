/**
 * Utility for handling podcast recordings
 */
export class PodcastRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.isRecording = false;
    this.onDataAvailableCallback = null;
    this.onStopCallback = null;
  }

  /**
   * Start recording from a media stream
   * @param {MediaStream} stream - Combined stream of all audio sources
   * @returns {boolean} - Success status
   */
  startRecording(stream) {
    if (!stream || this.isRecording) return false;
    
    try {
      // Create media recorder
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: this.getSupportedMimeType(),
        audioBitsPerSecond: 128000
      });
      
      // Clear previous chunks
      this.recordedChunks = [];
      
      // Set up event handlers
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
          
          if (this.onDataAvailableCallback) {
            this.onDataAvailableCallback(event.data);
          }
        }
      };
      
      this.mediaRecorder.onstop = () => {
        const recordingBlob = new Blob(this.recordedChunks, { 
          type: this.getSupportedMimeType() 
        });
        
        if (this.onStopCallback) {
          this.onStopCallback(recordingBlob);
        }
        
        this.isRecording = false;
      };
      
      // Start recording
      this.mediaRecorder.start(1000); // Capture in 1-second chunks
      this.isRecording = true;
      
      return true;
    } catch (error) {
      console.error('Error starting recording:', error);
      return false;
    }
  }
  
  /**
   * Stop current recording
   * @returns {Blob|null} - Recording blob or null if no recording
   */
  stopRecording() {
    if (!this.isRecording || !this.mediaRecorder) {
      return null;
    }
    
    this.mediaRecorder.stop();
    return new Promise((resolve) => {
      this.onStopCallback = (blob) => {
        resolve(blob);
      };
    });
  }
  
  /**
   * Check if recording is in progress
   * @returns {boolean} - Recording status
   */
  isCurrentlyRecording() {
    return this.isRecording;
  }
  
  /**
   * Set callback for when new data is available
   * @param {Function} callback - Function to call with new data
   */
  onDataAvailable(callback) {
    this.onDataAvailableCallback = callback;
  }
  
  /**
   * Set callback for when recording stops
   * @param {Function} callback - Function to call with final blob
   */
  onStop(callback) {
    this.onStopCallback = callback;
  }
  
  /**
   * Get supported mime type for recording
   * @returns {string} - Supported mime type
   */
  getSupportedMimeType() {
    const types = [
      'audio/webm',
      'audio/mp4',
      'audio/ogg',
      'audio/wav'
    ];
    
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    
    // Fallback
    return 'audio/webm';
  }
  
  /**
   * Create a downloadable link for the recording
   * @param {Blob} blob - Recording blob
   * @param {string} filename - Desired filename
   * @returns {string} - URL to download the recording
   */
  createDownloadLink(blob, filename = 'podcast-recording.webm') {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.style = 'display: none';
    a.href = url;
    a.download = filename;
    return {
      url,
      download: () => {
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }, 100);
      }
    };
  }
}

export default new PodcastRecorder();
