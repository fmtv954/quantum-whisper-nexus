/**
 * AudioEffects - Handles phone ring and on-hold music
 * Separate from RealtimeAudio to avoid WebRTC interference
 */

let holdMusicAudio: HTMLAudioElement | null = null;

export const playPhoneRing = (minimumDurationMs = 3000): Promise<void> => {
  return new Promise((resolve) => {
    const ringAudio = new Audio('/audio/phone-ring.mp3');
    ringAudio.loop = true;

    let resolved = false;
    let minimumTimerComplete = minimumDurationMs === 0;
    const cleanupAndResolve = () => {
      if (resolved) return;
      resolved = true;

      try {
        ringAudio.pause();
      } catch (error) {
        console.warn('Failed to pause phone ring audio on cleanup:', error);
      }

      resolve();
    };

    if (minimumDurationMs > 0) {
      window.setTimeout(() => {
        minimumTimerComplete = true;
        if (ringAudio.ended || ringAudio.paused) {
          cleanupAndResolve();
        }
      }, minimumDurationMs);
    }

    ringAudio.onended = () => {
      if (minimumTimerComplete) {
        cleanupAndResolve();
      }
    };

    ringAudio.onerror = () => {
      console.error('Error playing phone ring');
      cleanupAndResolve();
    };

    ringAudio.play().catch(err => {
      console.error('Failed to play phone ring:', err);
      cleanupAndResolve();
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
