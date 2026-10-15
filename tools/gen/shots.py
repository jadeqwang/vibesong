"""Shot registry for tools/gen/vgen.py (Rewind take two). Prompts only: no secrets, no private names.

Each entry: model, image (first frame, repo-relative path under media/), duration (s), prompt, and optional
camera_fixed, aspect, avatar (Seedance use_virtual_avatar), refs (reference images), audio (reference audio mp3).
"""
SD20 = "bytedance/seedance-2.0"
H3 = "minimax/h3"

ENGRAVED = ("The whole world stays a black-and-white Escher-style wood engraving: crisp black ink lines and dense "
            "cross-hatching on off-white paper, no gray wash, no color anywhere except the girl.")
ONLY_HER_COLOR = ("Only the anime girl is in full color (white bomber jacket with orange band, navy cargo pants, orange "
                  "headphones round her neck, black hair in a bun with a yellow pencil through it); she keeps her colors "
                  "and design exactly.")
NO_TEXT = "No text, no letters, no subtitles, no logos, no watermark."

SHOTS = {
    # style test C (2026-10-11): does the engraving hold and does only Jade stay in color during fast motion?
    "ST_run": dict(model=SD20, image="media/style_tests/video/ST_run_first.jpg", duration=5, camera_fixed=False,
                   prompt=(f"Side-scrolling platformer shot: the anime girl sprints extremely fast from left to right along "
                           f"the elevated train tracks, legs a blur of long powerful strides, hair bun bouncing, arms "
                           f"pumping. The camera tracks sideways with her at the same speed, keeping her in the same place "
                           f"in frame while the engraved girders, buildings and rooftops scroll past quickly from right to "
                           f"left. {ENGRAVED} {ONLY_HER_COLOR} {NO_TEXT}")),
}

# ---------------------------------------------------------------- Section E generation crew (glitch break G1-G3 + MV sprites)
# "last" = optional last_frame_image (submitted via a wrapper that adds it to the Seedance 2.0 input).
_E_FACE = ("Her face and outfit keep the first frame's design exactly; forehead smooth, brows relaxed, never a face close-up.")
_E_PAGE = ("The background stays an almost empty page of warm off-white paper; only a few short black engraved hatch-line "
           "fragments drift very slowly around her like iron filings. No other colour appears in the background.")
_E_G2 = ("Slow motion, weightless, she floats in mid-air. Early in the shot, within the first second, she pulls the yellow "
         "pencil out of her bun in one smooth motion; the bun comes undone and her long black hair falls loose and "
         "unfurls slowly, spreading out weightlessly to waist length, floating and rippling as if underwater for the rest "
         "of the shot. She brings the pencil down in front of her chest and looks at it. ")
_E_SPR = ("Plain flat white background stays completely empty: no floor, no ground, no shadows, no objects appear. "
          "Static locked-off camera: the camera never moves, pans or zooms; the high-angle view stays exactly the same. "
          "Her long loose hair sways naturally. " + _E_FACE + " " + NO_TEXT)
