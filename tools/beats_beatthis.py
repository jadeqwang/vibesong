"""Beat + downbeat tracking with beat_this (run with moongazing venv python, GPU)."""
import json, sys
from pathlib import Path
from beat_this.inference import File2Beats
ROOT = Path(__file__).resolve().parents[1]
f2b = File2Beats(checkpoint_path="final0", device="cuda", dbn=False)
beats, downbeats = f2b(str(ROOT / "work/song.wav"))
out = dict(beats=[float(b) for b in beats], downbeats=[float(d) for d in downbeats])
(ROOT / "work/beatthis.json").write_text(json.dumps(out, indent=1))
print(len(beats), len(downbeats), beats[:8], downbeats[:4])
