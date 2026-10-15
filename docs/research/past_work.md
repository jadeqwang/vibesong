# Past music-video work: research digest for vibesong

Compiled 2026-10-14 from read-only research. It covers four shipped or archived projects, the Claude memory files in
`~/.claude/projects/*/memory/`, and the existing recon handbook `rewind-take-two/docs/recon/pipeline.md`. That handbook
is the best single prior summary, but its paths are out of date (see §0). No secret values appear here: this report gives
variable names and file paths only.

Abbreviations:
- **OS** = Orbital Sunrise
- **RE** = Rare Earth techno remix
- **MG** = Moongazing, the family cut. Private repo.
- **MGP** = Moongazing public recast
- **RW1** = the first Rewind attempt
- **RW2** = rewind-take-two (the acoustic lyric video plus the cinematic edition)

---
## 0. READ FIRST: repos moved, so many paths in the old docs are stale

Around 2026-10-14 the repos were moved, and every doc, memory file and script default still uses the old paths.

| Old path (in docs, memory, scripts) | Current path |
|---|---|
| `~/Documents/orbital-sunrise-video` | `~/Documents/1-music-shipped/orbital-sunrise-video` |
| `~/Documents/rare-earth-techno-remix` | `~/Documents/1-music-shipped/rare-earth-techno-remix` |
| `~/Documents/moongazing` | `~/Documents/1-music-shipped/moongazing` |
| `~/Documents/moongazing-public-version` | `~/Documents/1-music-shipped/moongazing-public-version` |
| `~/Documents/rewind-music-video` | `~/Documents/1-archive/rewind-music-video` |
| `~/Documents/rewind-take-two` | unchanged |

**Broken as a result:**
- These symlinks dangle:
  - `1-music-shipped/moongazing/.venv/bin/ffmpeg`
  - `1-music-shipped/orbital-sunrise-video/video/out/bin/ffmpeg`
  - `rewind-take-two/analysis/karaoke/bin/ffmpeg`
  - `rewind-take-two/analysis/cinematic/work/ffbin/ffmpeg`
- The `FFMPEG` default in `rewind-take-two/tools/gen/gen.py` (`~/Documents/moongazing/.venv/bin/ffmpeg`) no longer exists.
- `REFS768` in `moongazing/tools/vgen.py` points to the old rewind-music-video path.
- Console scripts in `moongazing/.venv/bin/*` have shebangs with the old path. Call `…/.venv/bin/python -m <module>` instead.
  The venv's `python` itself still works, because it symlinks to uv's CPython 3.12.
- `rewind-take-two/README.md` refers to `/home/jade/Documents/rewind-music-video/.venv-karaoke/bin/python`, which is now under `1-archive`.

### The `refs_768` folder (asked for)

`/home/jade/Documents/1-archive/rewind-music-video/assets/character/refs_768`:
- **25 files**, 1.8 MB: Jade's real photos downscaled to 768 px, plus the approved traces.
- Filenames include:
  - `jade_trace_base.jpg`, `jade_trace_jacket_hp_2.jpg`
  - `IMG_20160827_121631.jpg` and `IMG_20160827_121631_face.jpg`, `IMG_20170223_162015_face.jpg`
  - `PXL_20260929_001719023.jpg`, `PXL_20241109_220549282.jpg`
  - `MVIMG_20171213_083641.jpg`, `Pasted image.jpg` (the anime outfit sheet)

These are personal photos. The rule carried across projects: use only her own likeness, and never send photos of her
children or husband to a model. Check each photo before using it as a reference.

Sibling folders in `…/assets/character/`:
- `anime/`: `CANON_SHEET_v3.jpg`, `CANON_HEAD_front.jpg`, `CANON_HEAD_34.jpg`, and the `committee_v3_*_ff.png` set of 8 Jades at a defense table.
- `refs_small/`, `v2/` (holds `measure.json`, the likeness ratios), `firstframes/`.
- `facetools.py`, `lines_check.py`, `gen.py`, `runq.py`.

---
## 1. Machine environment (verified today)

### ffmpeg and ffprobe

There is no system ffmpeg or ffprobe on PATH (`which` finds neither).

**Working ffmpeg binaries.** All are the johnvansickle **ffmpeg 7.0.2-static** build:
- **`/home/jade/Documents/vibesong/.venv/lib/python3.12/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2`**: the vibesong venv already has imageio-ffmpeg.
- `/home/jade/Documents/1-music-shipped/moongazing/.venv/lib/python3.12/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2`
- `/home/jade/Documents/1-music-shipped/orbital-sunrise-video/video/out/.venv/lib/python3.12/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2`
- `/home/jade/Documents/1-archive/rewind-music-video/.venv-karaoke/lib/python3.12/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2`
- `/home/jade/.cache/uv/archive-v0/BOK6g3jXSe1slDuL/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2`. Older notes cite `…/4EHbzIPNFeWJbVkx/…`, which is gone.

**Real ffprobe (static 7.0.2):**
- `/home/jade/Documents/1-music-shipped/moongazing/render/out/lyric_video/ffprobe`, with a copy in `…/lyric_video_2down/ffprobe`.
- The full static tarball (ffmpeg plus ffprobe) is `/home/jade/Documents/1-music-shipped/moongazing/render/out/lyric_video/ffmpeg-tools.tar.xz`. Unpack it to get a matched pair.

**Other probe options:**
- PyAV (`av`), in the MG venv: `gen.probe(path)` in the gen clients.
- OS `tools/ffprobe_standin.py`, a Python stand-in that only answers `-show_entries format=duration`.

**Build capabilities:**
- **No `drawtext` filter.** `ass` and `subtitles` (libass, fontconfig, freetype, fribidi) **work**, so burn type in with ASS.
- Also present: libx264, libx265, libvpx-vp9, prores_ks, aac, libmp3lame, librubberband, zscale and loudnorm.

### Other tools
- **Chrome:** `/opt/google/chrome/chrome`. There is no Playwright Chromium. Set `CHROME=/opt/google/chrome/chrome`, because the renderers default to `/opt/pw-browsers/chromium-1194/...`, a cloud-sandbox path.
- **Node:** `/usr/bin/node` v22.23.2.
- **Other binaries:** `uv` at `~/.local/bin/uv`, `codex` at `~/.local/bin/codex`, tmux at `/usr/bin/tmux`.
- **GPU:** RTX 3090, 24 GB. CUDA torch is in the MG venv.
- **Disk:** `/` is 94 % full, with 53 GB free.
- **`/tmp`:** a 16 GB tmpfs, 39 % used. It fills up. Chrome renders with more than one worker then crash, so `export TMPDIR=<repo>/…/tmp` on disk.
- **Not present:** rubberband-cli, Blender, Remotion. No project used Remotion or Blender.

### Python environments

Relevant packages, checked with `importlib.metadata`:

| venv | Packages |
|---|---|
| `~/Documents/vibesong/.venv` (py3.12) | numpy 2.5.4, scipy, librosa 1.0.0, soundfile, pillow, matplotlib, numba, fonttools, imageio-ffmpeg, requests. **No** torch, whisper, cv2 or av. |
| **`~/Documents/1-music-shipped/moongazing/.venv`** (py3.12; **the main heavy env**) | torch 2.6.0+cu124, torchaudio, faster-whisper 1.2.1, openai-whisper, stable-ts 2.19.1, demucs 4.1.0, audio-separator 0.47.0, **beat-this 1.1.0**, librosa 1.0.0, transformers, onnxruntime(-gpu), **av 19** (PyAV), pydub, lameenc, pypinyin, jsonschema, imageio-ffmpeg, pillow, scipy, matplotlib. **No** cv2, mediapipe or moviepy. |
| `~/Documents/1-music-shipped/orbital-sunrise-video/video/out/.venv` (py3.12) | **mediapipe 0.10.14** (the tools require this exact version), opencv-python-headless and opencv-contrib 4.11, rembg 2.0.67, onnxruntime, scikit-image, numpy 1.26.4, scipy, pillow. **No** librosa or soundfile. |
| `~/Documents/1-archive/rewind-music-video/.venv-karaoke` | numpy, onnxruntime, soundfile, pillow, imageio-ffmpeg only |
| `~/Documents/1-music-shipped/rare-earth-techno-remix/ddr/.venv` (py3.13) | numpy, scipy, soundfile, pillow, imageio-ffmpeg (plus simfile, for StepMania charts) |
| `/usr/bin/python3` (3.13) | pycairo and requests only. No numpy. |

