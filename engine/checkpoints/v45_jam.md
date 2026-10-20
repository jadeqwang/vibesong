# v45_jam checkpoint (unit started 2026-10-19)
Task: ~2:30 (~147-155) Charlie + Ricky play their guitars on the 3D island; Ricky's guitar brings light. Brief docs/v45_brief.md.
Owns: scenes/act4/main3d.js (+ act4 world files). core/motion/* read-only.

## Status
- [start] reading brief/scene. No edits yet.
- Added scope (coordinator): section 2 = party cart ride ~160.8-168 (ROLL 160.83, BUILD 161.728-165.87, button 165.87, launch): Ricky's guitar powers the cart (strums rev it, big chord = thrust). Same file, const switch. Clips ~159-169.
- Coordinator notes (after jam + cart): cart 161.73-166.3 both play (Charlie idle now), bar jumps on drum hits 163.88/164.675/165.87/166.465, don't break the montage speedrun HUD 168-172 (hud2d.js); OPTIONAL 135.6-138.61 Charlie strums on the lone hit 138.595 -> ring to the top 一 (const switch, clips 134-140).
- Backups: engine/out/bak_v45/v45_jam/{main3d.js.v44,world4.js.v44} (pre-edit originals).
- Edits so far (main3d.js): import figPose + `export const JAM_V45` (top, ~l.43-50); m2Heroes REBUILD branch calls jamHeroes(t) when JAM_V45; new JAM block (strum events, strumP, jamHeroes, jamLight rings) right before m2Heroes; update() calls jamLight.state after finaleState; look() adds exposure/rays lift from jamS.
- Guitar onsets: work/demucs/htdemucs_ft/song/other.wav, script scratchpad jam/grid.py (800-6000 Hz onset strength on 16th grid). Hits: stab 150.982 (between mini stops), 151.779, 154.169.
- JAM DONE (safe point): `export const JAM_V45` in main3d.js (~l.49) = 'light' (on) | 'play' | null (v4.4). Clips engine/out/review/v45/v45_jam/{jam_v44,jam_play,jam_light}.mp4 (145-157). (render_jam.sh superseded by render_var.sh below.)
  Duo spots JAM_P (Charlie RB+(-38,-50), Ricky RB+(-64,-8)), both visible in R1/R1b/R2; Charlie swings the acoustic round in 0.32 s at the cut; Ricky quarters, Charlie 8ths; freeze in mini-stops, both hit the stab 150.982; turn to each other + Ricky steps in 151.78-153.77; lean back on big hits.
  Light: ground rings (additive plane at GY+0.7 + stage-disc copy), a low light curtain on each ring front, rising motes, guitar point light, lamp flare, exposure/rays lift. Rings at 149.786,150.185,150.982,151.779,152.576,153.372,154.169.
- NEXT: cart section (CART_V45).

## DONE (all three sections, safe point; nothing running; spend $0 — no paid gens)
Switches in engine/src/scenes/act4/main3d.js (each null = exactly v4.4 there):
- l.49 `JAM_V45` = 'light' (on) | 'play' | null — rebuild 149.786-154.26.
- l.55 `CART_V45` = 'power' (on) | null — cart 161.728-168.075. Ricky moved to the camera side rear of the deck (l.821), both play (l.829: Ricky quarters + drum accents, 'sustain' thrust pose on 166.275; Charlie 8ths, swings the acoustic round at 161.728, still slams the button 165.87). Power: lamp flare, wheel spin kick, glider flap, dust (l.904-930), ground light rings under the cart on big hits + a vertical ring of light in the air on the launch chord (cartState l.773), REALITY bar steps on every strum (hud2d.js opts.steps l.53-80; montage 168.075+ untouched, verified 99% in clip).
- l.59 `LOCK_V45` = 'strum' (on) | null — lock shot: Charlie swings the acoustic round on the band stop (137.03-0.2), one strum on the lone hit 138.595 + a light bolt guitar -> top 一 (lockStrum l.655, called at l.480).
Shared helpers: strumP (l.600), playFig (l.611), JAM (l.584), CART (l.671), jamLight (l.685).
hud2d.js: makeAct4HUD(ctx, opts) — opts.steps (backup hud2d.js.v44).
Clips (540p, audio) engine/out/review/v45/v45_jam/: jam_v44 / jam_play / jam_light (145-157); cart_v44 / cart_power (159-172); lock_v44 / lock_strum (134-140).
Re-render: from engine/, `bash out/review/v45/v45_jam/render_var.sh <JAM_V45|CART_V45|LOCK_V45> <value|null> <from> <to> <name>` (restores the const).
Backups: engine/out/bak_v45/v45_jam/{main3d.js.v44, world4.js.v44 (unchanged), hud2d.js.v44, main3d.js.v45_done, hud2d.js.v45_done}.
Canon: Jade code untouched; crops (R1b close, R2, cart) pass (hair down + pencils in hand, headphones on neck, horizontal sleeve bands, patch her left arm, baggy navy pants + orange straps). Charlie's hat tan/beige in all three sections (dusk-brown in the lock shot, same as v4.4), never grey.
