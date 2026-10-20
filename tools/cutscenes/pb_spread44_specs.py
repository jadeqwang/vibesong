"""v4.4 outro spread (unit v44_spread): animate the new right-page vignette (rect_g1.png) like the colored-pencil singing cards:
Seedance 2.5, first frame + vocal-stem reference audio (song 186.30 + 9 s), singer-performance prompt (after tools/cutscenes/pb_specs43.py).
    python3 tools/cutscenes/pb_spread44_specs.py TAKE VARIANT RES      VARIANT a (performance) | b (bigger, lip-sync first); RES 480p|720p
clip t = song t - 186.30 + lag."""
import json, sys, os
ROOT = "/home/jade/Documents/vibesong"; W = "media/act5/_work/v44/"; S0 = 186.30; DUR = 9
STYLE = ("A colored-pencil drawing on a cream sketchbook page comes to life, a hand-drawn pencil drawing in every frame: "
         "same pencil lines, paper and hatching as the first frame, never a photo or 3D. ")
WORDS = "Everything I love about life just ... blossoms ... that's it"
LIPS = ("mouth opening on 'Everything', lips pressing together on the 'v' and on the 'm' of 'blossoms', a rounded 'o' on 'love' and "
        "'blossoms', open on 'life', a soft smile on 'that's it'")
PERF_A = ("JADE, the girl in the centre, performs like a real singer in a music video: her chest and shoulders rise and fall with her "
          "breathing, her head moves with the phrasing, small nods on the beat, a tilt to one side on the long notes, the chin lifting a "
          "little on the high note; her shoulders sway gently side to side; her eyebrows lift with feeling, she glances at Charlie and "
          "at Ricky and back toward the viewer, blinking naturally with both eyes together; warm, happy, a little nostalgic. ")
PERF_B = ("JADE, the girl in the centre, sings with her whole upper body like live footage of a singer: shoulders and chest moving, her "
          "body swaying side to side to the rhythm, her head bobbing and tilting freely, turning toward Charlie on one line and toward "
          "Ricky on the next, then back to the viewer; her eyes close briefly on the long note 'blossoms' and open again, both eyes "
          "always together; joyful and warm, never a still body with only a moving mouth. ")
BAND = ("CHARLIE (left) strums his acoustic guitar steadily, fingers changing chords, head nodding in time, smiling. RICKY (right) "
        "picks his electric guitar, hands always moving, head bobbing to the beat. Nobody ever freezes; all stay seated on the "
        "rainbow bench. Eyes natural and sane: both eyes of each person always look the same way, normal blinks, no winks. ")
FACE = "Keep every face exactly as in the first frame; do not restyle anyone. "
BUN = ("Jade's hair stays up in the bun with the two yellow pencils crossing through it in an X, both eraser caps pointing up (one blue, "
       "one pink), moving only with her head. Charlie's beige flat cap stays on. ")
OUTFIT = "Headphones stay round her neck; ONE chest dot and ONE sleeve patch, where they are. "
CAM = "Static camera, no zoom. No captions, no text, no new objects."

def build(take, var="a", res="720p"):
    tag = f"v44_spread_sd25_{res}_{var}{take}"
    if var == "b":
        sing = (f"Lip sync first: Jade sings '{WORDS}' from the reference audio, each syllable on the voice: {LIPS}. ")
    else:
        sing = (f"Jade sings the words of the reference audio, '{WORDS}', lips exactly in time with the voice: {LIPS}. ")
    p = STYLE + sing + (PERF_A if var == "a" else PERF_B) + BAND + FACE + BUN + OUTFIT + CAM
    inp = {"prompt": p, "image": "file:" + W + "ff_g1.jpg", "reference_audios": ["file:" + W + f"voc_{S0:.2f}_{DUR}s.mp3"],
           "duration": DUR, "resolution": res, "aspect_ratio": "16:9", "generate_audio": False, "use_virtual_avatar": True}
    spec = {"model": "bytedance/seedance-2.5", "tag": tag, "notes": f"v4.4 outro spread singer; S0={S0} (clip t = song t - S0 + lag)", "input": inp}
    out = os.path.join(ROOT, "media/gen/specs", tag + ".json"); json.dump(spec, open(out, "w"), indent=1, ensure_ascii=False)
    print(out, len(p))

if __name__ == "__main__":
    build(*sys.argv[1:4])
