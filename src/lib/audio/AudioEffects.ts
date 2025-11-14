/**
 * AudioEffects - Handles phone ring and on-hold music
 * Separate from RealtimeAudio to avoid WebRTC interference
 */

let holdMusicAudio: HTMLAudioElement | null = null;

export const playPhoneRing = (minimumDurationMs = 3000): Promise<void> => {
  return new Promise((resolve) => {
    const ringAudio = new Audio('/audio/phone-ring.mp3');
    ringAudio.loop = true;

    const cleanup = () => {
      try {
        ringAudio.pause();
        ringAudio.currentTime = 0;
      } catch (error) {
        console.warn('Failed to stop phone ring:', error);
      }
    };

    // Stop after minimum duration
    const timer = window.setTimeout(() => {
      cleanup();
      resolve();
    }, minimumDurationMs);

    // Handle errors
    ringAudio.onerror = () => {
      console.error('Error playing phone ring');
      clearTimeout(timer);
      cleanup();
      resolve();
    };

    // Start playing
    ringAudio.play().catch(err => {
      console.error('Failed to play phone ring:', err);
      clearTimeout(timer);
      cleanup();
      resolve();
    });
  });
};

export const startHoldMusic = (): void => {
  if (holdMusicAudio) {
    stopHoldMusic();
  }
  
  holdMusicAudio = new Audio('/audio/on-hold-music.mp3');
  holdMusicAudio.loop = true;
  holdMusicAudio.volume = 0.5;
  
  holdMusicAudio.play().catch(err => {
    console.error('Failed to play hold music:', err);
  });
};

export const stopHoldMusic = (): void => {
  if (holdMusicAudio) {
    holdMusicAudio.pause();
    holdMusicAudio.currentTime = 0;
    holdMusicAudio = null;
  }
};