None of them has moviepy, whisperx, madmom or pocketsphinx.

**Cached models on disk:**
- `~/.cache/huggingface/hub/models--Systran--faster-whisper-large-v3`, `models--adefossez--HTDemucs-ft`
- `Kim_Vocal_2.onnx` in `1-archive/rewind-music-video/analysis/karaoke/models/`
- `UVR_MDXNET_KARA_2.onnx` and `6_HP-Karaoke-UVR.pth` in `rewind-take-two/analysis/karaoke/models/`
- MediaPipe `face_landmarker.task` in `1-music-shipped/moongazing/tools/sync/models/` and `1-archive/rewind-music-video/tools/likeness/models/`
- `/tmp/work`, the cache OS and RE used, is gone.

---
## 2. Generation stack: Cloudflare unified catalog (all image, video, ElevenLabs and ASR)

**There are no provider API keys anywhere.** Every model, ElevenLabs included, is called through Jade's Cloudflare account.

### Auth (local machine, the current method)
- The Wrangler OAuth token lives in **`~/.config/.wrangler/config/default.toml`** (keys `oauth_token`, `refresh_token`, `expiration_time`, `scopes`; mode 600).
- It is read at call time by `cfauth.py`. Within 2 minutes of expiry, the helper runs `npx -y wrangler whoami` to refresh it. If that fails, Jade runs `npx wrangler login`.
- The env var **`CLOUDFLARE_API_TOKEN`** wins if set. It is currently unset.
- The token's `expiration_time` is past (2026-10-12), so the first call will auto-refresh it.
- Jade allowed this use of her Wrangler login on 2026-10-04.

**Account id:** env **`CF_ACCOUNT_ID`**, or the first token of one of these gitignored files:
- `rewind-take-two/work/cf_account_id.txt`
- `1-music-shipped/moongazing-public-version/work/cf_account_id.txt`

Older tools (OS `cfai.py`, RE `gen.py`, MG `cfauth.py`) hard-code it as `ACC`. Never commit it in a public repo.

**Relay KV namespace id:** env **`GEN_KV_NS`**, or `rewind-take-two/work/gen_kv_ns.txt`. It is the JOBS namespace of the Worker `rare-earth-v3-relay`.

**Old, now unusable auth:**
- OS and RE ran in a cloud sandbox whose proxy injected auth, with a 30 s request cap and `*.workers.dev` blocked.
- Their webhook secrets (`/tmp/work/relay/hook_secret.txt` for OS; the `RELAY_SECRET_FILE` env var for RE) are gone.
- RE `gen.py` will send `CLOUDFLARE_API_TOKEN` if it is set.

### Endpoints
- **`API = https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}`**, with header `Authorization: Bearer <token>`.
- **Unified catalog:** `POST {API}/ai/run`, body `{"model": "google/nano-banana-pro", "input": {...}}`.
  - The result is `{"result": {"state": "Completed", "result": {"image"|"video"|"audio": url | data-uri}}}`.
  - The URLs are presigned R2 links that expire, so download them promptly.
- **Workers AI:** `POST {API}/ai/run/@cf/<model>`, with the input as the body. For example `@cf/openai/whisper-large-v3-turbo`.
  - Jade's preference (memory): when a model exists both ways, use the `@cf/` version.
  - Ask her before signing up for any new paid service.
- **Background runs:** `"options": {"background": true, "webhookUrl": …}` returns 202 with a `runId`. `GET /ai/runs/{id}` returns **405**, so these runs cannot be polled.
- **KV REST:** `{API}/storage/kv/namespaces/{NS}/values/{key}`.

### The video path: the cron relay queue (no secret needed)
1. `gen.py submit` PUTs `job:<minuteBucket>:<prefix>/<tag>-<id>` into KV `rare-earth-v3-jobs`.
   - The first bucket is now + 2 minutes, with 2 jobs per minute (`GEN_PER_MINUTE`).
   - The job body must be **24 MiB or less**. Shrink references with `gen.py ref-image` (JPEG, 2048 px max) and `audio-ref` (mp3, 192k).
2. The Worker **`rare-earth-v3-relay`** runs on cron `* * * * *` with bindings `AI` and `JOBS`.
   - It calls `env.AI.run`, with about a 15-minute wall limit per job.
   - It mirrors the outputs to `media:<id>:<n>` in 20 MB chunks with a 21-day TTL, and writes `res:<id>`.
3. `gen.py status|collect|wait` reads them back.
   - Latency is about **5 to 5.5 minutes from submit to file** for a 5 s clip.
   - A job still `state:running` after 30 minutes hit the wall limit: resubmit it.
   - `requeue` is only for stale jobs, where the cron minute was missed.
4. **Standing rule: never deploy, modify or delete Workers or KV namespaces.**
   - Use a unique prefix. Past prefixes: `moongazing/`, `rewind/`, `rewind2/`. Vibesong should use, say, `vibesong/`.
   - The prefix is hard-coded as `PREFIX` in `gen.py`.
5. `minimax/h3` returns the raw provider task (`result.task.content.url` on the MiniMax CDN), which the relay does not mirror.
   - Collect it fast, because the URL expires.
   - H3 clips carry an AAC track: strip it with `-an`.

### Client code to copy
The most current and portable set is **`/home/jade/Documents/rewind-take-two/tools/gen/`**, adapted from MG and MGP:

| File | What it does |
|---|---|
| `cfauth.py` | Account id, KV namespace and token, read at call time from env vars or local files |
| `cf.py` | Sync images, TTS, music and ASR. Validates inputs against `docs/gen_catalog/*.json` with jsonschema, estimates cost, enforces the cap, logs to `media/genlog.jsonl`. Refuses video unless `--allow-video`. |
| `gen.py` | The async relay queue: `spec`, `submit`, `status`, `collect`, `wait`, `requeue`, `ref-image`, `audio-ref`. Fills Seedance's required defaults. Builds `content[]` for h3. |
| `vgen.py` | Per-shot takes: `media/gen/<SHOT>/take_N.{spec.json,json,mp4}` plus a 6-frame `take_N_sheet.jpg`. Hard cap; spend log `media/gen/spend.jsonl`. |
| `shots.py` | The shot-spec dict |
| `spend.py` | Running total; `--tags` gives a per-tag breakdown |
| `catalog.py` | Refreshes the catalog and runs a free live probe |

- Model catalog with schemas and list prices: `rewind-take-two/docs/gen_catalog/`, also in `1-music-shipped/moongazing-public-version/docs/gen_catalog/`.
  - `INDEX.tsv`; `LIVE.tsv` is a probe from 2026-10-07.
- **To use it:** copy `tools/gen/` and `docs/gen_catalog/`, set `PREFIX`, put the id files in `work/` (gitignored), and set `FFMPEG=` to a working binary from §1. Run it with the MG venv python, which has jsonschema and PyAV.
- Any `"file:<path>"` string in an input becomes a data URI.
- Commands:
  - `$PY tools/gen/cf.py MODEL OUT '<json>' --tag=x [--dry-run]`
  - `$PY tools/gen/vgen.py submit NAME --res=480p --dry-run`, then run it again without `--dry-run`
  - `$PY tools/gen/vgen.py wait NAME`
  - `$PY tools/gen/gen.py audio-ref SRC START DUR OUT.mp3`
