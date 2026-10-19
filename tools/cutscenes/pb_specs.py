"""Pass B paper cards: write the video gen specs (media/gen/specs/pB_<card>_<model>_t<n>.json) for the lip-sync bake-off.
    python tools/cutscenes/pb_specs.py CARD MODEL TAKE [mix|voc] [v2]   CARD in 03 04 05 06; MODEL in sd25 avatar pvideo veofast veo
M3 (2026-10-18): card 03 S0 = 20.10 and the words start at "because" (the stem's 'be-' onset is 20.13; the old takes sang "my" there);
'v2' = first frame from the forehead-lifted v2 stills (sd25 only).
Card 03 / 06 S0 moved to 20.00 / 143.30 from take 3 on (t1-t2 used 19.85 / 143.10; see each spec notes). First frame = the approved still (06 = the forehead-fixed v2), audio ref = the song mix (Seedance) or the vocal stem (Pruna)
from S0 for 6 s; clip time = song time - S0 + lag. Veo cannot take audio: it is prompted with the words and sings itself."""
import json, sys, os
ROOT = "/home/jade/Documents/vibesong"; W = "media/cutscenes/_work/passB/"
STYLE = ("A colored-pencil drawing on cream paper comes to life, still a hand-drawn pencil drawing in every frame: the same fine "
         "pencil lines, the same paper texture and soft hatching as the first frame, never a photo, never 3D. ")
FACE = ("Through all of it she stays the same person as in the first frame: the same large head, heart-shaped face with a soft chin, "
        "tall forehead with the high centre-parted hairline and full hair volume above it, the two slightly different eyebrows, "
        "the same big dark-brown eyes, natural matte lips. Do not redraw, beautify, slim, age or restyle her face; no makeup. ")
BUN = ("Her hair stays up in the bun with the two yellow pencils crossing through it in an X, both eraser caps up (one blue, one "
       "pink), never falling. ")
DOWN = "Her long black hair stays loose and down. "
OUTFIT = ("The black-and-orange headphones stay round her neck; the white cropped jacket with its horizontal orange bands and the "
          "round 1420 MHz patch stays the same. ")
CAM = "Static locked-off camera, no zoom, no push-in, framing exactly as in the first frame. No captions, no subtitles, no new text, no new objects."
CARDS = {
    "03": dict(s0=20.10, lang="English", words="because my imagination is linked to my everyday life",   # M3: was s0=20.00 / "my imagination ..."
               lips=("she starts singing at once with 'because': lips pressing together on the 'b' of 'be-', opening into a long "
                     "rounded 'cause'; then pressing together on the 'm' of 'my' and the 'm' of 'imagination', opening wide on 'a' and "
                     "'life', a quick 'l' on 'linked'"),
               act=("She sings it with bright wonder, eyes sparkling, a small lift of her chin, a hint of a smile between words. Beside her the "
                    "drawn blue chain of everyday things (coffee mug, notebook, bicycle, laptop, ticket, potted plant, keys) sways gently and "
                    "the little sparkles twinkle. "), hair=BUN),
    "04": dict(s0=48.30, lang="English", words="I just ask myself what it is that I need",
               lips="mouth opening on 'I', a short 'j' on 'just', lips closing on the 'm' of 'myself'",
               act=("She sings it softly, thoughtful, eyes searching slightly up and to the side as if reading a screen; a cool blue screen "
                    "glow lights her face and the small bright rectangle of a prompt window stays reflected in both of her eyes. The "
                    "blueprint grid and the two wireframe cubes behind her stay still. "), hair=BUN),
    "05": dict(s0=106.85, lang="Mandarin", words="shi jie, shi wo de wu tai",
               lips="lips rounding on 'wu', opening wide on 'jie' and 'tai'",
               act=("The young woman in the centre sings it into the microphone below her chin, bright and proud, a small nod on the beat. "
                    "The young man in the flat cap on the left strums his acoustic guitar, the young man in the striped shirt on the right "
                    "plays his electric guitar; both keep their mouths closed. The three warm spotlight cones shimmer softly. "), hair=BUN),
    "06": dict(s0=143.30, lang="English", words="I just ask myself what it is",
               lips="mouth opening on 'I', a short 'j' on 'just', lips closing on the 'm' of 'myself', opening on 'what' and 'is'",
               act=("She sings it to the giant gray rubber-eraser creature on the right, gently, holding the yellow pencil with the blue "
                    "cap and rainbow tip up in her raised hand; the pencil stays the same. The Eraser listens: a slow blink, its mouth "
                    "stays still and slightly open. "), hair=DOWN),
}

