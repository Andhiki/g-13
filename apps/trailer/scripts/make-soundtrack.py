"""Generate an original upbeat electronic score and synchronized interface sounds."""
import math
import random
import struct
import wave
from pathlib import Path

RATE = 22050
DURATION = 28
BPM = 120
BEAT = 60 / BPM
samples = [0.0] * int(RATE * DURATION)
rng = random.Random(13)


def mix(start, duration, sound):
    offset = round(start * RATE)
    for index in range(round(duration * RATE)):
        position = offset + index
        if position >= len(samples):
            break
        samples[position] += sound(index / RATE)


def note(start, duration, pitch, level, bass=False):
    frequency = 440 * 2 ** ((pitch - 69) / 12)

    def sound(t):
        envelope = min(1, t / 0.004) * math.exp(-t * 4 / duration)
        envelope *= min(1, (duration - t) / 0.025)
        phase = math.tau * frequency * t
        tone = math.sin(phase) + (0.16 if bass else 0.32) * math.sin(phase * 2)
        if not bass:
            tone += 0.12 * math.sin(phase * 3)
        return tone * envelope * level

    mix(start, duration, sound)


def kick(start):
    def sound(t):
        phase = math.tau * (52 * t + 110 * (1 - math.exp(-t * 35)) / 35)
        return math.sin(phase) * math.exp(-t * 19) * 0.22

    mix(start, 0.32, sound)


def snare(start):
    def sound(t):
        noise = rng.uniform(-1, 1)
        body = math.sin(math.tau * 185 * t) * math.exp(-t * 45)
        return (noise * 0.07 + body * 0.045) * math.exp(-t * 27)

    mix(start, 0.19, sound)


def hat(start, accent):
    previous = 0.0
    duration = 0.11 if accent else 0.055

    def sound(t):
        nonlocal previous
        noise = rng.uniform(-1, 1)
        high = noise - previous
        previous = noise
        return high * math.exp(-t * (45 if accent else 85)) * 0.017

    mix(start, duration, sound)


chords = [
    [50, 54, 57, 61],
    [45, 49, 52, 57],
    [47, 50, 54, 57],
    [43, 47, 50, 54],
    [50, 54, 57, 61],
    [45, 49, 52, 57],
    [50, 54, 57, 62],
]
arpeggio = [0, 2, 1, 3, 2, 1, 3, 2]

for beat in range(52):
    start = beat * BEAT
    chord = chords[min(int(start // 4), len(chords) - 1)]
    kick(start)
    if beat % 4 in [1, 3]:
        snare(start)
    hat(start, False)
    hat(start + BEAT / 2, True)
    note(start, 0.32, chord[0] - 12 + ([0, 0, 7, 12][beat % 4]), 0.10, bass=True)
    for half in range(2):
        step = beat * 2 + half
        note(start + half * BEAT / 2, 0.23, chord[arpeggio[step % 8]] + 12,
             0.045 if half == 0 else 0.035)
    if beat % 2 == 0:
        for pitch in chord:
            note(start + BEAT / 2, 0.22, pitch, 0.027)

# Resolve the rhythm into the closing logos.
kick(26)
for pitch in [50, 54, 57, 62, 69]:
    note(26, 1.9, pitch, 0.04)

for start in [3.8 + i * 0.15 for i in range(9)] + [6.85, 11.3, 15.55, 16.9, 21.65]:
    mix(start, 0.045, lambda t: rng.uniform(-1, 1) * 0.09 * math.exp(-t * 130))

gain = 0.84 / max(abs(value) for value in samples)
output = Path(__file__).resolve().parents[1] / "public" / "soundtrack.wav"
with wave.open(str(output), "wb") as audio:
    audio.setnchannels(1)
    audio.setsampwidth(2)
    audio.setframerate(RATE)
    for i, value in enumerate(samples):
        fade = min(1, i / RATE / 0.03, (DURATION - i / RATE) / 0.5)
        audio.writeframesraw(struct.pack("<h", round(value * gain * fade * 32767)))