- How-to doc: `rewind-take-two/docs/TOOLS.md`. Fullest ops doc: `1-music-shipped/moongazing/docs/GEN_OPS.md`.

### Models and their verified inputs (catalog 2026-10-06; list prices)

| Model | Use | Key inputs and limits | Price |
|---|---|---|---|
| `bytedance/seedance-2.5` | **The only model used for singing and lip-sync**; also OS and RE plates | prompt ≤2000 chars; `image` (first frame); `last_frame_image`; `reference_images` ≤30 (aspect 0.39–2.5); `reference_videos` ≤10; `reference_audios` ≤10 (≤30 s total); 4–30 s; 480p/720p; 24 fps. `additionalProperties:false`, so `gen.py` fills `fps, camera_fixed, watermark, output_format, use_virtual_avatar`. With `image`, set `aspect_ratio:"adaptive"`. | $0.1028/s at 480p, $0.2312/s at 720p (×4 with video refs) |
| `bytedance/seedance-2.0` (`-fast`, `-mini`) | Keyframe-locked motion (RW2) | `image`, `last_frame_image`, ref images 1–4, `reference_video`; 4–12 s; up to 4K | $0.07, $0.15, $0.37 per s at 480p, 720p, 1080p |
| `minimax/h3` / `h3-max` | Keyframe-locked motion; the MG workhorse | `content[]` (text, first_frame, last_frame, reference_image, video_url, audio_url); 4–15 s; 768P/2K | $0.08/s at 768P, $0.13/s at 2K |
| `minimax/hailuo-2.3(-fast)` | Never used | 6 or 10 s, 768P/1080P | $0.28 for 6 s at 768P |
| `google/veo-3.1(-fast)`, `runwayml/gen-4.5`, `alibaba/wan-3.0`, `vidu/q3-pro`, `pixverse/v6`, `lightricks/ltx-2-5-fast` | Available but never used | | |
| `pruna/p-video-avatar` | Image plus audio lip-sync. MG tried it for the mouth layer (sync within a frame) but did not use it in the end. | | $0.025/s |
| `xai/grok-imagine-video*` | **Unusable**: the ZDR account requires `output.upload_url` | | |
| Kling, "Hailuo 3", ElevenLabs SFX | **Do not exist** (error 7003, model not found) | | |
| `google/nano-banana-pro` | House model for painted styles (ink, pencil, gold), edits and "paint the place round her" | `image_input` **≤3**; `aspect_ratio` 16:9 or 21:9; `image_size` 1K/2K/4K (2K = 2752×1536); sync, 17–29 s | ~$0.134 (4K $0.24) |
| `google/nano-banana-2` (`-lite`) | Research references with `google_search` / `image_search` grounding (OS) | `resolution` | ½ or ¼ of pro |
| `openai/gpt-image-2.5-sunburst` (best), `-flare` (fast), `gpt-image-2` | Character sheets, layouts, anime first frames | `size` ≤1536x1024 (**no 16:9**: crop it), `quality`, `images` ≤16 | ~$0.19 at high; gpt-image-2 ~$0.06 at medium |
| `xai/grok-imagine-image-2.0` (`-quality`, base) | Cheap layout thumbnails | **`response_format:"b64_json"` required**; ≤5 images; `resolution` 2k | $0.04 / $0.05 / $0.02 |
| `bytedance/seedream-5-pro` (`-lite`) | Barely used | `size:"2560x1440"`, `image` ≤10 | ~$0.045 |
| `black-forest-labs/flux-2-max`, `krea-2-*`, `recraftv4*`, `qwen-image-3.0-pro` | Only the RE bake-off | | |
| `elevenlabs/eleven-v3` (also `multilingual-v2`, `turbo`/`flash-v2-5`) | Voice lines | `{text, voice_id, output_format:"mp3_44100_128", voice_settings, seed}`; audio tags like `[whispering]` | $0.0001/char |
| `elevenlabs/music-v2` | Also the **SFX substitute** | `prompt`, `music_length_ms` (3 s to 10 min), `force_instrumental` | $0.0025/s |
| ASR | Transcription | `@cf/openai/whisper-large-v3-turbo` (word stamps; hallucinates on vocal chops); `xai/grok-stt` (cleanest, $0.0017/min); `assemblyai/universal-3.5-pro` (ms timings); `openai/gpt-4o-transcribe` | |
| `google/gemini-3.8-flash` | Outside reviewer: watched a 540p cut with audio and scored it (RE `docs/reviews/gemini_preview3.md`; RW2 `docs/reviews/roughcut_v1.md`) | `contents[]` with inline video | |

**ElevenLabs usage:**
- RE: `pipeline/sound_design.py` uses the ElevenLabs v3 radio voice ("Still listening.", "Still here."), `music-v2` for static textures, and Whisper to check that each processed voice reads back verbatim. Premade voice ids are in that file.
- RW2: "Anomaly detected." and a whispered "Never stop", with sound effects from `music-v2`.
- **There is no `xi-api-key` anywhere.** Use only the catalog route.

**Spend references:**

| Project | Spend |
|---|---|
| RE | ~$147 total (~$142 Seedance, 103 runs, 478 s of 720p) |
| RW1 | ~$135 on Seedance plus ~$15 on images |
| MGP | Phase cap $200, ~$174 used |
| RW2 | Cap $400; ~$156 at v2, ~$253 at v5 |

Always log spend, tag calls, and ask Jade before passing a stated budget. Figures are list-price estimates, because the token cannot read the bill. Errored runs usually are not billed.

---
## 3. Project-by-project

### 3.1 Orbital Sunrise: `~/Documents/1-music-shipped/orbital-sunrise-video`

**Concept.** Leonov's 1965 spacewalk, and the first artwork made in space: a colored-pencil sunrise. The film is
"a drawing that survives":
- Space is black paper and Earth is white paper.
- Two hands draw: Leonov's in 1965 and the singer's now.

