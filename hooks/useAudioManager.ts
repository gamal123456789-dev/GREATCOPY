import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for managing audio playback in the application
 * Handles chat sounds and notification sounds with fallback mechanisms
 */
export const useAudioManager = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const isAudioEnabledRef = useRef(false);

  // Initialize audio context on user interaction
  const initializeAudioContext = useCallback(async () => {
    if (typeof window === 'undefined') return false;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        console.warn('⚠️ Web Audio API not supported');
        return false;
      }

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContextClass();
      }

      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      isAudioEnabledRef.current = true;
      console.log('✅ Audio context initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize audio context:', error);
      return false;
    }
  }, []);

  // Play audio with multiple fallback methods
  const playAudio = useCallback(async (audioPath: string, volume: number = 0.1): Promise<boolean> => {
    if (typeof window === 'undefined') return false;

    // Always try to resume audio context if it's suspended
    // This is crucial for background audio playback
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      try {
        await audioContextRef.current.resume();
        console.log('🎵 Audio context resumed before playing sound (background mode)');
      } catch (error) {
        console.warn('⚠️ Failed to resume audio context:', error);
        // Continue anyway, HTML5 Audio might still work
      }
    }

    // Force audio context initialization if not available
    if (!audioContextRef.current || !isAudioEnabledRef.current) {
      console.log('🔧 Initializing audio context for background playback');
      await initializeAudioContext();
    }

    // Method 1: HTML5 Audio API (Enhanced for background playback)
    const tryHtmlAudio = (path: string): Promise<boolean> => {
      return new Promise((resolve) => {
        try {
          const audio = new Audio(path);
          audio.volume = volume;
          audio.preload = 'auto';
          
          // Enhanced properties for better background playback
          audio.crossOrigin = 'anonymous';
          audio.loop = false;
          
          // Add event listeners for better error handling
          audio.addEventListener('canplaythrough', () => {
            console.log('🎵 Audio ready to play:', path);
          });
          
          audio.addEventListener('error', (e) => {
            console.warn('⚠️ HTML5 Audio error event:', path, e);
            resolve(false);
          });

          const playPromise = audio.play();
          if (playPromise) {
            playPromise
              .then(() => {
                console.log('✅ HTML5 Audio played successfully (background-ready):', path);
                resolve(true);
              })
              .catch((error) => {
                console.warn('⚠️ HTML5 Audio failed:', path, error.name, error.message);
                // Try to play anyway for older browsers
                try {
                  audio.currentTime = 0;
                  audio.play();
                  console.log('✅ HTML5 Audio played (fallback method):', path);
                  resolve(true);
                } catch (fallbackError) {
                  console.warn('⚠️ HTML5 Audio fallback also failed:', fallbackError);
                  resolve(false);
                }
              });
          } else {
            console.log('✅ HTML5 Audio played (legacy):', path);
            resolve(true);
          }
        } catch (error) {
          console.warn('⚠️ HTML5 Audio error:', path, error);
          resolve(false);
        }
      });
    };

    // Method 2: Web Audio API
    const tryWebAudio = async (path: string): Promise<boolean> => {
      try {
        if (!audioContextRef.current || !isAudioEnabledRef.current) {
          const initialized = await initializeAudioContext();
          if (!initialized) return false;
        }

        const response = await fetch(path);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContextRef.current!.decodeAudioData(arrayBuffer);
        
        const source = audioContextRef.current!.createBufferSource();
        const gainNode = audioContextRef.current!.createGain();
        
        gainNode.gain.value = volume;
        source.buffer = audioBuffer;
        source.connect(gainNode);
        gainNode.connect(audioContextRef.current!.destination);
        source.start();
        
        console.log('✅ Web Audio API played successfully:', path);
        return true;
      } catch (error) {
        console.warn('⚠️ Web Audio API failed:', path, error);
        return false;
      }
    };

    // Try HTML5 Audio first, then Web Audio API
    const htmlSuccess = await tryHtmlAudio(audioPath);
    if (htmlSuccess) return true;

    console.log('🔄 HTML5 Audio failed, trying Web Audio API...');
    const webAudioSuccess = await tryWebAudio(audioPath);
    if (webAudioSuccess) return true;

    console.error('❌ All audio methods failed for:', audioPath);
    return false;
  }, [initializeAudioContext]);

  // Play chat sound with fallbacks
  const playChatSound = useCallback(async (): Promise<boolean> => {
    console.log('🔊 Playing chat sound...');
    
    // Try MP3 first, then WAV as fallback
    const mp3Success = await playAudio('/chat-sound.mp3');
    if (mp3Success) return true;

    console.log('🔄 MP3 failed, trying WAV...');
    const wavSuccess = await playAudio('/chat-sound.wav');
    if (wavSuccess) return true;

    // Try sounds directory as final fallback
    console.log('🔄 WAV failed, trying sounds directory...');
    const soundsDirSuccess = await playAudio('/sounds/notification.mp3');
    return soundsDirSuccess;
  }, [playAudio]);

  // Play notification sound with fallbacks
  const playNotificationSound = useCallback(async (): Promise<boolean> => {
    console.log('🔔 Playing notification sound...');
    
    // Try notification-Sound.mp3 first
    const notificationSuccess = await playAudio('/notification-Sound.mp3');
    if (notificationSuccess) return true;

    console.log('🔄 notification-Sound.mp3 failed, trying sounds directory...');
    const soundsDirSuccess = await playAudio('/sounds/notification.mp3');
    if (soundsDirSuccess) return true;

    console.log('🔄 MP3 failed, trying WAV...');
    const wavSuccess = await playAudio('/sounds/notification.wav');
    return wavSuccess;
  }, [playAudio]);

  // Enable audio on user interaction
  const enableAudio = useCallback(async () => {
    const success = await initializeAudioContext();
    if (success) {
      console.log('🎵 Audio enabled after user interaction');
    }
    return success;
  }, [initializeAudioContext]);

  // Setup global audio functions and user interaction listeners
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let audioInitialized = false;

    // Define global enableAudio function
    window.enableAudio = async () => {
      console.log('🔊 Enabling audio...');
      const success = await initializeAudioContext();
      if (success) {
        audioInitialized = true;
        console.log('✅ Audio successfully initialized');
      }
      return success;
    };

    // Define global audio functions with initialization check
    window.playNotificationSound = async () => {
      console.log('🔔 Global playNotificationSound called');
      if (!audioInitialized) {
        console.log('🎵 Audio not initialized, attempting to initialize...');
        await window.enableAudio();
      }
      return playNotificationSound();
    };

    window.playChatSound = async () => {
      console.log('💬 Global playChatSound called');
      if (!audioInitialized) {
        console.log('🎵 Audio not initialized, attempting to initialize...');
        await window.enableAudio();
      }
      return playChatSound();
    };

    // Enhanced user interaction handler
    const enableAudioOnInteraction = async (event: Event) => {
      console.log('👆 User interaction detected:', event.type);
      const success = await initializeAudioContext();
      if (success) {
        audioInitialized = true;
        console.log('✅ Audio enabled after user interaction');
        
        // Remove all interaction listeners once audio is enabled
        document.removeEventListener('click', enableAudioOnInteraction);
        document.removeEventListener('keydown', enableAudioOnInteraction);
        document.removeEventListener('touchstart', enableAudioOnInteraction);
        document.removeEventListener('mousedown', enableAudioOnInteraction);
        document.removeEventListener('scroll', enableAudioOnInteraction);
      }
    };

    // Add multiple interaction listeners for better coverage
    document.addEventListener('click', enableAudioOnInteraction, { passive: true });
    document.addEventListener('keydown', enableAudioOnInteraction, { passive: true });
    document.addEventListener('touchstart', enableAudioOnInteraction, { passive: true });
    document.addEventListener('mousedown', enableAudioOnInteraction, { passive: true });
    document.addEventListener('scroll', enableAudioOnInteraction, { passive: true, once: true });

    // Handle visibility change to resume audio context
    const handleVisibilityChange = async () => {
      if (!document.hidden && audioContextRef.current?.state === 'suspended') {
        console.log('📱 Tab became visible, resuming audio context');
        try {
          await audioContextRef.current.resume();
          console.log('✅ Audio context resumed successfully');
        } catch (error) {
          console.error('❌ Failed to resume audio context:', error);
        }
      }
    };

    // Handle page focus/blur to maintain audio capability
    const handlePageFocus = async () => {
      console.log('🎯 Page focused, ensuring audio context is ready');
      if (audioContextRef.current?.state === 'suspended') {
        try {
          await audioContextRef.current.resume();
          console.log('✅ Audio context resumed on focus');
        } catch (error) {
          console.error('❌ Failed to resume audio context on focus:', error);
        }
      }
    };

    const handlePageBlur = () => {
      console.log('🌫️ Page blurred, audio context will remain active for notifications');
      // Don't suspend audio context to allow background notifications
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handlePageFocus);
    window.addEventListener('blur', handlePageBlur);

    // Cleanup function
    return () => {
      document.removeEventListener('click', enableAudioOnInteraction);
      document.removeEventListener('keydown', enableAudioOnInteraction);
      document.removeEventListener('touchstart', enableAudioOnInteraction);
      document.removeEventListener('mousedown', enableAudioOnInteraction);
      document.removeEventListener('scroll', enableAudioOnInteraction);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handlePageFocus);
      window.removeEventListener('blur', handlePageBlur);
    };
  }, [initializeAudioContext, playNotificationSound, playChatSound]);

  return {
    playChatSound,
    playNotificationSound,
    enableAudio,
    isAudioEnabled: isAudioEnabledRef.current
  };
};

export default useAudioManager;