SHOTS.update({
    "E_G1_a": dict(model=SD20, image="media/shots/G1/kf_a.jpg", duration=5, camera_fixed=False, prompt=(
        "Slow motion, weightless, she floats in mid-air and drifts very slowly upward, her body turning gently. She slowly "
        "turns her raised hand and looks at it with quiet wonder. A soft glint of light runs along the yellow pencil in "
        "her bun. Loose strands of hair and the jacket hem drift as if underwater. Her hair stays in the bun with the "
        f"pencil. Camera: slow steady push-in. {_E_PAGE} {_E_FACE} {NO_TEXT}")),
    "E_G1_b": dict(model=SD20, image="media/shots/G1/kf_b.jpg", duration=5, camera_fixed=False, prompt=(
        "Slow motion, weightless, she floats in mid-air and slowly rotates, drifting gently. She turns her raised hand "
        "and looks at it with calm curiosity. A soft glint of light runs along the yellow pencil in her bun. Loose "
        "strands of hair and the jacket hem drift as if underwater. Her hair stays in the bun with the pencil. Camera: "
        f"slow steady push-in. {_E_PAGE} {_E_FACE} {NO_TEXT}")),
    "E_G2_bl_push": dict(model=SD20, image="media/shots/G2/kf_first_b.jpg", last="media/shots/G2/kf_last_a.jpg",
                         duration=5, camera_fixed=False,
                         prompt=_E_G2 + f"Camera: slow steady push-in. {_E_PAGE} {_E_FACE} {NO_TEXT}"),
    "E_G2_b_orbit": dict(model=SD20, image="media/shots/G2/kf_first_b.jpg", duration=5, camera_fixed=False,
                         prompt=_E_G2 + f"Camera: slow low-angle orbit, circling slightly around her from below. "
                                        f"{_E_PAGE} {_E_FACE} {NO_TEXT}"),
    "E_G2_a_push": dict(model=SD20, image="media/shots/G2/kf_first_a.png", duration=5, camera_fixed=False,
                        prompt=_E_G2 + f"Camera: slow steady push-in toward her. {_E_PAGE} {_E_FACE} {NO_TEXT}"),
    "E_G2_bl_orbit": dict(model=SD20, image="media/shots/G2/kf_first_b.jpg", last="media/shots/G2/kf_last_a.jpg",
                          duration=5, camera_fixed=False,
                          prompt=_E_G2 + f"Camera: slow low-angle orbit, circling slightly around her. "
                                         f"{_E_PAGE} {_E_FACE} {NO_TEXT}"),
    "E_G3_free": dict(model=SD20, image="media/shots/G3/kf_first.jpg", duration=5, camera_fixed=False, prompt=(
        "Slow motion, weightless, she floats in mid-air with her long loose hair drifting. She sweeps the yellow pencil "
        "through the empty air in ONE long graceful looping stroke; the pencil tip leaves behind a thick coloured-pencil "
        "line with waxy grain texture that starts vivid orange and blends into pale sky blue; the line stays hanging in "
        f"the air after she draws it. Camera: slow push-in. {_E_PAGE} {_E_FACE} {NO_TEXT}")),
    "E_G3_last": dict(model=SD20, image="media/shots/G3/kf_first.jpg", last="media/shots/G3/kf_last2.jpg", duration=5,
                      camera_fixed=False, prompt=(
        "Slow motion, weightless, she floats in mid-air with her long loose hair drifting. She draws ONE long graceful "
        "looping stroke in the empty air with the yellow pencil, moving from left to right; the line appears only "
        "where the pencil tip has passed, a thick coloured-pencil line with waxy grain that starts vivid orange and "
        f"blends into pale sky blue near her pencil. Camera: almost still, very slow push-in. {_E_PAGE} {_E_FACE} {NO_TEXT}")),
    "E_walk_front": dict(model=SD20, image="media/shots/E_sprites/walk_front/kf_shift.png", duration=5, camera_fixed=True,
                         prompt=("She walks at a slow, steady, relaxed pace diagonally toward the lower right of the frame, "
                                 "three-quarter front view, with even regular steps, arms swinging gently, the yellow "
                                 "pencil stays in her right hand. She stays fully inside the frame the whole time. " + _E_SPR)),
    "E_walk_back": dict(model=SD20, image="media/shots/E_sprites/walk_back/kf_shift.png", duration=5, camera_fixed=True,
                        prompt=("She walks at a slow, steady, relaxed pace diagonally away from us toward the upper left "
                                "of the frame, three-quarter back view, with even regular steps, arms swinging gently, "
                                "her long hair swaying on her back. She stays fully inside the frame the whole time. "
                                + _E_SPR)),
    "E_crank": dict(model=SD20, image="media/shots/E_sprites/crank/kf2.jpg", duration=5, camera_fixed=True,
                    prompt=("She stands in place, feet planted, and with both hands at waist height she turns an "
                            "invisible crank handle in steady continuous circles (miming), her shoulders and arms "
                            "rotating with effort, a few full turns, the yellow pencil stays in her right hand. "
                            "Nothing appears in her hands besides the pencil. " + _E_SPR)),
})
# Section E round 2 (retakes): unique first-frame basenames (media/gen/refs/ caches by basename).
SHOTS.update({
    "E_walk_back2": dict(model=SD20, image="media/shots/E_sprites/walk_back/E_walk_back_kf2.png", duration=5,
                         camera_fixed=True, prompt=(
        "She walks slowly and steadily away from us diagonally toward the upper left of the frame, three-quarter back "
        "view, small even relaxed steps, arms swinging gently, her long hair swaying on her back; she gets slightly "
        "smaller as she walks away and stays fully inside the frame the whole time, head and feet always visible. "
        "Locked-off tripod shot: no zoom, no pan, no tracking, the camera never follows her. " + _E_SPR)),
    "E_crank2": dict(model=SD20, image="media/shots/E_sprites/crank/E_crank_kf2.jpg", duration=5, camera_fixed=True,
                     prompt=(
        "She turns an invisible crank handle with both fists in big, slow, clearly visible circles at waist height: "
        "her fists travel around a circle the size of a steering wheel, forward, down, back and up, again and again, "
        "her elbows and shoulders rotating with every turn, a steady rhythm of about one turn per second. Her feet "
        "stay planted and she stays in place. The yellow pencil stays in her right fist. " + _E_SPR)),
    "E_G3_matte": dict(model=SD20, image="media/shots/G3/E_G3_kf_first.jpg", duration=5, camera_fixed=False, prompt=(
        "Slow motion, weightless, she floats in mid-air, her long loose hair drifting. She draws ONE single slow curved "
        "stroke in the empty air with the yellow pencil, her arm moving in one smooth graceful arc. The pencil tip leaves "
        "a flat matte coloured-pencil line like a crayon mark on paper, grainy waxy texture, vivid orange where it "
        "starts, fading to pale powder blue toward the pencil. The line is flat and does not glow: no light, no neon, "
        "no sparkles, no glow, no particles. The line stays still in the air after it is drawn. Camera: very slow "
        f"push-in. {_E_PAGE} {_E_FACE} {NO_TEXT}")),
})
SHOTS["E_walk_back3"] = dict(model=SD20, image="media/shots/E_sprites/walk_back/E_walk_back_kf3.png", duration=5,
                             camera_fixed=False, prompt=(
    "She walks at a slow, steady, even pace away from us toward the upper left, three-quarter back view, regular relaxed "
    "steps, arms swinging gently, her long hair swaying on her back. The camera glides smoothly along with her at "
    "exactly her walking speed, keeping her centred in the frame at the same size the whole time; the high-angle view "
    "and her size never change, she never turns. Plain flat white background stays completely empty: no floor, no "
    "ground, no shadows, no objects appear. " + _E_FACE + " " + NO_TEXT))