Docs: `docs/TREATMENT.md`, `docs/STYLE_BIBLE.md`, `docs/SHOTLIST.md` (mapped to the beat grid), `docs/HANDOFF_JADE.md` and
`docs/TAKES.md` (every take's recipe, with lessons), `docs/ALTERNATE_CUT.md` (retiming to a new mix, environment rebuild),
`docs/FACTS.md` and `FACTCHECK.md`.

**Final deliverable:** the 4:12 extended cut (252.28 s, 6055 frames).
- Published as 4K on YouTube and 1080p on X.
- Repo copies:
  - `release/extended/Orbital_Sunrise_extended_1080p.mp4`: HEVC Main, 1920×1080, 24 fps, ~2.8 Mb/s, AAC 48k at 192k, 94 MB.
  - A 720p H.264 copy.
- Master: `video/out/masters/*_4K_master.mp4`, H.264 High 3840×2160 at 24 fps, CRF 12 slow, `-tune grain`, BT.709, Lanczos upscale from lossless 1080p PNGs, 4.6 GB.
- Upload copies (`tools/encode_uploads.py youtube|x`): two-pass x264.
  - YouTube: 4K at 45 Mb/s.
  - X: 1080p at 12 Mb/s, High@4.1, maxrate 16M. A 4K/35 Mb/s upload to X failed.

**What made it good:**
- A strict style bible:
  - **Two papers**: Night `#0d0c10`, Snow `#f3efe6`.
  - **An 11-colour fixed "pencil box"**.
  - Four-layer etching hatch with tone thresholds .13/.36/.58/.78.
  - Contours with 5–15 % overshoot that "boil".
  - **Drawn on twos**: 12 drawings/s by default, threes for awe, ones for panic.
- Cuts land on beats.
- Real facts on screen.
- One clear concept carried end to end.

**Pipeline:**
1. **Song analysis:**
   - Stems: Kim_Vocal_2 MDX-Net.
   - Word times: Whisper on the vocal stem, snapped to onsets.
   - Beat grid at 162.33 BPM; sections set by hand.
   - Output: `video/data/timing.json`.
   - The original script was lost with its container. `tools/timing_edit.py` (`export`, `check`, `shift`, `line`, `align`, `clicks`) edits the file.
   - `tools/retime.py map|timing` builds an old→new mix map. New word times came from sherpa-onnx Parakeet TDT on the stem, snapped to onsets; good to about 0.1 s on singing.
2. **Research images:** `google/nano-banana-2` with `google_search` and `image_search` grounding.
3. **Style frames and character/set sheets:** `google/nano-banana-pro`, 16:9, `image_size` 2K, PNG.
4. **Performance plates:** `bytedance/seedance-2.5`, 720p, 16:9, 5–12 s, `use_virtual_avatar:true`.
   - Specs in `tools/plate_specs.py`; runner `tools/plates.py`.
   - The genlog (`media/genlog.jsonl`) has 395 nano-banana-pro calls, 146 Seedance takes and 6 nano-banana-2 calls.
5. **Plate analysis:** these are reference only, never shown.
   - `tools/plate_meta.py`: tone, colour, structure-tensor flow, thinned edges, MediaPipe face landmarks.
   - `tools/plate_masks.py`: rembg isnet mattes, about 90 minutes on 4 cores.
6. **Renderer:** `video/src/*.js`, a Canvas pencil engine.
   - `renderAt(t)` is a pure function of song time.
   - `video/render.mjs` drives `studio.html` in headless Chromium through puppeteer-core 24.
7. **Ending audio:**
   - `tools/extend_ending.py`: the last chord rings out on a spectral freeze.
   - `tools/ritardando.py` plus `tools/timemap.py`: a rubberband outro slowdown, with picture time mapped through `video/data/timemap.json`.

**Lyric typography (canvas, in the renderer):**

| Face | Use |
|---|---|
| **Anton** | Impact lyrics, all caps, leading 0.86, one word per beat on hooks |
| Oswald 700 | Red Cyrillic echoes |
| **Instrument Serif Italic** | The singer's own lines |
| JetBrains Mono | Telemetry |
| Hand-drawn single-stroke pencil | "Art is a landing in the snow" |

- Sizes: big (18 % or more of frame height) on hooks, medium in the build, a serif lower third in the breakdown.
- Big words get a **"quiet clearing"**: the drawing thins in a soft knockout behind them.

**Useful scripts** (run from the repo root, in the OS venv for face work):

| Command | What it does |
|---|---|
| `tools/cfai.py` | Old proxy-mode client. Sends no auth, so it won't work locally as-is. Reuse `gen(model, inp, out, tag)` and the genlog pattern. |
| `python3 tools/plates.py [id] / --list` | Parallel Seedance takes, `PLATE_PAR=6`. Writes `take<N>.mp4` and an 8-frame `sheet.jpg`. Privacy-filter retry: reshuffle refs, then drop face close-up sheets. |
| `python3 tools/jade_sing.py <first.jpg> <out.mp4> [--loc] [--scene=dusk\|studio]` | Seedance from her kept drawing, with her vocal as the audio ref. Its PROMPT is the canonical likeness-preserving singing prompt. |
| `tools/jade_location.py` | Nano Banana paints the scene around her drawing. `restore_face()` and `restore_lines(..., skip_cheeks=True)` put her own lines back. |
| `tools/jade_keep.py` | Lays the drawing on the paper by multiply; `video_on_paper()` does the same for clips. |
| `jade_relight.py`, `jade_head_lock.py` | `eyes()`: MediaPipe eye centres for head-scale checks |
| `tools/lipsync.py id:start` | Mouth curve vs vocal RMS, giving the best lag |
| `tools/mouth_track.py` | Mouth openness from vocal loudness: −44…−16 dB maps to 0…1, a 40 ms lead, shut on b/m/p. **It ignores its arguments and overwrites OS `video/data/mouth.json`. Do not run it in place.** |
| `tools/vocal_stem.py [SONG] --out=DIR` | Kim_Vocal_2 in numpy plus onnxruntime, about 1–2× real time on CPU. The model path is hard-coded to `/tmp/work/models`, so repoint it. |
| `compare_mix.py OLD NEW` | Aligns two mixes |
| `tools/encode_release.sh`, `encode_youtube.sh`, `encode_uploads.py`, `package_hls.sh` | Release encodes and HLS packaging |

Renderer commands:
- `cd video && node render.mjs --list | --sheet=23,24 --cols=3 | --frames=0:252.28 --workers=4 | --encode`.
- The `--frames` render is resumable. Set `CHROME=`.

**Lessons (Jade's likeness; the main pain point):**
- Every generated version of Jade was "weird", "demented", "misshapen" or "someone else". **Image models pull her face toward an
  average, unattractive face and add makeup cues** (liner, lined lips, contour). Her quality bar is her Google Photos pencil portrait
  `media/chars/jade_src/photos/jade_photo_4_pencil_full.jpg`. **If a render can't match that bar, take her out of the video.**
- Failed attempts, in order:
  1. Seedance from generated sheets.
  2. Seedance from her real photos.
  3. A real face composited onto generated bodies ("demented", lopsided).
  4. The film's hatching renderer on her face (reads as texture and age).
  5. Nano Banana drawings "in the style of" her (prettier, but not her).
  6. Scene edits of the trace (the model normalised her head).
  7. Head paste-backs ("monsters").
  8. A cut-out of her over backgrounds ("postcard").
  9. Whole-scene redraws (wrong angle and scale).
  10. Photo edits.
- **What worked: Nano Banana *tracing* her photo with nothing changed.** The prompt said no makeup, no beautifying, and keep the two brows' difference.
  - Base: `media/chars/jade_src/jade_trace_base.jpg`.
  - Keepers with jacket and headphones: `jade_trace_jacket_hp_{1,2}.jpg`.
  - Then: a centred chest-up first frame, the scene painted around it, her own lines restored, Seedance 2.5 animating with the vocal, and the pencil engine laid over at 45 %.
- **Seedance rules:**
  - Use a centred, chest-up first frame.
  - Prompt "static locked-off camera, never a face close-up" and spell out the forehead and hairline.
  - An off-centre first frame or a landscape request makes it redraw her smaller-headed. A portrait first frame gives portrait output (834×1112).
  - **`generate_audio:false`**, because Seedance flags her own song as copyrighted.
  - `use_virtual_avatar:true` beat no-avatar every time.
  - Its privacy filter ("PrivacyInformation") is probabilistic: reshuffle the refs.
- **Image models shrink and average her head whenever they re-pose her.** Keep her arms down in the still and let the video model move them.
- Check head scale numerically with MediaPipe: eye distance and face-oval size against the approved drawing.
- **Lip lag varies per take (0.2–1.5 s).** Render 5 options 0.2 s apart and let her pick by ear. Formula: `take time = song time − (clip start + lag)`.
- **To keep an approved take's motion but change wardrobe:** pass the take as `reference_videos` (a public URL) and a crop as `reference_images`, with "take only the motion".
- Seedance sync was close but not frame-exact. OS redrew the lips from the vocal track (`mouth_track.py`) at the plate's lip landmarks.
- **Her face facts (never "correct" these):**
  - Unusually large head; high forehead.
  - Wide heart-shaped ("melon seed") face with a tapering chin.
  - Two slightly different eyebrows.
  - Glasses; no makeup; never add age, lines or texture.
  - Hair: centre-parted, symmetrical half-up, wispy face-framing pieces.
  - White cropped flight jacket with an orange band, black top, pale dusty-pink over-ear headphones (on her head **or** round her neck, never both).
  - Medium framing only.
  - She is from **Austin, not SF**.
  - Light must be consistent.
- **Process:** she reviews on her phone. Put new items at the top. Show small results early.
- **Encoding:** fine hatching that changes 12 times a second is hard to compress, hence the two-pass encodes.

### 3.2 Rare Earth (techno remix): `~/Documents/1-music-shipped/rare-earth-techno-remix`

**Concept.** Two lonely worlds, Earth and the fictional **Echo**, sing into the dark. The song itself is the signal.

**Style "SIGNAL PRINT":** risograph anime in a few spot inks, with three modes:
- *print*: halftone ink on paper
- *light*: neon linework on black, with bloom
- *data*: 1-bit dither

**Character:** Jade appears as the anime heroine **DOT**: white jacket with RARE EARTH lettering, a 1420 MHz sleeve patch, v3 hair (centre part, curtain bangs).

**Docs:** `README.md`, `docs/TREATMENT.md`, `docs/PROCESS.md` (detailed, 569 lines), `CLAUDE.md` (the lip-fix workflow).

**Deliverable:** `out/rare_earth_1080p.mp4`, H.264 High, 1920×1080, 24 fps, 129.58 s, ~5.5 Mb/s two-pass to fit under 100 MB, AAC 44.1k at 192k.
- `out/thumbnail_4k.jpg`; `out/rare_earth.en.srt` and `.vtt`.
- Plus DDR and Beat Saber chart packs (`ddr/`, `beatsaber/`).

**Pipeline:**
1. **Stems:** `audio-separator` with Kim_Vocal_2. Demucs weights were blocked then; BS-Roformer was too slow on CPU.
2. **Lyrics:** `pipeline/lyrics_align.py`.
   - Whisper large-v3-turbo on Workers AI transcribes the vocal stem.
   - difflib aligns it to the canonical `LINES`.
   - Each word snaps to the nearest vocal onset; starts are monotonic and at least 70 ms apart; some are pinned by hand.
3. **Beat grid:** `pipeline/audio_map.py`. The tempo accelerates from 129.7 to 135 BPM.
   - A **degree-4 polynomial fit of librosa-tracked beats on the instrumental** (refit after rejecting points more than 30 ms off).
   - Kick and snare band onsets, plus 24 fps energy, go to `render/data/audio.json`, which drives every pulse.
4. **Design:**
   - Image bake-off: GPT Image 2.5 (best for the canonical character sheet), Nano Banana Pro (the flat style board), Seedream 5 Pro, FLUX.2 max, Grok Imagine 2.0.
   - The Nano Banana edit ignored the instruction and kept the old haircut.
5. **Performances:** 23 shots, multiple takes each, on Seedance 2.5 at 720p/24, through `pipeline/seedance_shots.py` and `run_seedance.py submit|collect|status [--cron]`.
   - Inputs: the character sheet as `reference_images` (cropped to 16:9: references wider than 2.5:1 are rejected) and the **cut song slice as `reference_audios`**.
   - `generate_audio:false`; `use_virtual_avatar:false` for anime.
   - The manifest is file-locked, after parallel collectors raced and dropped takes.
6. **Lip sync** (`pipeline/sync/`):
   - Lag is measured only over the window the edit uses (`clipTime = t − start + lag`).
   - Two metrics: an anime LBP face cascade with mouth ellipse, and a skin-blob mouth colour count.
   - A take is trusted when both curves peak together.
   - Then a per-drawing exposure sheet `lipsheet.json` (`hard`/`small`/`round`/`hold` flags).
   - `relip.py` borrows correct mouths from other frames (ECC registration, Poisson clone, LivePortrait ONNX fallback).
   - 90 of 355 drawings were fixed.
7. **Plate fixes** (`pipeline/plate_fixes/`): lettering the takes invented ("PACE EARTH") is painted out, and the sheet's lettering is tracked in.
8. **Roto guides** (`roto_extract.py`):
   - XDoG lines (R), bilateral tone (G), a green-screen matte (B), and colour classes.
   - The footage itself is never shown.
9. **Renderer:** `render/` uses three.js r186 and Canvas 2D under headless Chromium with SwiftShader (no GPU).
   - `node tools/render.mjs --from 0 --to 129.6 --fps 24 --w 1920 --h 1080 --jobs 3 --audio … --out …`, with `--resume` and `--framedir`.
   - One browser per job, about 1 s per 1080p frame.
10. **Encode:** `render/tools/encode_release.sh FRAMEDIR AUDIO OUT [KBPS]`, two-pass x264 High. If AUDIO is .m4a it is copied, not re-encoded.

**Typography** (`render/src/type.js`):
- `TypeLayer.line`: the whole line stays on screen and each word lights as it is sung.
- Lines auto-fit.
- **Lyrics are kept off faces**, in the calm third.
- Fonts: Archivo VF, Anton, Noto Serif Display, Unbounded, Space Mono, JetBrains Mono, Big Shoulders, Instrument Serif, VT323, and a Noto Sans SC subset.
- An alien glyph script.

**Lessons:**
- Review passes on 540p contact sheets (every 0.5 s) caught a lot:
  - dishes reading as mushrooms
  - a black first frame
  - NaN black blobs
  - lyrics sitting on faces in 8 shots
  - type overflow
- Two coordinate conventions (y-down canvas, y-up shaders) caused flipped bugs.
- Seed grain once per shot, not per frame: per-frame grain cost 16 % more bits.
- An earlier prior-art critique scored RE 5/10 for lyric legibility and 4/10 for lip sync.
- Whole-clip lip-sync scores mislead, because Seedance idles before and after the phrase.
- Hosts blocked in the old sandbox: Hugging Face, `*.workers.dev`, pytorch.org. That is why the code works around them.

### 3.3 Moongazing (望明月): public `~/Documents/1-music-shipped/moongazing-public-version`, family cut `~/Documents/1-music-shipped/moongazing`

**Concept.** "Chinese landscape painting already knows what Earth and the Moon look like." **Colour = home.**
- Earth is 青绿 mineral blue-green on silk; the Moon is monochrome ink; Earth is the only colour on the Moon.
- Three papers: **silk** (Earth and memory), **xuan/ink** (the Moon), **indigo and gold** (night, launch, the drop).
- Rockets and the base are drawn as **界画 jiehua**, ruled-line architecture.
- An astronaut (Claire Shen) spends 13 months at a south-pole base; families look up.
- The public cut recasts the family as fictional. Its README is a fact-sourced tour of real lunar technology.
- The Chinese lines are Li Bai; the arrangement was "realized with Suno".

**Credits line from the film:** keyframes by GPT Image and Nano Banana Pro, motion from Seedance and MiniMax, drawn by JavaScript.

**Deliverables:**
- MGP v10: `review/moongazing_public_v10_1080p.mp4`, H.264 High 1920×1080, 24 fps, 215.21 s, ~17 Mb/s, AAC 48k at 320k, 468 MB.
- MGP under-100 MB copy (`_100mb.mp4`): two-pass x264 at 3250k with audio copied.
- MG family 1080p: `render/out/release_1080/Moongazing_1080p.mp4`, plus a soft-subtitle version and an MKV master.
- MG lyric and karaoke videos: `render/out/lyric_video/`, built by `release/lyric_video/*.py`.

**Pipeline and tools:**
- **Gen:** `tools/cf.py` (sync) and `tools/gen.py` (the cron relay queue). These originated the current stack in §2. `docs/GEN_OPS.md` is the reference.
- **`tools/vgen.py`** keeps per-shot takes, with standard prompt blocks:
  - `NO_TEXT`, `KEEP_STYLE`, `LIKENESS`, `SING`, `NO_SPEECH`: reusable prompt strings.
  - **`tools/ffcheck.py`** measures first-frame fidelity: the Pearson r of 96×54 grey thumbnails of keyframe vs frame 0. Below 0.85 means the model reframed.
- **Motion:** mostly `minimax/h3` (keyframe-locked) at 768P. Seedance 2.5 only for singing. 37+ takes were roto-prepped (`picks.json`).
- **Timing** (`analysis/work/`, MG venv on GPU):
  - `beats_bt.py`: **beat_this** (`File2Beats(checkpoint_path="final0", device="cuda")`), the best beat tracker so far.
  - `align_st.py`: stable-ts `align` with Whisper large-v3, per hand-set passage window, with `en`/`zh` language per chunk.
  - `align_mms.py`: torchaudio **MMS_FA forced alignment, with pypinyin romanising Chinese characters**. **Relevant to vibesong's 一笔一画 lyrics.**
  - `final_grid.py`, `build_lyrics.py`: final grid and lyrics; sections and bars set by hand.
  - Outputs: `analysis/beatgrid.json`, `lyrics_timing.json`.
  - A retime to the new key goes through `analysis/v2/time_map.json`; notes in `analysis/v2/NOTES.md`.
  - "First consonants often precede CTC vowels by 0.2–0.3 s": check two aligners plus stem energy.
- **Renderer** (`render/`): WebGL2 plus Canvas, deterministic `window.renderAt(t)`, seeded noise only, headless Chrome with SwiftShader.
  - `node tools/lint_shots.mjs`, `take_len_check.mjs`, `render.mjs --frames A-B --workers ≤6 --framedir out/X`, `--encode`, `shot_table.mjs`.
  - **`tools/render_verified.sh`** renders twice and compares, because renders under load silently save wrong frames. A verified 1080p pass takes 42 minutes.
  - `flicker_check.py`, `type_reveal_check.mjs`.
- **Typography** (`render/src/type.js`):
  - **InkText**: Chinese calligraphy revealed by an animated dry-brush mask.
    - Columns run right to left, top to bottom within each, with bristle streaks and ink bleed and granulation into the paper.
    - Fonts: MaShanZheng, ZhiMangXing, LiuJianMaoCao, Noto Serif SC.
  - English **Card** type: Cormorant Garamond, letter-spaced, with eased per-word fades and faint bleed.
  - HUD: IBM Plex Mono.
  - **Seals** are procedural (`seal.js`). Never let a model draw seals or glyphs.
- **Singer (MGP `work/singer4/`; run with the OS MediaPipe venv from `work/engine/`):**
  - `base.py` and `restore.py` (restore 40 % of the face, 85 % of the lips).
  - `shots.py`, then `tools/vgen_pub.py`.
  - `look.py` (lag sheets).
  - **`deshadow.py still IN OUT --tint=1.8`**, or `take SHOT take_N take_M --tint=1.8`.
    - It removes the overhead glasses shadow on her cheeks and restores warm skin. K=1.8 is Jade's pick.
    - It is required, and makes no paid call.
  - `page_media.sh` builds side-by-side lip-timing composites.
  - Round 10 swapped in a **watercolour** singer (`inputs/jade_watercolor_jacket_v6.png`). Jade: "all 3 water color are better".
- **Privacy guard:** `work/engine/tools/pubguard.py`; banned terms in `work/private_terms.txt`.

**Model verdicts (MG `docs/style_guide.md`):**
- **nano-banana-pro:** the house model for ink, indigo-gold and jiehua, and the best editor.
  - It has real brush behaviour and does parallel-oblique projection.
  - **It invents glyphs in seals and signs.** It paints Earth as a NASA photo unless told otherwise. It ignores size instructions in edits.
- **gpt-image-2.5-sunburst:** best for silk and 青绿 and for layout and sheets. It is the only model that honoured "blank seal" (3/3).
  - It turns ink or lunar prompts photographic. Its edit mode is too conservative and leaves ghosts.
  - Maximum 1536×1024.
- **grok-imagine-image-2.0:** **not for hero frames.**
  - It is kitsch: glowing halo Earth, poster astronaut.
  - It adds white "typography blocks" and invents glyphs.
  - At $0.04–0.05, it is fine for throwaway layouts.
- **Do not use "cinematic", "epic" or "anamorphic" language.** Get scale from 留白 negative space and a tiny figure.
- **Image models return the old picture when it is among the inputs.**

**Lessons:**
- Prompting her face:
  - **"forehead smooth, brows relaxed, head at the first frame's angle"**.
  - Asking for knitted brows or a look up at the Moon gave frown lines and a redrawn face.
  - A heavy roto style breaks her glasses into dashes, so use a light style (`OS_STYLE` snap .15, shade .1, gran .08, lineA .3).
- **A pick older than its keyframe is silently ignored** by `assets.js`. After replacing a first frame, `touch` the roto folder.
- After changing a keyframe, grep every use of its key, because bleeds (`silkBleed`) reuse it in other shots.
- Moving painted detail baked into a still smears in the flow-stabilised redraw. Keep moving detail out of takes, and draw parallax live (`teawindow.js`).
- Jade's rulings:
  - Fix motion glitches with a new video take or Three.js, never with hand patches.
  - No still images of living things: every person moves a little.
  - One focal point per shot.
  - She appears only on the sung lines that matter.
- **Do not let Codex edit `render/src` while Claude is editing it.** Codex's comment scrub rebuilt files from a snapshot and silently undid four edits mid-render.
- Do not queue video from a repaint before Codex's DONE line.
- `pkill -f` or `pgrep -f` with a pattern that appears in your own command line kills your own shell. Use `[x]yz`.
- Read the decision page's store before every render: answers were once missed.

### 3.4 Rewind take two: `~/Documents/rewind-take-two` (and RW1 at `~/Documents/1-archive/rewind-music-video`)

**Two deliverables live here.**

**(a) Acoustic lyric and karaoke video:**
- `deliverables/Rewind_take_two_lyric_video.mp4`: 1920×1080, **30 fps**, H.264 High (`-tune stillimage -crf 18`, preset medium), AAC 320k at 48 kHz, 216.77 s.
- Background: RW1's "committee of Jades" still, `assets/lyric-background.png`, with a dark lower gradient.
- **Typography is ASS karaoke burned with `-vf ass=`:**
  - Per-word `\kf` sweeps; DejaVu Sans Bold 62 for the lyric, lavender highlight.
  - A gold 32 pt "Next" line preview; a dark outline.
  - Lyric `\pos(960,934)`.
- Files: `deliverables/Rewind_take_two_lyrics.ass` and `.srt`, `export_details.json`.
- **Commands:**
  - `python tools/lyric_video.py design|render|verify`.
  - Timing comes from `tools/align_lyrics.py`: stable-ts `align`, faster-whisper-large-v3 on CPU int8, per passage window, against the Kim_Vocal_2 vocal stem. Output `analysis/lyric-video/timing.json`, plus `timing_adjustments.json` and a `vocal_timing_review.png`.
  - **Gotcha:** `align_lyrics.py` adds `~/.cache/uv/archive-v0/*` to `sys.path` to borrow torch and stable_whisper. Use the MG venv instead.
- **Karaoke** (`tools/karaoke_backing.py separate|mix|export`, `karaoke_vr_check.py`):
  - Kim_Vocal_2, then UVR_MDXNET_KARA_2, with `6_HP-Karaoke-UVR` for the last verse.
  - The lead estimate is subtracted only during lyric lines, with short fades. Everything else is bit-identical to the source.

**(b) Cinematic edition** (v8 is final, 2026-10-14):
- **Concept:** a grad student who rewinds time is hunted by "TIME VARIANCE █████████" (never "Authority", "TVA" or Marvel terms) for the colour residue she leaves.
  - The world is an Escher-style engraved Chicago; Jade is the only thing in colour.
  - She pulls the pencil from her bun and redraws the world.
  - A game genre changes at each musical genre change: cutscene, game over, pause menu, Braid rewind, Celeste platformer, bullet-hell, co-op ghosts, Monument Valley, boss fight, trailer cards.
  - Docs: `docs/treatment.md`, `docs/shotlist.md` (bar-locked), `docs/director_brief.md`, `docs/sections/*.md`, `docs/revisions/*`, `docs/MORNING.md`.
- **Deliverables:**
  - `deliverables/rewind_v8_master_1080p_sfx.mp4`: H.264 High 1920×1080, **24 fps**, x264 CRF 16, slow preset, AAC 320k/48k, 244.04 s, 2.05 GB.
  - `rewind_v8_upload_1080p_sfx_100MB.mp4`: two-pass x264 slow at ~2980k, AAC 192k, `+faststart`, 96.6 MB.
  - Jade: no 720p copy needed.
  - The SFX mix leaves the original track bit-identical, with cues only in the gaps, at −15.8 LUFS.
- **Audio map:** `docs/recon/audio_map.md` and `analysis/cinematic/timing.json` (beats, bars, sections, 133 words, events).
  - Beat tracking by beat_this (±10 ms), and the grid wanders ±0.2 s because of Suno drift, so **cut on the listed beat times, not on a computed BPM grid**.
  - Stems by BS-Roformer; words by MMS plus Whisper ensembles. Scripts are in `analysis/cinematic/work/`: `beats.py`, `align_mms.py`, `final_align.py`, `grid.py`.
- **Pipeline:**
  - Keyframes from the Cloudflare image models.
  - **Seedance 2.0** for keyframe-locked motion.
  - **`tools/engrave/`**: a post-pass that redraws every world frame as a wood engraving while the matte keeps Jade in colour.
    - It fixes Seedance's drift into a grey wash after about 0.5 s.
    - It has its own venv: `uv venv tools/engrave/.venv` with cu124 torch.
  - Then the deterministic engine.
- **Engine:** `render/engine/render.mjs`. three.js r186 on the 3090 through ANGLE/Vulkan; 24 fps; 1-second chunks across N Chrome workers (default 4, maximum 6); resumable.
  - It fuses the RE single-context compositor, the RW1 TimeMap (`T.word('…')`, `T.beat(n)`, `T.section('drop1')`, which throws on a missing word) and OS's chunked workers and studio scrubber.
  - **Commands:**
    - `node render/engine/render.mjs --list | --preview | --range A B --preview --encode | --still t | --sheet 82:95:0.5 | --verify 8 | --audio <mix> --crf 16 --preset slow --out X.mp4`
    - Ranges accept `bar:beat` and `word:` times.
  - Review renders take about 2 minutes at 960×540; a full 1080p render about 7–25 minutes and **about 6.4 GB of frames plus a large cache in `media/engine_cache/`**.
- **Singing:** three times, all at the Bean, by the "Orbital Sunrise method". Jade later chose her **watercolour** reference for these (`inputs/jade_watercolor_jacket_v6.png`).
  - The art-style mismatch with the world is part of the point.
  - Lags are offered as A/B/C variants 0.15 s apart.
- **Lessons:**
  - "One idea per frame". RW1 died of 3–5 stacked HUD and type layers, with Jade as a small inset.
  - 2 fps audit sheets miss one-frame dropouts.
  - Check agent fixes against canon shots yourself.
  - The engine caches images by path: a redrawn plate needs a new filename.
  - Never prune the cache mid-render: it crashed the v8 render.
  - `--range` ignores `--outdir`.
  - Review renders below 1080p; render 1080p only for a signed-off cut.

**RW1** (`1-archive/rewind-music-video`, unfinished draft v10b):
- **Anime Jade worked** ("all look phenomenal").
  - gpt-image-2 single-input edits made the first frames, with the original faces pasted back pixel-exact (`tools/anime/facepaste.py`).
  - Then Seedance 2.5 i2v at 720p.
- **Realistic likeness failed:**
  - Seedance shrinks the iris 7–19 % within a clip.
  - Generators compress the forehead and add age spots.
- **Gate tools** (`tools/likeness/`): `measure.py` (eye size and forehead within ~5 % of `assets/character/v2/measure.json`), `warp.py`, `congruence.py` (head yaw vs torso yaw within 12°).
- **`docs/LIKENESS_RULES.md`:**
  - **Banned face words:** gritty, raw, realistic skin texture, pores, film grain, tired, gaunt, aged, dramatic shadows on face, squinting, wrinkles, freckles, desaturated skin.
  - **Never prompt "raise hairline"**: models make her bald. Prompt "large tall broad forehead, larger upper head" instead.
  - Positive anchor: "same face as reference, same eye shape and size, smooth clear skin, youthful, accurate likeness".
- **Seedance quirks from RW1:**
  - Motion is timid unless the prompt says "extremely fast".
  - Ghost doubles on fast multi-figure motion.
  - It ignores car make and era at night.
  - It invents VFX (neon tubes, red trails) and puts patches on the wrong sleeve.
  - `camera_fixed` has no effect.
  - It sometimes returns 4:3 or portrait.
  - It invented no text in 20 takes.
- The WORLD-resynthesised sung word ("them") sounded distorted. Jade will record fixes herself.

---
## 4. Codex in tmux: conventions

**Division of work (Jade's stated preference, in several memory files):**
- Claude (Opus) does creative and managerial work.
- **Mechanical work goes to Codex across the tmux wall:** encodes, full renders, analysis, page builds, some image edits. Codex has a free built-in image tool that MG used for nine repaints and four vignettes.

**Layout:**
- Claude in pane `<session>:0.0`, Codex in **`<session>:0.1`**.
- Live sessions today:
  - `moongazing`: 0.0 Claude, 0.1 codex, cwd `rewind-take-two`.
  - `public-cut`: 0.0 Claude, 0.1 codex.
  - `rewind-rev` and `rewind-v4`: Claude/Claude pairs (rev-A left, rev-B right).
- RE used `tmux new-session -d -s codex` and told Jade to `tmux attach -t codex`.
- Second jobs: `codex exec -s workspace-write '<prompt>'` in another window. Add `-c sandbox_workspace_write.network_access=true` for network.

**Submitting a prompt (critical quirk):**
- `tmux send-keys -t S:0.1 "<long text>" Enter` does **not** submit: the paste burst swallows the Enter.
- Instead: `tmux load-buffer FILE; tmux paste-buffer -p -t S:0.1`, then a **separate, delayed** `tmux send-keys -t S:0.1 Enter` (sometimes twice).
- Verify with `tmux capture-pane -p -t S:0.1` that it shows "Working (esc to interrupt)".
- Each Codex session starts in its original cwd, so **give absolute paths**.

**File-based handoff (MGP, RW2):**
- Write `work/codex/job_<NAME>.md` (RW2: `docs/revisions/render_vN_final.md`):
  - numbered exact commands, with a check after each step
  - "STOP and append `<NAME>_FAILED step N: …`"
  - no edits to src, media or docs, and no git
  - the disk check and worker limit
  - the env vars to export (`TMPDIR`, `FF`, `PY`)
- Paste only a pointer to the file. Codex appends `<NAME>_DONE …` to `review/codex.log`. RW2 used a report `.md` next to the brief.
- Templates in `1-music-shipped/moongazing-public-version/work/codex/`:
  - `job_render_v10.md`: an excellent template covering copy frames, re-render changed ranges verified, diff/spot checks, encode, the 100 MB copy, check stills and a log line.
  - `wait.sh MARKER`, `wait_prompt.sh`: these exit on DONE, an approval prompt or idle, then print the pane tail.
  - `approve_script.sh NAME MARKER`: auto-approves only an exact `python3 work/codex/NAME.py` whose script has no network, process or delete calls. Everything else is read and approved by hand with `send-keys Enter`.

**Limits and gotchas:**
- **Never launch codex with sandbox-bypass flags.** The auto-mode classifier then blocks Claude's Bash. Use `-s workspace-write`.
- Codex's sandbox hides the GPU and **cannot run the headless renderers** (`listen EPERM 127.0.0.1`). It once deleted a range's frames and then failed.
- So run renders and GPU work from Claude's shell, detached: `setsid nohup … ; echo DONE >> log`. Give Codex the CPU work: encodes, probes, contact sheets, analysis, lyric videos.
- Usage: 13 concurrent subagents burned Jade's window in an hour, and three xhigh codex jobs drained Codex in 25 minutes. Plan for about 6 image-heavy subagents per 5-hour window, 3–4 at a time.
- Concurrent test renders by agents corrupted frames: do final renders after the agents finish.
- One `codex exec` at a time: `flock /tmp/<project>-codex.lock codex exec …`.

---
## 5. Review and process conventions Jade expects
- **Decisions go on an Artifact page.**
  - One card per decision: what changed, a frame, a playable passage, and options saved through ArtifactData collection `decisions` (`capabilities: {db: {}, user: {}}`).
  - Variants go in **one composite video**, so they cannot drift apart.
  - Refer to shots **by timestamp and plain description**, never by shot ID or folder name.
  - **Read the store before every render.**
  - Builders: MGP `work/phase2/build_cut_page_v3.py`, MG `release/review/build_page_r5.sh`.
- She reviews on her phone. Lip timings come as several options side by side, and **she picks by ear**.
- **No commit or push until she asks.** Scan for private terms first. RW2 and MGP are **public** repos: never commit tokens, the account id, the KV id or media.
- Tell her the watch command and what each file is. "Nobody has watched it at speed with sound" was flagged repeatedly: watch final cuts with audio.

---
## 6. Reusable scripts: the short list for vibesong

| Need | Script (current path) | Invoke |
|---|---|---|
| Image and video generation | `~/Documents/rewind-take-two/tools/gen/{cfauth,cf,gen,vgen,shots,spend,catalog}.py` plus `docs/gen_catalog/` | §2. Set `PREFIX`, `FFMPEG`, `CF_ACCOUNT_ID`, `GEN_KV_NS`. |
| First-frame fidelity | `~/Documents/1-music-shipped/moongazing/tools/ffcheck.py` | MG venv; r<0.85 means it reframed |
| Stems | `orbital-sunrise-video/tools/vocal_stem.py`; or `audio-separator` / `demucs` (HTDemucs-ft cached) / BS-Roformer in the MG venv | Repoint the model path to `1-archive/rewind-music-video/analysis/karaoke/models/Kim_Vocal_2.onnx` |
| Beats (best) | `1-music-shipped/moongazing/analysis/work/beats_bt.py` (beat_this, CUDA); RW2 `analysis/cinematic/work/beats.py` | MG venv |
| Drifting-tempo grid | `rare-earth-techno-remix/pipeline/audio_map.py` (degree-4 polyfit, kick/snare, 24 fps energy) | Edit the hard-coded `/tmp/work` and `/home/user` paths |
| Lyric alignment, EN and ZH | MG `analysis/work/align_st.py` (stable-ts) and **`align_mms.py` (MMS_FA plus pypinyin for 汉字)**; RW2 `tools/align_lyrics.py`; RE `pipeline/lyrics_align.py` (Whisper plus difflib plus onset snap) | MG venv (GPU) |
| Timing edit and check by ear | `orbital-sunrise-video/tools/timing_edit.py` (`clicks`: clicks on every word and beat) | Pass `--out`; it writes into OS by default |
| Lip-lag measurement | RE `pipeline/sync/{lag_curve,score,mouth,mouth_color,wordstrip}.py`; OS `tools/lipsync.py`; MGP `work/singer4/look.py` | Adapt the paths |
| Singing likeness pipeline | OS `tools/{jade_sing,jade_location,jade_keep,jade_relight,jade_head_lock}.py`; MGP `work/singer4/{base,restore,shots,look,deshadow}.py` | OS venv (MediaPipe 0.10.14) |
| Anime face paste-back and likeness gate | `1-archive/rewind-music-video/tools/anime/facepaste.py`, `tools/likeness/{measure,warp,congruence}.py` | |
| ASS karaoke lyric video | `rewind-take-two/tools/lyric_video.py`; MG `release/lyric_video/*.py` (Chinese plus pinyin font checks) | ffmpeg `ass=` filter |
| Karaoke lead removal | `rewind-take-two/tools/karaoke_backing.py` | |
| Deterministic renderer to copy | `rewind-take-two/render/engine/` (the newest, GPU three.js) | `node render/engine/render.mjs …` |
| Double-render verify | `1-music-shipped/moongazing/render/tools/render_verified.sh`, `flicker_check.py` | |
| Encodes | RE `render/tools/encode_release.sh`, OS `tools/encode_release.sh` and `encode_uploads.py`, MGP job step 8 | Two-pass x264, audio copied |
| Sound design and VO | RE `pipeline/sound_design.py` (ElevenLabs v3 plus synthesized static, never normalising the song), `subtitles.py` (SRT/VTT) | |
| Codex handoff | `1-music-shipped/moongazing-public-version/work/codex/{job_render_v10.md,wait.sh,wait_prompt.sh,approve_script.sh}` | |

**Rule for running borrowed scripts:**
- Copy them into the vibesong repo and run them there. Many write into their home repo or hard-code `/tmp/work` or `/home/user/...`.
- A `--help` on `mouth_track.py` once overwrote OS data.
- Run them with `PATH=<dir containing an ffmpeg symlink>:$PATH`, because many call bare `ffmpeg`.

---
## 7. Cross-project lessons, condensed (which model for what)
1. **Jade's likeness is the hardest problem and the top quality bar.**
   - Two looks were approved:
     - (a) The **pencil trace of her real photo**, kept whole, with the scene painted around it and her lines restored. Animated by Seedance 2.5, then a light style pass.
     - (b) **Anime Jade** (canon sheet v3), or a **watercolour** Jade (`moongazing-public-version/inputs/jade_watercolor_jacket_v6.png`), which she preferred in MGP and RW2.
   - Photoreal generated Jade has always failed. **Ask Jade which look vibesong uses.** Vibesong's `inputs/jade_anime.png` and `charlie_anime.png` suggest anime.
2. **Seedance 2.5:**
   - It is the only model trusted for lip-sync.
   - `generate_audio:false`.
   - Start the audio slice about 0.3 s before the first sung word, in a gap.
   - Measure lag per take and offer options.
   - It does not hold the first frame: check with `ffcheck`.
   - For locked composition, use **minimax/h3 or Seedance 2.0**. h3 repeats frames 2–3×, so it stutters at non-integer rates.
3. **Images:**

   | Need | Model |
   |---|---|
   | Painted, ink or pencil styles; edits | nano-banana-pro |
   | Sheets, layouts, anime frames, faceless crowds | gpt-image-2/2.5 |
   | Throwaway thumbnails only | grok |
   | Research references | nano-banana-2 with search |

   - **Text, seals and lyrics are always rendered procedurally, never by a model.**
4. **Structure that worked:**
   - A deterministic `renderAt(t)` JS renderer in headless Chrome, with generated footage as rotoscope guide or plate.
   - One timing JSON (beats, words, sections) that every cut and word keys to.
   - Cuts on tracked beats.
   - Review at 540p on contact sheets; 1080p only for a signed-off cut.
5. **Lyric legibility:**
   - Keep words off faces, in the calm third.
   - Use one HUD layer at most.
   - Light each word as it is sung.
   - Check legibility on sheets about 480 px wide (phone).
6. **Deliverables have been 1920×1080 at 24 fps** (lyric videos at 30 fps), H.264 High, yuv420p, AAC 48k.
   - A master at CRF 12–18, slow preset, `-tune grain` for hatching.
   - A GitHub/upload copy under 100 MB: two-pass at 2.9–5.5 Mb/s, audio copied, `+faststart`.
   - OS also made a Lanczos 4K YouTube master.
   - Lengths: 2:09 (RE), 3:35 (MG), 4:04 (RW2), 4:12 (OS).
