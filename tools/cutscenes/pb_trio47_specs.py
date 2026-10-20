"""v4.7 (unit v47_trio; Jade 10-19, 1:47): card 05 'band on a stage' re-animated with stage presence for ALL THREE.
Copy of pb_specs44.py (take a1 = the v4.4 card) with the v47 acting direction (docs/v47_brief.md card 05): a band that has just found its
groove; Jade sings out chin up, one arm reaching out over the crowd; Charlie and Ricky lean toward each other, heads bobbing hard, Ricky's
neck swinging up on the accent; big grins, eye contact with each other, then out to us. Hands on the strings (never through the guitars).
Only clip 0.38..2.77 s is on screen (song 107.23..109.62 = 世界 是我的), so every move is tied to 'shi jie' / 'shi wo de' and starts at once.
Seedance 2.5 480p 5 s, first frame = still 05 v2 (ff_v2.jpg, the approved still) + vocal-stem ref from S0 = 106.85 (same as v4.4).
    python3 tools/cutscenes/pb_trio47_specs.py TAKE VARIANT     VARIANT a (static camera) | b (slow push-in)
clip t = song t - S0 + lag."""
import json, sys, os
ROOT = "/home/jade/Documents/vibesong"; W = "media/cutscenes/_work/v44/c05/"
S0 = 106.85
STYLE = ("A colored-pencil drawing on cream paper comes to life, a pencil drawing in every frame, never a photo or 3D. ")
SING = ("Lip sync first: JADE, the young woman at the microphone in the centre, sings 'shi jie, shi wo de wu tai' from the reference audio in Mandarin, "
        "each syllable on the voice, mouth open wide on 'jie' and 'tai', lips rounding on 'wo' and 'wu'. ")
JADE = ("A band that just found its groove, bursting with excitement from the first beat. "
        "Jade sings out, proud and thrilled, chin up, eyes bright over the crowd; on 'shi jie' her free arm sweeps up and reaches out over the audience, "
        "open palm, offering them the world, shoulders bouncing on the beat; on 'shi wo de' she grins at her bandmates and grips the microphone. ")
BAND = ("CHARLIE (flat cap, left) strums his acoustic guitar hard, strumming hand over the sound hole, other hand on the neck; he bounces on his knees, "
        "head bobbing hard on every beat, and leans toward the centre with a huge grin, eyes on Ricky. "
        "RICKY (striped shirt, right) digs into his electric guitar, picking hand over the pickups, fretting hand on the neck; he leans toward Charlie, "
        "head banging on the beat, swings his guitar neck up high on 'shi jie' like a rock star and grins back at Charlie; then both grin out at us. "
        "Both keep their mouths closed. Hands stay on the strings and the neck, never passing through the guitars. "
        "Big, joyful motion like live concert footage; nobody is ever still. The spotlights pulse with the beat. ")
FACE = ("Faces stay exactly as in the first frame (Jade's big eyes, soft chin; Ricky's short messy black hair); Charlie's flat cap stays on. ")
BUN = ("Jade's bun keeps the two yellow pencils crossed through it in an X, eraser caps up (one blue, one pink), moving only with her head. ")
OUTFIT = ("Headphones stay round her neck; the white jacket keeps its horizontal orange bands, ONE pale-blue chest dot and ONE round sleeve patch, where they are. ")
CAM = {"a": "Static camera, same framing. No captions, no text, no new objects.",
       "b": "The camera pushes in slowly, all three stay in frame. No captions, no text, no new objects."}

def build(take, var):
    tag = f"v47_05_sd25_{var}{take}"
    p = STYLE + SING + JADE + BAND + FACE + BUN + OUTFIT + CAM[var]
    inp = {"prompt": p, "image": "file:media/cutscenes/_work/passB/c05/ff_v2.jpg", "reference_audios": ["file:" + W + f"voc05_{S0:.2f}_5s.mp3"],
           "duration": 5, "resolution": "480p", "aspect_ratio": "16:9", "generate_audio": False, "use_virtual_avatar": True}
    spec = {"model": "bytedance/seedance-2.5", "tag": tag, "notes": f"v4.7 trio card 05 stage energy; S0={S0} (clip t = song t - S0 + lag)", "input": inp}
    out = os.path.join(ROOT, "media/gen/specs", tag + ".json"); json.dump(spec, open(out, "w"), indent=1, ensure_ascii=False)
    print(out, len(p))

if __name__ == "__main__":
    build(*sys.argv[1:3])
