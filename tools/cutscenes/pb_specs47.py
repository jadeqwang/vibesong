"""v4.7 (unit v47_cards, Jade 10-19 on v4.6): paper cards 03 / 04 / 06 with ACTING, not just singing. From pb_specs43.py (var c: lip sync
first). Jade: "amplify expression and body language ... like she's actively thinking about the lyrics and about vibe coding their way past
the known edges of the video game world"; card 06: "what acting directions would you give her if she's trying to befriend the eraser?".
Per card: one motivated gesture per phrase tied to the words (rare-earth seedance_shots.py), a named eye-line, an emotional verb, hands in
frame, a slow camera drift; "never exaggerated / stays in place / static camera" are gone. Seedance 2.5 480p, first frame + vocal stem.
    python3 tools/cutscenes/pb_specs47.py CARD TAKE FRAMING      CARD 03|04|06, FRAMING cur (approved still) | med (outpainted medium shot)
First frames media/cutscenes/_work/v47/c<card>/ff<card>_{cur,med}.jpg (06 cur = still v2 with the patch re-centred on the band,
tools/cutscenes/pb_patch47.py; med = tools/cutscenes/pb_outpaint47.py). 5 s, vocal stem from S0. clip t = song t - S0 + lag."""
import json, sys, os
ROOT = "/home/jade/Documents/vibesong"; W = "media/cutscenes/_work/v47/"
STYLE = ("A colored-pencil drawing on cream paper comes to life, hand-drawn in every frame: "
         "same pencil lines, paper and hatching as the first frame, never a photo or 3D. ")
ACTOR = ("She acts the lyric like a music-video performer, thinking it through as she sings: her shoulders, arms "
         "and hands move with clear, motivated gestures; her face shows each thought. ")
FACE = ("Same person as in the first frame: large head, heart-shaped face, soft chin, tall forehead with the "
        "high centre-parted hairline, the two slightly different eyebrows, the same big dark-brown eyes; do not restyle her face. ")
BUN = ("Her hair stays up in the bun with the two yellow pencils crossing through it in an X, both eraser caps pointing up (one blue, one "
       "pink); the pencils move only with her head and never fall; her hands stay empty. ")
DOWN = ("Her long black hair stays loose. She holds ONE yellow pencil (blue cap, rainbow tip) in one hand all the time; her other hand "
        "stays empty. ")
OUTFIT = ("Headphones stay round her neck; the white jacket keeps its horizontal orange bands, ONE small pale-blue chest dot where it is "
          "and ONE round 1420 MHz patch on the orange band of her upper arm. ")
CAM = ("The camera drifts slowly and gently {drift}, keeping her face, shoulders and hands in frame. One continuous shot, no cuts. "
       "No captions, no text, no new objects.")
