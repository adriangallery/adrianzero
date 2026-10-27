/** Intro jingle (audio track of /zombie/intro.mp4), kept outside React so it survives the intro → builder switch. */
let introAudio: HTMLAudioElement | null = null;

export function playIntroAudio() {
  try {
    stopIntroAudio();
    introAudio = new Audio('/zombie/intro.mp4');
    introAudio.volume = 0.8;
    void introAudio.play().catch(() => undefined);
  } catch {
    /* ignore */
  }
}

/** Stop the intro jingle (called when leaving /zombie). */
export function stopIntroAudio() {
  try {
    introAudio?.pause();
  } catch {
    /* ignore */
  }
  introAudio = null;
}
