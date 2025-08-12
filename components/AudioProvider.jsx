import { useAudioManager } from '../hooks/useAudioManager';

// Audio Provider Component to initialize audio system globally
function AudioProvider({ children }) {
  // Initialize audio manager for the entire application
  useAudioManager();
  return children || null;
}

export default AudioProvider;