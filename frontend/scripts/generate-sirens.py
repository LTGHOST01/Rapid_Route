#!/usr/bin/env python3
"""Generate looping emergency-siren WAVs (stdlib only)."""

from __future__ import annotations

import math
import struct
import wave
from pathlib import Path

SR = 44100
OUT = Path(__file__).resolve().parents[1] / "public" / "sirens"


def sat(x: float) -> float:
    return math.tanh(x)


def fade(i: int, n: int, edge: int = 180) -> float:
    if i < edge:
        return i / edge
    if i > n - edge:
        return (n - i) / edge
    return 1.0


def tone(freq: float, t: float, harmonics: list[float]) -> float:
    s = 0.0
    for idx, amp in enumerate(harmonics, start=1):
        s += amp * math.sin(2.0 * math.pi * freq * idx * t)
    return s


def write_wav(path: Path, samples: list[float]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    peak = max(abs(x) for x in samples) or 1.0
    with wave.open(str(path), "w") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(SR)
        frames = bytearray()
        for i, raw in enumerate(samples):
            shaped = sat(raw / peak * 1.35) * fade(i, len(samples)) * 0.92
            frames += struct.pack("<h", max(-32767, min(32767, int(shaped * 32767))))
        wav.writeframes(frames)


def hilo(
    lo: float,
    hi: float,
    half: float,
    cycles: int,
    harmonics: list[float],
    glide: float,
) -> list[float]:
    half_n = int(half * SR)
    glide_n = max(8, int(glide * SR))
    samples: list[float] = []
    t0 = 0
    for _ in range(cycles):
        for target in (lo, hi):
            prev = hi if target == lo else lo
            for i in range(half_n):
                t = (t0 + i) / SR
                if i < glide_n:
                    w = i / glide_n
                    freq = prev + (target - prev) * (0.5 - 0.5 * math.cos(math.pi * w))
                else:
                    freq = target
                samples.append(tone(freq, t, harmonics))
            t0 += half_n
    return samples


def wail(lo: float, hi: float, period: float, cycles: int, harmonics: list[float]) -> list[float]:
    n = int(period * SR * cycles)
    samples: list[float] = []
    for i in range(n):
        t = i / SR
        phase = (t % period) / period
        tri = phase * 2 if phase < 0.5 else (1 - phase) * 2
        freq = lo + (hi - lo) * tri
        samples.append(tone(freq, t, harmonics))
    return samples


def main() -> None:
    ambulance = hilo(
        lo=656.0,
        hi=878.0,
        half=0.42,
        cycles=8,
        harmonics=[1.0, 0.48, 0.26, 0.14, 0.08, 0.04],
        glide=0.045,
    )
    fire = hilo(
        lo=246.0,
        hi=370.0,
        half=0.30,
        cycles=10,
        harmonics=[1.0, 0.72, 0.38, 0.52, 0.18, 0.22, 0.10],
        glide=0.018,
    )
    police = wail(
        lo=740.0,
        hi=1680.0,
        period=0.24,
        cycles=16,
        harmonics=[1.0, 0.35, 0.18, 0.10, 0.05],
    )
    write_wav(OUT / "ambulance.wav", ambulance)
    write_wav(OUT / "fire.wav", fire)
    write_wav(OUT / "police.wav", police)
    print(f"wrote {OUT}")


if __name__ == "__main__":
    main()
