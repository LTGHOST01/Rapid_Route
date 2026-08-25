export type SirenKind = "AMBULANCE" | "FIRE" | "POLICE";

const MUTE_KEY = "rr_siren_muted";

const SAMPLES: Record<SirenKind, string> = {
  AMBULANCE: "/sirens/ambulance.mp3",
  FIRE: "/sirens/fire.mp3",
  POLICE: "/sirens/police.wav",
};

export function sirenLabel(kind: SirenKind) {
  if (kind === "FIRE") return "Fire truck siren";
  if (kind === "POLICE") return "Police yelp";
  return "Ambulance siren";
}

let player: HTMLAudioElement | null = null;
let current: SirenKind | null = null;
let wanted: SirenKind | null = null;
let muted = localStorage.getItem(MUTE_KEY) === "1";

const cache: Partial<Record<SirenKind, HTMLAudioElement>> = {};

function load(kind: SirenKind) {
  const existing = cache[kind];
  if (existing) return existing;
  const audio = new Audio(SAMPLES[kind]);
  audio.loop = true;
  audio.preload = "auto";
  audio.volume = kind === "FIRE" ? 0.88 : 0.82;
  cache[kind] = audio;
  return audio;
}

export function isSirenMuted() {
  return muted;
}

export function setSirenMuted(next: boolean) {
  muted = next;
  localStorage.setItem(MUTE_KEY, next ? "1" : "0");
  if (next) {
    haltAudio();
    return;
  }
  if (wanted) startSiren(wanted);
}

export function startSiren(kind: SirenKind) {
  wanted = kind;
  if (muted) return;
  if (current === kind && player && !player.paused) {
    void player.play().catch(() => undefined);
    return;
  }
  haltAudio();
  const audio = load(kind);
  audio.currentTime = 0;
  player = audio;
  current = kind;
  void audio.play().catch(() => {
    current = null;
  });
}

function haltAudio() {
  if (player) {
    player.pause();
    player.currentTime = 0;
  }
  player = null;
  current = null;
}

export function stopSiren() {
  wanted = null;
  haltAudio();
}

export function previewSiren(kind: SirenKind, ms = 2800) {
  if (wanted) {
    startSiren(wanted);
    return;
  }
  startSiren(kind);
  window.setTimeout(() => {
    if (wanted === kind) stopSiren();
  }, ms);
}

["AMBULANCE", "FIRE", "POLICE"].forEach((kind) => load(kind as SirenKind));
