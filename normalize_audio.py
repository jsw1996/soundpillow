"""
Normalize all audio files in public/audio/ to a consistent loudness level.

Two-stage approach:
  1. Apply gain to reach target RMS
  2. Soft-clip peaks using tanh to avoid harsh clipping while preserving RMS

Opus/OGG files are decoded via pyogg and re-encoded as Vorbis/OGG.
MP3s are converted to OGG/Vorbis (soundfile can't write MP3).
WAV files stay as WAV.

Original files in public/audio/ are left untouched.
Normalized files are written to public/audio_normalized/.

Requirements: pip install soundfile numpy pyogg
"""

import os
import numpy as np
import soundfile as sf
from pyogg import OpusFile

AUDIO_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "public", "audio")
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "public", "audio_normalized")
TARGET_DBFS = -20.0
MAX_GAIN_DB = 65.0
PEAK_CEILING = 0.95
SOFT_CLIP_KNEE = 0.6   # start soft clipping above this
WRITE_CHUNK = 200000


def rms_dbfs(samples: np.ndarray) -> float:
    rms = float(np.sqrt(np.mean(samples ** 2)))
    if rms == 0:
        return -120.0
    return 20.0 * np.log10(rms)


def db_to_gain(db: float) -> float:
    return 10.0 ** (db / 20.0)


def soft_clip(data: np.ndarray, knee: float = SOFT_CLIP_KNEE, ceiling: float = PEAK_CEILING) -> np.ndarray:
    """Soft-clip audio using tanh above knee threshold.
    Maps [knee, inf) -> [knee, ceiling) smoothly."""
    result = data.copy()
    magnitude = np.abs(data)
    above = magnitude > knee

    if np.any(above):
        sign = np.sign(data[above])
        excess = (magnitude[above] - knee) / knee  # normalized excess
        compressed = knee + (ceiling - knee) * np.tanh(excess)
        result[above] = sign * compressed

    return result


def read_audio(filepath: str):
    """Read audio file. Uses pyogg for Opus, soundfile for everything else."""
    info = sf.info(filepath)
    if info.subtype == "OPUS":
        opus = OpusFile(filepath)
        n_samples = opus.buffer_length // 2
        raw = np.ctypeslib.as_array(opus.buffer, shape=(n_samples,)).copy()
        data = raw.astype(np.float64) / 32768.0
        if opus.channels == 2:
            data = data.reshape(-1, 2)
        return data, opus.frequency
    else:
        return sf.read(filepath, dtype="float64")


def write_ogg_chunked(filepath: str, data: np.ndarray, samplerate: int):
    """Write OGG/Vorbis in chunks (avoids libsndfile crash on large buffers)."""
    channels = data.shape[1] if data.ndim == 2 else 1
    with sf.SoundFile(filepath, "w", samplerate=samplerate, channels=channels,
                      format="OGG", subtype="VORBIS") as f:
        for i in range(0, len(data), WRITE_CHUNK):
            f.write(data[i:i + WRITE_CHUNK])


def write_audio(filepath: str, data: np.ndarray, samplerate: int, original_ext: str) -> str:
    ext = original_ext.lower()
    if ext in (".ogg", ".mp3"):
        out_path = os.path.splitext(filepath)[0] + ".ogg"
        write_ogg_chunked(out_path, data, samplerate)
        return out_path
    elif ext == ".wav":
        sf.write(filepath, data, samplerate, format="WAV", subtype="PCM_16")
        return filepath
    else:
        out_path = os.path.splitext(filepath)[0] + ".wav"
        sf.write(out_path, data, samplerate, format="WAV", subtype="PCM_16")
        return out_path


def normalize(data: np.ndarray, dbfs: float) -> tuple[np.ndarray, float, float]:
    """Normalize audio to TARGET_DBFS with soft clipping. Returns (normalized, final_dbfs, peak)."""
    gain_db = TARGET_DBFS - dbfs
    gain_db = min(gain_db, MAX_GAIN_DB)
    gain = db_to_gain(gain_db)

    amplified = data * gain

    # Soft-clip to tame peaks while preserving RMS
    clipped = soft_clip(amplified)

    # Final safety hard-clip
    peak = float(np.max(np.abs(clipped)))
    if peak > PEAK_CEILING:
        clipped *= PEAK_CEILING / peak
        peak = PEAK_CEILING

    mono = clipped.mean(axis=1) if clipped.ndim == 2 else clipped
    final_dbfs = rms_dbfs(mono)
    return clipped, final_dbfs, peak


def main():
    if not os.path.isdir(AUDIO_DIR):
        print(f"Audio directory not found: {AUDIO_DIR}")
        return

    extensions = {".ogg", ".mp3", ".wav", ".flac"}
    files = sorted(
        f for f in os.listdir(AUDIO_DIR)
        if os.path.splitext(f)[1].lower() in extensions
    )
    if not files:
        print("No audio files found.")
        return

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Phase 1: Analyze
    print(f"Analyzing {len(files)} audio files...\n")
    print(f"  {'File':<45} {'RMS dBFS':>10} {'Needed':>8}")
    print(f"  {'-'*45} {'-'*10} {'-'*8}")

    file_data = []
    for f in files:
        filepath = os.path.join(AUDIO_DIR, f)
        try:
            data, sr = read_audio(filepath)
        except Exception as e:
            print(f"  {f:<45} ERROR: {e}")
            continue
        if data.size == 0:
            print(f"  {f:<45} SKIP (empty)")
            continue

        mono = data.mean(axis=1) if data.ndim == 2 else data
        dbfs = rms_dbfs(mono)
        gain_needed = TARGET_DBFS - dbfs
        file_data.append((f, data, sr, dbfs, gain_needed))
        print(f"  {f:<45} {dbfs:>+8.1f} dB {gain_needed:>+7.1f} dB")

    # Phase 2: Normalize and write
    print(f"\nNormalizing to {TARGET_DBFS} dBFS (with soft clipping) -> {OUTPUT_DIR}/\n")

    renames = []
    for f, data, sr, dbfs, _ in file_data:
        normalized, final_dbfs, peak = normalize(data, dbfs)

        ext = os.path.splitext(f)[1]
        out_basename = os.path.splitext(f)[0] + (".ogg" if ext.lower() in (".ogg", ".mp3") else ext)
        out_path = os.path.join(OUTPUT_DIR, out_basename)

        actual_path = write_audio(out_path, normalized, sr, ext)
        actual_name = os.path.basename(actual_path)

        delta = final_dbfs - dbfs
        status = "OK" if abs(final_dbfs - TARGET_DBFS) < 3.0 else "LOUD" if final_dbfs > TARGET_DBFS else "QUIET"
        print(f"  {f:<40} -> {actual_name:<35} {dbfs:>+6.1f} -> {final_dbfs:>+6.1f} dBFS  peak={peak:.2f}  [{status}]")

        if actual_name != f:
            renames.append((f, actual_name))

    print(f"\nDone! {len(file_data)} files normalized into {OUTPUT_DIR}/")
    if renames:
        print(f"\nFiles that changed extension (MP3 -> OGG):")
        for old, new in renames:
            print(f"  {old} -> {new}")
        print(f"\nUpdate src/constants.ts audioUrl references for these files.")


if __name__ == "__main__":
    main()
