"""v4.3 (Jade notes 10-19): paper cards 03 / 04 re-animated as a SINGER IN A MUSIC VIDEO (natural head, shoulder, upper-body motion,
breathing, expression and eye-line changes), still lip-synced to the vocal stem. Seedance 2.5 480p, first frame + reference audio.
    python tools/cutscenes/pb_specs43.py CARD TAKE [VARIANT]    CARD 03|04, VARIANT a (performance) | b (more sway / bigger gestures)
S0: 03 = 19.60 (the held 'blossoms' tail, so she is already moving when the card cuts in at 20.1667), 04 = 48.00. 5 s, vocal stem.
clip t = song t - S0 + lag. 03 first frame = assets/v4_stills/03_paper_0020_v3.png (chest dot moved to her LEFT, image-right)."""
import json, sys, os
ROOT = "/home/jade/Documents/vibesong"; W = "media/cutscenes/_work/passB/v43/"
STYLE = ("A colored-pencil drawing on cream paper comes to life, a hand-drawn pencil drawing in every frame: "
         "same pencil lines, paper texture and hatching as the first frame, never a photo or 3D. ")
PERF = ("She performs like a real singer in a music video: her chest and shoulders "
        "rise and fall with her breathing; her head moves with the phrasing, small nods on the beat, a tilt to one side on the long notes, "
        "the chin lifting on the high note; her shoulders roll and her upper body sways gently side to side to the rhythm; her "
        "eyebrows lift with feeling, her eyes glance away and come back, she blinks naturally; her expression follows the "
        "words. Continuous, relaxed, natural movement, never stiff, never exaggerated; she stays in place. ")
PERF_B = ("She performs like a real singer in a music video, feeling the song: she sings "
          "with her whole upper body, shoulders and chest moving, her body swaying side to side on the beat, her head bobbing and tilting "
          "freely, turning slightly toward the viewer and away again; her eyebrows rise and fall, her eyes look up and to the side, close "
          "briefly on a long note and open again. Lively, natural, continuous motion "
          "like live footage of a singer, never a still body with only a moving mouth; she stays roughly in place. ")
FACE = ("Same person as in the first frame: large head, heart-shaped face, soft chin, tall forehead with the "
        "high centre-parted hairline, the two slightly different eyebrows, the same big dark-brown eyes; do not restyle her face. ")
BUN = ("Her hair stays up in the bun with the two yellow pencils crossing through it in an X, both eraser caps pointing up (one blue, one "
       "pink); the pencils move only together with her head and never fall. ")
OUTFIT = ("Headphones stay round her neck; the white jacket keeps its orange bands, ONE small pale-blue chest dot exactly where it is "
          "in the first frame and ONE 1420 MHz sleeve patch. ")
CAM = "Static camera, same framing, no zoom. No captions, no text, no new objects."
CARDS = {
    "03": dict(s0=19.60, words="(held note) because my imagination is linked to my everyday life",
               lips=("after a held note, lips press together on the 'b' of 'because', then the mouth stays open, never closing, "
                     "through the long held 'cause'; lips pressing together on the 'm' of 'my' and the 'm' of 'imagination', opening wide on 'a' and 'life'"),
               act=("She sings with bright wonder and delight, as if the idea just lit up in her head, a small smile between words, eyes "
                    "sparkling toward the drawn chain of everyday things beside her, "
                    "which sways gently. ")),
    "04": dict(s0=48.00, words="I just ask myself what it is that I need",
               lips="mouth opening on 'I', a short rounded 'j' on 'just', open on 'ask', lips pressing together on the 'm' of 'myself'",
               act=("She sings it softly and thoughtfully, a small honest shrug of her shoulders on 'I just ask myself', her eyes searching "
                    "up and to the side as if reading a screen, then turning inward; a cool blue screen glow lights her face. The grid "
                    "and wireframe cubes behind her stay still. ")),
}

def build(card, take, var="a"):
    c = CARDS[card]; tag = f"v43_{card}_sd25_{var}{take}"
    ff = W + ("ff03_v3.jpg" if card == "03" else "ff04_v2.jpg")
    sing = (f"She sings the words of the reference audio, '{c['words']}', lips exactly in time with the voice: {c['lips']}. ")
    if var == "c":   # round 2: variant b's motion, lips first and stricter (b1 lost the sync)
        sing = (f"Lip sync first: she sings '{c['words']}' from the reference audio, each syllable on the "
                f"voice, lips shut on b and m: {c['lips']}. ")
    p = STYLE + sing + (PERF if var == "a" else PERF_B) + c["act"] + FACE + BUN + OUTFIT + CAM
    inp = {"prompt": p, "image": "file:" + ff, "reference_audios": ["file:" + W + f"voc{card}_{c['s0']:.2f}_5s.mp3"],
           "duration": 5, "resolution": "480p", "aspect_ratio": "16:9", "generate_audio": False, "use_virtual_avatar": True}
    spec = {"model": "bytedance/seedance-2.5", "tag": tag, "notes": f"v4.3 paper card {card} singer motion; S0={c['s0']} (clip t = song t - S0 + lag)", "input": inp}
    out = os.path.join(ROOT, "media/gen/specs", tag + ".json"); json.dump(spec, open(out, "w"), indent=1, ensure_ascii=False)
    print(out, len(p))

if __name__ == "__main__":
    build(*sys.argv[1:4])
