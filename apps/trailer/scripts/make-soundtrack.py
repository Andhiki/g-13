"""Generate the trailer's original ambient score and synchronized interface sounds."""
import math
import random
import struct
import wave
from pathlib import Path

RATE = 22050
DURATION = 28
samples = [0.0] * int(RATE * DURATION)


def note(start, duration, frequency, level, attack=0.025):
    for index in range(int(duration * RATE)):
        position = int(start * RATE) + index
        if position >= len(samples):
            break
        t = index / RATE
        envelope = min(1, t / attack) * math.exp(-t * 2.6 / duration)
        envelope *= min(1, (duration - t) / 0.12)
        tone = math.sin(math.tau * frequency * t)
        tone += 0.18 * math.sin(math.tau * frequency * 2 * t)
        samples[position] += tone * envelope * level


# Four gentle chord changes follow the search, graph, planner, and archive shots.
for start, pitches in [(0, [48, 55, 59, 64]), (8, [45, 52, 55, 60]),
                       (14, [41, 48, 52, 57]), (20, [43, 50, 55, 59])]:
    for pitch in pitches:
        note(start, 9 if start == 0 else 7.5, 440 * 2 ** ((pitch - 69) / 12), 0.026, attack=1.1)
    for offset, pitch in enumerate(pitches):
        note(start + 0.5 + offset * 0.6, 2.8,
             440 * 2 ** ((pitch + 24 - 69) / 12), 0.022, attack=0.02)

rng = random.Random(13)
for start in [3.8 + i * 0.15 for i in range(9)] + [6.85, 11.3, 15.55, 16.9, 21.65]:
    for index in range(int(0.045 * RATE)):
        t = index / RATE
        samples[int(start * RATE) + index] += rng.uniform(-1, 1) * 0.055 * math.exp(-t * 130)

note(25.2, 2.5, 523.25, 0.05)
note(25.45, 2.2, 783.99, 0.035)
output = Path(__file__).resolve().parents[1] / "public" / "soundtrack.wav"
with wave.open(str(output), "wb") as audio:
    audio.setnchannels(1)
    audio.setsampwidth(2)
    audio.setframerate(RATE)
    for i, value in enumerate(samples):
        fade = min(1, i / RATE / 0.5, (DURATION - i / RATE) / 1.5)
        audio.writeframesraw(struct.pack("<h", round(max(-1, min(1, value * fade)) * 32767)))
