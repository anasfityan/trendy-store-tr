type SoundType = "tap" | "success" | "error" | "open" | "close";

type AC = typeof AudioContext;

// Reuse a single context — recreate only if closed or missing
let sharedCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    if (!sharedCtx || sharedCtx.state === "closed") {
      const Ctor: AC = window.AudioContext ||
        (window as unknown as { webkitAudioContext: AC }).webkitAudioContext;
      sharedCtx = new Ctor();
    }
    if (sharedCtx.state === "suspended") {
      sharedCtx.resume().catch(() => {});
    }
    return sharedCtx;
  } catch {
    return null;
  }
}

function playTone(
  ac: AudioContext,
  freq: number,
  endFreq: number,
  duration: number,
  volume: number,
  type: OscillatorType = "sine",
  delay = 0,
) {
  const t = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  osc.frequency.exponentialRampToValueAtTime(endFreq, t + duration);
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.start(t);
  osc.stop(t + duration + 0.01);
}

function haptic(ms = 6) {
  try { if (navigator.vibrate) navigator.vibrate(ms); } catch { /* ignore */ }
}

export function playSound(type: SoundType = "tap") {
  try {
    const ac = getCtx();
    if (!ac) return;

    switch (type) {
      case "tap":
        haptic(6);
        playTone(ac, 900, 600, 0.07, 0.10, "sine");
        playTone(ac, 1100, 700, 0.05, 0.07, "sine", 0.04);
        break;

      case "success":
        haptic(8);
        playTone(ac, 520, 780, 0.09, 0.11, "sine");
        playTone(ac, 660, 1040, 0.11, 0.08, "sine", 0.07);
        break;

      case "error":
        haptic(12);
        playTone(ac, 380, 200, 0.13, 0.13, "sine");
        break;

      case "open":
        haptic(5);
        playTone(ac, 420, 720, 0.09, 0.11, "sine");
        break;

      case "close":
        haptic(5);
        playTone(ac, 720, 420, 0.08, 0.10, "sine");
        break;
    }
  } catch {
    // ignore — sound not critical
  }
}
