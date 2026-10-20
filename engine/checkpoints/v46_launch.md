# v46_launch: refresh launch deliverables from full_v4.6_1080p (2026-10-19)

Method: checkpoints/launch.md (engine renders + seg/assemble.py). Old files -> out/bak_v46/launch_v41/.

## State
- 17:xx started. Read launch.md + seg scripts. No src edits planned.
- Backed up old deliverables + old seg mp4s + seg scripts/stills -> out/bak_v46/launch_v41/ (247 MB; its seg/*.mp4 166 MB can go).
- assemble.py: MASTER -> full_v4.6_1080p.mp4 (cut-1 pill crop unchanged, checked same position at 49.3).
- render_all.sh: added the missing c1_insert_wide line. Running all 6 renders sequentially (--workers 1) -> seg/render_all.log.
- Cut 1 DONE (18.406 s): ENTER chord shot visible at 52.6 in portrait; paper insert now has Jade's eyes open (current card). Start/end/slate same as v4.1.
- Cut 2 DONE (15.291 s): orbit walk needed a new pan (assemble.py cut2 keys) and the slate moved to the bottom (y 1680, fade from 14.44; slate_lead) since the heads are now at the top in the last 1.5 s.
- Cut 3 DONE (16.992 s): same windows/pans; FIXTURES (180.233) and FUNCTIONS (183.300) strum rings show in the fit shots; no montage blob (171.4-171.6 clean); 184-186.66 is still the aerial (outro spread starts after 186.66). Slate unchanged.
- Stills (2560x1440, two calls so C's range never reaches 173): B 179.5 pixel-identical to v4.1; C 140.6 mean diff 1.5/765 (noise); A 183.6 now has Ricky's strum sparkles on his guitar -> A = 183.733 (make_thumbs.py, sheet.py label).
- Thumbs + launch_sheet.jpg rebuilt. launch.md updated (v4.6 section at top + cut-2 pan/slate + thumb A lines). seg/pancheck.py added.
- Canon audit (2-4x): paper insert (bun, pencils X through it, blue + pink caps up), 2D sprites at 52.6, 3D orbit close-up 84.8, FIXTURES 180.6, FUNCTIONS 183.733: all on canon; Charlie's hat tan/straw everywhere, never grey.
- Temp cleaned (my 3 chrome fetcher dirs in out/dev/tmp, __pycache__, unused candidate stills). Nothing committed.

## DONE 2026-10-19 ~17:15
