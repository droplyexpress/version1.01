// Notification sound using HTML5 Audio element
// This is more reliable on mobile browsers than Web Audio API

let audioElement: HTMLAudioElement | null = null;
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioContext) {
      const contextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      audioContext = new contextClass();

      // Resume audio context on user interaction for mobile compatibility
      if (audioContext.state === "suspended") {
        const resumeAudio = () => {
          audioContext
            ?.resume()
            .catch((err) => console.error("[Audio] Failed to resume:", err));
          document.removeEventListener("click", resumeAudio);
          document.removeEventListener("touchstart", resumeAudio);
        };
        document.addEventListener("click", resumeAudio);
        document.addEventListener("touchstart", resumeAudio);
      }
    }
    return audioContext;
  } catch (error) {
    console.error("[Audio] Error creating audio context:", error);
    return null;
  }
}

function initializeAudioElement(): void {
  if (audioElement) return;

  try {
    audioElement = new Audio();
    audioElement.preload = "auto";
    audioElement.volume = 1.0; // Full volume for alerts
    audioElement.src = "/notification-sound.mp3";
    audioElement.crossOrigin = "anonymous";
    console.log("[Audio] Audio element initialized");
  } catch (error) {
    console.error("[Audio] Error initializing audio element:", error);
  }
}

function playAudioFile(): Promise<void> {
  return new Promise((resolve) => {
    try {
      initializeAudioElement();

      if (!audioElement) {
        console.warn("[Audio] Audio element not available");
        resolve();
        return;
      }

      // Reset and play
      audioElement.currentTime = 0;

      const playPromise = audioElement.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log("[Audio] Sound file playing successfully");
            resolve();
          })
          .catch((err) => {
            // Autoplay policy errors are expected and normal - don't log as error
            if (err.name === "NotAllowedError") {
              console.log(
                "[Audio] Autoplay blocked by browser policy - this is normal",
              );
            } else {
              console.warn("[Audio] Error playing audio file:", err.message);
              // Fallback to tone if file fails
              playTone();
            }
            resolve();
          });
      } else {
        console.log("[Audio] Audio play started");
        resolve();
      }
    } catch (error) {
      console.error("[Audio] Error in playAudioFile:", error);
      resolve();
    }
  });
}

function playTone(): void {
  try {
    const context = getAudioContext();
    if (!context) {
      console.warn("[Audio] Audio context not available for tone fallback");
      return;
    }

    // Resume if suspended
    if (context.state === "suspended") {
      context.resume().then(() => playAlertTone(context));
      return;
    }

    playAlertTone(context);
  } catch (error) {
    console.error("[Audio] Error playing tone fallback:", error);
  }
}

function playAlertTone(context: AudioContext): void {
  try {
    // Create a simple alert tone: 1000Hz for 0.5 seconds
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.frequency.value = 1000; // Frequency in Hz
    oscillator.type = "sine";

    // Set volume
    gainNode.gain.setValueAtTime(0.5, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5);

    // Play tone
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.5);

    console.log("[Audio] Alert tone playing (fallback)");
  } catch (error) {
    console.error("[Audio] Error in playAlertTone:", error);
  }
}

export function playNewOrderSound(): void {
  console.log("[Audio] Playing new order notification sound");
  playAudioFile();
}

export function playOrderAssignedSound(): void {
  console.log("[Audio] Playing order assigned notification sound");
  playAudioFile();
}

// Initialize audio context on first user interaction
export function initializeAudioOnUserInteraction(): void {
  const initAudio = () => {
    console.log("[Audio] Initializing on user interaction");
    const context = getAudioContext();
    if (context && context.state === "suspended") {
      context.resume().then(() => {
        console.log("[Audio] Audio context resumed");
      });
    }
    initializeAudioElement();
    document.removeEventListener("click", initAudio);
    document.removeEventListener("touchstart", initAudio);
  };

  document.addEventListener("click", initAudio, { once: true });
  document.addEventListener("touchstart", initAudio, { once: true });
}
