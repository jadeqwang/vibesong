"""v4.3 spread reshoot specs (Jade 10-19: 'her eyes are really demented ... so are Charlie's'). Writes media/gen/specs/pB_spread_v14_t*.json.
t1/t2 Veo 3.1, t3/t4 Veo 3.1 Fast (A = eyes closed / lowered, B = soft glances); t5/t6 Veo 3.1 round 2 (A2 = looking down at hands, A+ = more strum)."""
import json, sys
HEAD = ("A hand-drawn colored-pencil illustration on a sketchbook page comes gently to life, like a living illustration. "
 "Camera completely static and locked off for the whole shot: no zoom, no push-in, no pan, no drift; the paper, the page edges and the drawing style "
 "stay exactly the same (colored pencil hatching and paper grain hold steady, no change in line style, no new details, no text).\n")
BODY = ("A relaxed, happy jam between three friends sitting on the rainbow bench, with continuous gentle whole-body life the whole time: "
 "all three breathe and sway softly to the same slow beat, their heads nodding gently in time. The young man in the flat cap on the left strums his "
 "acoustic guitar steadily while the fingers of his fretting hand shift along the neck. The young man on the right in the striped shirt keeps picking "
 "his electric guitar, his picking hand moving and his fretting fingers changing. The young woman in the middle sings softly along, her lips moving "
 "gently, swaying her shoulders, her hands resting on the bench. Every movement stays small, relaxed and natural, and they stay seated in the same places.\n")
BODY_PLUS = BODY.replace("strums his acoustic guitar steadily", "strums his acoustic guitar steadily and clearly, his strumming arm moving up and down on every beat,").replace(
 "keeps picking his electric guitar, his picking hand moving", "keeps picking his electric guitar, his picking hand moving on every beat")
EYES_A = ("Eyes: calm and natural the whole time, drawn in exactly the same soft illustration style as the first frame, never staring, never wide. "
 "The young woman keeps her eyes gently closed in a contented smile while she sings, like someone lost in the music. "
 "The young man on the left looks down at his own fretboard with relaxed, lowered eyelids; the young man on the right looks down at his own strings with relaxed, lowered eyelids. "
 "Both eyes of each person always move together and look at the same point; occasional slow, natural blinks.\n")
EYES_A2 = ("Eyes: calm and natural the whole time, drawn in exactly the same soft illustration style as the first frame, never staring, never wide, no glints. "
 "The young woman keeps her eyes gently closed in a contented smile while she sings, like someone lost in the music. "
 "The two young men tilt their heads slightly down and watch their own hands on their guitars, eyelids relaxed and half lowered, both eyes looking at the same spot on their guitar. "
 "Occasional slow, natural blinks; nobody winks.\n")
EYES_B = ("Eyes: calm, friendly and natural the whole time, drawn in exactly the same soft illustration style as the first frame, never staring, never wide, no glints. "
 "The two young men keep a soft, warm gaze toward the young woman in the middle, now and then glancing down at their own guitars; she sings with "
 "happy, half-closed smiling eyes, now and then glancing softly toward the young man on the right. "
 "Both eyes of each person always move together and look at the same point; occasional slow, natural blinks.\n")
TAIL = ("Her hair bun with its two pencils stays exactly as drawn and only moves together with her head: the same two yellow pencils crossed through the bun, "
 "with only their two eraser caps showing above the bun (pink on one side, blue on the other, both pointing up); no pencil ever points down and no extra pencil appears. "
 "Her headphones stay around her neck. The sunset glow shimmers softly and the drawn clouds drift a tiny bit. Silent.")
TAKES = {"t1": ("google/veo-3.1", BODY, EYES_A), "t2": ("google/veo-3.1", BODY, EYES_B), "t3": ("google/veo-3.1-fast", BODY, EYES_A), "t4": ("google/veo-3.1-fast", BODY, EYES_B),
         "t5": ("google/veo-3.1", BODY_PLUS, EYES_A2), "t6": ("google/veo-3.1", BODY_PLUS, EYES_A)}
for t in (sys.argv[1:] or TAKES):
    m, body, eyes = TAKES[t]; tag = f"pB_spread_v14_{t}"
    json.dump({"model": m, "tag": tag, "notes": "v4.3 spread reshoot (Jade 10-19: demented eyes on v13c): sane eyes, natural jam; from the v11 crop",
               "input": {"prompt": HEAD + body + eyes + TAIL, "image_input": "file:media/act5/stills/spread_right_crop_v11.jpg",
                         "duration": "8s", "aspect_ratio": "16:9", "resolution": "1080p", "generate_audio": False}},
              open(f"media/gen/specs/{tag}.json", "w"), indent=1)
    print(tag, m)
