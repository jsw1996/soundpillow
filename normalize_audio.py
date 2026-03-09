"""
Normalize all ambient audio files in public/audio/ to a consistent loudness level.

Two-stage approach:
    1. Apply gain to reach target RMS
    2. Soft-clip peaks using tanh to avoid harsh clipping while preserving RMS

Input formats supported: OGG, MP3, WAV, FLAC.
Output format: MP3 for every ambient track so the files play on iOS/WebKit.

Original files in public/audio/ are left untouched.
Normalized files are written to public/audio_normalized/.

Requirements: pip install soundfile numpy imageio-ffmpeg
"""

import os
import subprocess
import tempfile
from typing import Optional
import numpy as np
import soundfile as sf

try:
    import imageio_ffmpeg
except ImportError:
    imageio_ffmpeg = None

AUDIO_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "public", "audio")
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "public", "audio_normalized")
TARGET_DBFS = -30.0
MAX_GAIN_DB = 65.0
PEAK_CEILING = 0.95
SOFT_CLIP_KNEE = 0.6   # start soft clipping above this
WRITE_CHUNK = 200000
MP3_BITRATE = 192000


def get_ffmpeg_executable() -> Optional[str]:
    if imageio_ffmpeg is None:
        return None
    return imageio_ffmpeg.get_ffmpeg_exe()


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
    """Read audio with soundfile first, then fall back to ffmpeg for formats like OGG/Opus."""
    try:
        return sf.read(filepath, dtype="float64")
    except Exception as exc:
        ffmpeg = get_ffmpeg_executable()
        if ffmpeg is None:
            raise RuntimeError(f"Unable to read {filepath}: {exc}") from exc

        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
            temp_wav_path = temp_file.name

        try:
            subprocess.run(
                [
                    ffmpeg,
                    "-y",
                    "-i",
                    filepath,
                    "-vn",
                    "-acodec",
                    "pcm_s16le",
                    temp_wav_path,
                ],
                check=True,
                capture_output=True,
                text=True,
            )
            return sf.read(temp_wav_path, dtype="float64")
        except subprocess.CalledProcessError as ffmpeg_exc:
            stderr = ffmpeg_exc.stderr.strip() if ffmpeg_exc.stderr else ""
            stdout = ffmpeg_exc.stdout.strip() if ffmpeg_exc.stdout else ""
            details = stderr or stdout or str(ffmpeg_exc)
            raise RuntimeError(f"Unable to read {filepath}: {details}") from ffmpeg_exc
        finally:
            if os.path.exists(temp_wav_path):
                os.remove(temp_wav_path)


def write_wav_chunked(filepath: str, data: np.ndarray, samplerate: int):
    """Write WAV in chunks to keep memory usage stable on large buffers."""
    channels = data.shape[1] if data.ndim == 2 else 1
    with sf.SoundFile(filepath, "w", samplerate=samplerate, channels=channels,
                      format="WAV", subtype="PCM_16") as f:
        for i in range(0, len(data), WRITE_CHUNK):
            f.write(data[i:i + WRITE_CHUNK])


def write_mp3(filepath: str, data: np.ndarray, samplerate: int) -> str:
    out_path = os.path.splitext(filepath)[0] + ".mp3"
    ffmpeg = get_ffmpeg_executable()

    if ffmpeg is None:
        raise RuntimeError(
            "MP3 export requires imageio-ffmpeg. Install it with `python3 -m pip install --user imageio-ffmpeg`."
        )

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
        temp_wav_path = temp_file.name

    try:
        write_wav_chunked(temp_wav_path, data, samplerate)
        subprocess.run(
            [
                ffmpeg,
                "-y",
                "-i",
                temp_wav_path,
                "-codec:a",
                "libmp3lame",
                "-b:a",
                f"{MP3_BITRATE}",
                out_path,
            ],
            check=True,
            capture_output=True,
            text=True,
        )
        return out_path
    except subprocess.CalledProcessError as exc:
        stderr = exc.stderr.strip() if exc.stderr else ""
        stdout = exc.stdout.strip() if exc.stdout else ""
        details = stderr or stdout or str(exc)
        raise RuntimeError(f"ffmpeg failed for {out_path}: {details}") from exc
    finally:
        if os.path.exists(temp_wav_path):
            os.remove(temp_wav_path)


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

        out_basename = os.path.splitext(f)[0] + ".mp3"
        out_path = os.path.join(OUTPUT_DIR, out_basename)

        actual_path = write_mp3(out_path, normalized, sr)
        actual_name = os.path.basename(actual_path)

        delta = final_dbfs - dbfs
        status = "OK" if abs(final_dbfs - TARGET_DBFS) < 3.0 else "LOUD" if final_dbfs > TARGET_DBFS else "QUIET"
        print(f"  {f:<40} -> {actual_name:<35} {dbfs:>+6.1f} -> {final_dbfs:>+6.1f} dBFS  peak={peak:.2f}  [{status}]")

        if actual_name != f:
            renames.append((f, actual_name))

    print(f"\nDone! {len(file_data)} files normalized into {OUTPUT_DIR}/")
    if renames:
        print(f"\nFiles that changed extension:")
        for old, new in renames:
            print(f"  {old} -> {new}")
        print(f"\nUpdate ambient audio asset references to point at the new MP3 files.")


if __name__ == "__main__":
    main()