def build(card, model, take, audio="mix", ver=""):
    """ver='v2' (M3): first frame = ff_v2.jpg (the forehead-lifted assets/v4_stills/0X_*_v2.png), tag pB_<card>_v2_<model>_t<n>."""
    c = CARDS[card]; d = W + "c" + card + "/"; tag = f"pB_{card}_{ver + '_' if ver else ''}{model}_t{take}"
    ff = "ff_" + ver + ".jpg" if ver else "ff.jpg"
    sing = (f"The young woman sings, in {c['lang']}, the words from the reference audio, '{c['words']}', her lips shaping each "
            f"syllable in time with the voice: {c['lips']}. ")
    face = FACE if card != "05" else FACE.replace("she stays", "the young woman stays")
    if model == "sd25":
        p = STYLE + sing + c["act"] + face + c["hair"] + OUTFIT + CAM
        inp = {"prompt": p, "image": "file:" + d + ff, "reference_audios": ["file:" + d + f"{audio}_{c['s0']:.2f}_6s.mp3"],
               "duration": 6, "resolution": "480p", "aspect_ratio": "16:9", "generate_audio": False, "use_virtual_avatar": True}
        m = "bytedance/seedance-2.5"
    elif model in ("avatar", "pvideo"):
        p = STYLE + sing + c["act"] + face + c["hair"] + CAM
        if model == "avatar":
            inp = {"image": "file:" + d + "ff.jpg", "audio": "file:" + d + f"voc_{c['s0']:.2f}_6s.mp3", "voice": "Kore (Female)",
                   "voice_script": "", "voice_language": "English (US)", "resolution": "1080p", "video_prompt": p,
                   "voice_prompt": "Sing the following.", "negative_prompt": "photo, photorealistic, 3D render, glasses, makeup, text, captions",
                   "strength_negative_prompt": 0.8, "disable_safety_filter": True, "disable_prompt_upsampling": True}
            m = "pruna/p-video-avatar"
        else:
            inp = {"prompt": p, "image": "file:" + d + "ff.jpg", "audio": "file:" + d + f"voc_{c['s0']:.2f}_6s.mp3", "duration": 6,
                   "resolution": "1080p", "fps": 24, "aspect_ratio": "16:9", "draft": False, "save_audio": False,
                   "prompt_upsampling": False, "disable_safety_filter": True}
            m = "pruna/p-video"
    else:  # veo / veofast: sings the words itself (no audio input), we align its mouth to the song afterwards
        p = (STYLE + f"After a short breath she sings, in {c['lang']}, clearly and in a steady pop rhythm at about 140 beats per minute: "
             f"\"{c['words']}\", her lips shaping each syllable: {c['lips']}. " + c["act"] + face + c["hair"] + OUTFIT + CAM +
             " Audio: only her singing voice over a soft beat.")
        inp = {"prompt": p, "image_input": "file:" + d + "ff.jpg", "duration": "6s", "aspect_ratio": "16:9", "resolution": "1080p",
               "generate_audio": True}
        m = "google/veo-3.1-fast" if model == "veofast" else "google/veo-3.1"
    spec = {"model": m, "tag": tag, "notes": f"passB paper card {card}; S0={c['s0']} (clip t = song t - S0 + lag)", "input": inp}
    out = os.path.join(ROOT, "media/gen/specs", tag + ".json"); json.dump(spec, open(out, "w"), indent=1, ensure_ascii=False)
    print(out, len(p))

if __name__ == "__main__":
    build(*sys.argv[1:6])
