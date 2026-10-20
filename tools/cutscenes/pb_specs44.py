"""v4.4 (Jade 10-19, 1:47): card 05 'band on a stage' re-animated with MORE BODY LANGUAGE (singer-prompt pipeline of v4.3, pb_specs43.py).
Seedance 2.5 480p, first frame (still 05 v2) + vocal-stem reference audio from S0 = 106.85 (0.3 s before 世界 107.15), 5 s.
    python tools/cutscenes/pb_specs44.py TAKE VARIANT     VARIANT a (shoulders/head + hand on the mic) | b (open-palm gesture on 舞台) | c (b, lips-first wording)
clip t = song t - S0 + lag."""
import json, sys, os
ROOT = "/home/jade/Documents/vibesong"; W = "media/cutscenes/_work/v44/c05/"
S0 = 106.85
STYLE = ("A colored-pencil drawing on cream paper comes to life, a hand-drawn pencil drawing in every frame: same pencil lines and "
         "paper texture as the first frame, never a photo or 3D. ")
SING = ("The young woman in the centre sings, in Mandarin, the words of the reference audio, 'shi jie, shi wo de wu tai' (the world is my stage), "
        "her lips shaping each syllable exactly in time with the voice: open wide on 'jie' and 'tai', rounding on 'wo' and 'wu'. ")
SING_C = ("Lip sync first: the young woman in the centre sings 'shi jie, shi wo de wu tai' from the reference audio in Mandarin, each syllable on the voice, "
          "mouth open wide on 'jie' and 'tai', lips rounding on 'wo' and 'wu', closing only between phrases. ")
BODY_A = ("She performs it like a proud lead singer in a music video, with real body language: her shoulders rise and roll with the phrasing, "
          "her chest lifts with each breath, her head tilts and nods on the beat and lifts her chin on 'wu tai'; her eyebrows rise with feeling, "
          "her eyes sparkle and glance toward each bandmate and back; one hand comes up into the frame and grips the microphone on its stand. ")
BODY_B = ("She performs it like a proud lead singer in a music video, with big, joyful body language: her shoulders bounce and roll to the beat, "
          "her upper body sways side to side, her head tilts and nods on the beat and her chin lifts on 'wu tai'; her eyebrows rise, her eyes "
          "sparkle and look out over the crowd; on 'wo de wu tai' one hand sweeps up and out to the side, palm open, presenting the stage. ")
BAND = ("The young man in the flat cap on the left strums his acoustic guitar to the rhythm, grinning, bobbing his head and bouncing on his knees; "
        "the young man in the striped shirt on the right plays his electric guitar, nodding his head to the beat and swaying; "
        "both keep their mouths closed. The three warm spotlight cones shimmer softly. Lively, natural motion like live concert footage, never still bodies; "
        "everyone stays in place. ")
FACE = ("The young woman stays the same person as in the first frame: large head, heart-shaped face, soft chin, tall forehead, high "
        "centre-parted hairline, the two slightly different eyebrows, big dark-brown eyes; do not restyle her face. ")
BUN = ("Her hair stays up in the bun with the two yellow pencils crossing through it in an X, both eraser caps pointing up (one blue, one pink); "
       "the pencils move only with her head and never fall. ")
OUTFIT = ("The black-and-orange headphones stay round her neck; the white cropped jacket keeps its horizontal orange bands, ONE small pale-blue chest "
          "dot exactly where it is in the first frame and ONE round 1420 MHz patch on the sleeve band. ")
CAM = "Static camera, same framing, no zoom. No captions, no text, no new objects."

def build(take, var):
    tag = f"v44_05_sd25_{var}{take}"
    p = STYLE + (SING_C if var == "c" else SING) + (BODY_A if var == "a" else BODY_B) + BAND + FACE + BUN + OUTFIT + CAM
    inp = {"prompt": p, "image": "file:media/cutscenes/_work/passB/c05/ff_v2.jpg", "reference_audios": ["file:" + W + f"voc05_{S0:.2f}_5s.mp3"],
           "duration": 5, "resolution": "480p", "aspect_ratio": "16:9", "generate_audio": False, "use_virtual_avatar": True}
    spec = {"model": "bytedance/seedance-2.5", "tag": tag, "notes": f"v4.4 paper card 05 body language; S0={S0} (clip t = song t - S0 + lag)", "input": inp}
    out = os.path.join(ROOT, "media/gen/specs", tag + ".json"); json.dump(spec, open(out, "w"), indent=1, ensure_ascii=False)
    print(out, len(p))

if __name__ == "__main__":
    build(*sys.argv[1:3])