CARDS = {
    "03": dict(s0=19.60, ff="c03/ff03_{f}.jpg", ref="c03/voc03_19.60_5s.mp3", hair=BUN, drift="in toward her",
               words="(held note) because my imagination is linked to my everyday",
               lips=("after a held note, lips press together on the 'b' of 'because', then the mouth stays open, never closing, "
                     "through the long held 'cause'; lips pressing together on the 'm' of 'my' and the 'm' of 'imagination', opening wide on 'a'"),
               act=("The idea arrives. Through the held note and 'because' her eyes drift up and off to the side, as if she can see past the "
                    "edge of the page, lips parted in wonder; on 'imagination' she lifts one hand and taps her temple with a fingertip, eyes "
                    "lighting up; on 'is linked' both hands open outward from her head, palms up, like the world unfolding along the drawn "
                    "chain of everyday things beside her; on 'everyday' she turns back to the camera with a big grin and a nod. ")),
    "04": dict(s0=48.00, ff="c04/ff04_{f}.jpg", ref="c04/voc04_48.00_5s.mp3", hair=BUN, drift="in toward her face",
               words="I just ask myself what it is that I need",
               lips="mouth opening on 'I', a short rounded 'j' on 'just', open on 'ask', lips pressing together on the 'm' of 'myself'",
               act=("A plotting pause. From the start she rests her knuckles under her chin (below her mouth, never covering it), eyes "
                    "narrowed and searching up and to the side at a glowing screen, as if reading the code of the world; on 'ask' the hand "
                    "drops away; on 'myself' she leans toward the camera with a mischievous 'what if' smile, eyebrows lifting, as if about "
                    "to type the idea; a small decisive nod on 'what it is'. A cool blue screen glow lights her face. ")),
    # (r2) 04b: the r1 takes all held the thinking pose through the 2.1 s window and smiled only after it (51.5); compress the beats.
    "04b": dict(s0=48.00, ff="c04/ff04_{f}.jpg", ref="c04/voc04_48.00_5s.mp3", hair=BUN, drift="in toward her face",
               words="I just ask myself what it is that I need",
               lips="mouth opening on 'I', a short rounded 'j' on 'just', open on 'ask', lips pressing together on the 'm' of 'myself'",
               act=("A quick plotting beat. In the very first second she raises one hand and rests her knuckles under her chin (below her "
                    "mouth, never covering it), eyes narrowed, glancing up at a glowing screen beside her as if reading the code of the "
                    "world; on 'ask' the hand drops and on 'myself' she is already leaning toward the camera, eyebrows up, a sly, "
                    "mischievous 'what if' smile spreading while she sings, as if about to type the idea; she nods once on 'what'. A cool "
                    "blue screen glow lights her face; the blueprint grid stays. ")),
    "06": dict(s0=142.90, ff="c06/ff06_{f}.jpg", ref="c06/voc06_142.90_5s.mp3", hair=DOWN, drift="sideways toward the two of them",
               words="I just ask myself what it is that I need",
               lips="mouth opening on 'I', a short 'j' on 'just', lips closing on the 'm' of 'myself', opening on 'what' and 'is'",
               act=("She is befriending a scared stray, the giant gray rubber-eraser creature on the right. On 'I just' she slowly lowers "
                    "the pencil to her side, tip pointing at the ground, never at him, and leans in a little closer, head tilted, soft eyes "
                    "on his face; on 'ask myself' her empty hand touches her chest, honest and a little vulnerable; on 'what it is' she "
                    "turns to him, brows up, and offers that open hand toward him, palm up, with a small hopeful smile, a real question; "
                    "a tiny shrug on 'that I need'. The Eraser gives her a wary side-eye that slowly softens, one brow lifting; his mouth "
                    "stays still. ")),
    # (r2) 06b: in every r1 take the PENCIL hand went to her chest and the pencil vanished (her empty hand is off-frame); keep the pencil
    # in that hand all the time and make the open palm an offer of the pencil itself (her tool, never a weapon) = befriending.
    "06b": dict(s0=142.90, ff="c06/ff06_{f}.jpg", ref="c06/voc06_142.90_5s.mp3", hair=DOWN, drift="sideways toward the two of them",
               words="I just ask myself what it is that I need",
               lips="mouth opening on 'I', a short 'j' on 'just', lips closing on the 'm' of 'myself', opening on 'what' and 'is'",
               act=("She is befriending a scared stray, the giant gray rubber-eraser creature on the right. She never lets go of the yellow "
                    "pencil: it stays visible in the same hand in every frame. On 'I just' she slowly lowers it, tip down, never aimed at "
                    "him, and leans in closer, head tilted, soft eyes on his face; on 'ask myself' that hand, still holding the "
                    "pencil, rests on her chest, honest, a little vulnerable; on 'what it is' she turns to him, brows up, and holds the "
                    "pencil out to him lying flat across her open palm, offering it, with a hopeful smile, a real question. The "
                    "Eraser gives her a wary side-eye that slowly softens, one brow lifting; his mouth stays still. ")),
    # (r3) 06c: r1's acting (Jade's ask) with the hands named by SCREEN SIDE and a held medium shot, so the empty hand is visible and the pencil
    # hand never goes to the chest (r1: the pencil vanished there; r2: the pencil stayed but the acting got smaller).
    "06c": dict(s0=142.90, ff="c06/ff06_{f}.jpg", ref="c06/voc06_142.90_5s.mp3", hair=DOWN, drift="",
               words="I just ask myself what it is that I need",
               lips="mouth opening on 'I', a short 'j' on 'just', lips closing on the 'm' of 'myself', opening on 'what' and 'is'",
               act=("She is befriending a scared stray, the giant gray rubber-eraser creature on the right. On 'I just' the hand on the "
                    "RIGHT side of the picture slowly lowers the yellow pencil to her waist, tip down, never aimed at him, and keeps "
                    "holding it there; she leans in, head tilted, soft eyes on his face. On 'ask myself' her EMPTY hand, on the LEFT side "
                    "of the picture, rises and rests on her chest, honest, a little vulnerable; on 'what it is' that empty hand opens "
                    "toward him, palm up, brows up, a hopeful smile, a real question. The Eraser's wary side-eye slowly softens, one "
                    "brow lifting; his mouth stays still. ")),
}

def build(card, take, framing="cur"):
    c = CARDS[card]; tag = f"v47_{card}_sd25_{framing}{take}"
    sing = (f"Lip sync first: she sings '{c['words']}' from the reference audio, each syllable on the voice, lips shut on b and m: {c['lips']}. ")
    cam = CAM.format(drift=c["drift"]) if c["drift"] else ("The camera holds this medium shot, both of her hands always in frame. One continuous "
                                                           "shot, no cuts. No captions, no text, no new objects.")
    p = STYLE + sing + ACTOR + c["act"] + FACE + c["hair"] + OUTFIT + cam
    inp = {"prompt": p, "image": "file:" + W + c["ff"].format(f=framing), "reference_audios": ["file:" + W + c["ref"]],
           "duration": 5, "resolution": "480p", "aspect_ratio": "16:9", "generate_audio": False, "use_virtual_avatar": True}
    spec = {"model": "bytedance/seedance-2.5", "tag": tag, "notes": f"v4.7 paper card {card} acting ({framing}); S0={c['s0']} (clip t = song t - S0 + lag)", "input": inp}
    out = os.path.join(ROOT, "media/gen/specs", tag + ".json"); json.dump(spec, open(out, "w"), indent=1, ensure_ascii=False)
    print(out, len(p)); return out

if __name__ == "__main__":
    build(*sys.argv[1:4])
