import os
from common import JADE, CHARLIE, RICKY, refs, W, CONC

R = refs()
LAY = os.path.join(W, "layout")
GPT = "openai/gpt-image-2.5-sunburst"
NBP = "google/nano-banana-pro"

PIX = ("Authentic 16-bit SNES-era pixel art (The Lost Vikings / Super Mario World quality): chunky clearly visible square "
       "pixels, limited palette, crisp 1-pixel dark outlines on sprites, no anti-aliasing blur, no painterly gradients. ")
CROP = (" Composition note: the image will be cropped to 16:9, so keep every important element inside the middle band "
        "and leave the top 80 px and bottom 80 px as unimportant background. ")
NOTEXT = " Absolutely no text, letters, numbers, logos or watermarks anywhere in the image. "
PIXREF = ("Character design reference: the attached character sheets show the three heroes' outfits; the attached game "
          "screenshot shows how the engine renders them as pixel sprites (match that sprite proportion, slightly chunky heads). ")

P = {}

P["k01"] = (GPT, PIX + (
    "EDIT the first attached image into a finished frame of a pixel-art platformer cold-open. KEEP the cream paper "
    "background and the four dark-graphite pixel stroke platforms EXACTLY as they are (same shapes, same positions, "
    "do not redraw, move, add or remove any stroke). They are four Chinese characters being drawn stroke by stroke; the "
    "fourth one is unfinished. ADD: (1) a pixel-art sprite of " + JADE + ", mid-leap in a big dynamic running jump, "
    "airborne above the gap between the third shape (a long horizontal bar) and the fourth shape, heading right, about "
    "one fifth of the frame height tall, in full color (she is the only colorful thing in the frame), with small pixel "
    "speed lines behind her and a little pixel dust puff on the bar she just jumped from. (2) A LARGE pixel-art wooden "
    "graphite pencil entering diagonally from the top-right corner, natural pale wood body with a sharpened cone, its dark "
    "graphite tip touching the paper exactly where the unfinished bottom stroke of the fourth shape ends (lower part of "
    "the fourth shape), with tiny graphite crumb pixels and a short scribble spark at the tip. The pencil's far end is "
    "cut off by the frame edge. " + PIXREF + CROP + NOTEXT),
    [os.path.join(LAY, "k01.png"), R["pixel"], R["jade"]])

P["k02"] = (GPT, PIX + (
    "A smash-cut title-card frame for a pixel-art music video, Lost Vikings logo energy. LEFT third: a big pixel-art "
    "sprite of " + RICKY + ", low-angle heroic rock pose, legs wide, striking a power chord, hair blown back. From his "
    "guitar a huge expanding shockwave of concentric bright cyan and white pixel rings blasts across the screen to the "
    "RIGHT, where it slams into a GIANT chunky pixel-art arcade PLAY switch (a fat green triangle 'play' symbol on a round "
    "red-rimmed button on a pedestal) that is being pushed in, with sparks, flying pixel debris and a white impact flash. "
    "Background: graphite-gray pencil-drawn pixel level on cream paper, overlaid with a radial burst of alternating "
    "electric-blue and cream rays exploding from the impact point. The UPPER-MIDDLE region of the frame (roughly the "
    "middle 60% of width, from 18% to 45% of the height) must be kept clear of any objects or characters: only the plain "
    "ray burst there (a big title will be stamped there later). " + PIXREF + CROP + NOTEXT),
    [R["pixel"], R["ricky"]])

P["k03"] = (GPT, PIX + (
    "A Lost Vikings (SNES)-style CHARACTER SELECT screen. Dark indigo stone board with a thick riveted bronze/steel "
    "frame. Across the top: an empty blank header plaque. Three large framed portrait panels side by side, each showing a "
    "pixel-art bust portrait (head and shoulders, facing camera, expressive 16-bit portrait like Lost Vikings / Chrono "
    "Trigger dialogue portraits): LEFT = " + CHARLIE + " (smirking); MIDDLE = " + JADE + " (confident smile); RIGHT = "
    + RICKY + " (cool, calm). The MIDDLE portrait (Jade) is selected: a thick blinking yellow pixel selection frame "
    "with corner arrows around it, and it is slightly brighter. Under each portrait: one empty dark name plate (blank), "
    "then a row of three square item slots with clear pixel icons — Charlie: beige flat cap, parachute, little trampoline; "
    "Jade: gray graphite pencil with pink-orange eraser, rainbow-colored pencil with blue eraser, microphone; Ricky: "
    "wood-colored electric guitar, cyan sound-wave, small bridge. Under the slots: one empty dark text box per hero "
    "(blank). Along the bottom edge: one long empty black marquee strip (blank). " + PIXREF + CROP + NOTEXT),
    [R["charlie"], R["jade"], R["ricky"], R["pixel"]])

P["k04"] = (GPT, PIX + (
    "Side-scrolling platformer screenshot, Kaizo-hard autoscroll level. The ENTIRE world is drawn in graphite pencil on "
    "cream paper rendered as pixel art: gray brick ledges, gray pillars, gray pixel shrubs and spikes, only grays and "
    "cream, no color in the environment. AT THE LEFT EDGE: a GIANT gray rubber ERASER boss filling the full height of "
    "the left fifth of the screen: a huge worn rectangular gray rubber block with a sleepy-grumpy face (droopy half-closed "
    "eyelids, small frown), pushing right and rubbing the level out: behind and under it the level is erased to blank "
    "white paper with eraser crumbs and smudges, and the platform edges near it are half rubbed away. CENTER: a deep "
    "chasm. Across the chasm hangs a sagging chain of bright BLUE pixel chain links (the only saturated object in the "
    "world besides the heroes), arcing from a left ledge to a right ledge. The three heroes swing across it, Lost "
    "Vikings style, in full color: " + CHARLIE + " hangs by one hand from his flat cap which is hooked over the chain; "
    + JADE + " swings below him holding the chain, legs kicked forward; " + RICKY + " grabs the chain one-handed, guitar "
    "on his back. Directly above the middle of the blue chain leave a small clear patch of plain paper (a label goes "
    "there). BOTTOM of the frame: a Lost Vikings-style HUD bar (dark stone panel) with three small pixel face portraits "
    "of the heroes and item slots, and on the right an empty black counter box (blank). " + PIXREF + CROP + NOTEXT),
    [R["pixel"], R["trio"]])

P["k05"] = (GPT, PIX + (
    "EDIT the first attached image into a finished pixel-art platformer frame. KEEP the seven white-and-blue blocky "
    "pixel platforms EXACTLY as they are (same shapes, same positions, same colors, do not redraw, simplify or move "
    "them: they are Chinese characters used as platforms). Turn the black background into THE VOID at the edge of an "
    "unfinished game world: pure black with a faint blue blueprint grid, a few floating wireframe cubes, debug gizmos "
    "(a red/green/blue XYZ arrow gizmo, a dotted bounding box), and broken fragments of purple-and-black missing-texture "
    "checkerboard tiles drifting and flickering. At the far left edge, the last crumbling tiles of a gray graphite pencil "
    "level end abruptly at a cliff. A small pixel-art speech bubble trail of sparkles arcs from the left down onto the "
    "platforms. ADD the three pixel-art heroes landing on the platforms: " + JADE + " standing on top of the sixth "
    "platform, singing into one of her pencils like a microphone; " + CHARLIE + " just landing on top of the fourth "
    "platform with a dust puff; " + RICKY + " mid-air dropping onto the second platform. Heroes are about one sixth of "
    "the frame height. Upper-left area of the frame stays plain dark grid (a HUD message goes there). " + PIXREF + CROP
    + NOTEXT), [os.path.join(LAY, "k05.png"), R["pixel"], R["trio"]])

P["k06"] = (GPT, PIX + (
    "A pixel-art platformer LEVEL EDITOR scene in a black void with a faint blue blueprint grid. The frame is split by a "
    "diagonal seam. LEFT HALF: a gray-box level drawn with a plain graphite pencil: flat untextured gray blocks, walls, "
    "pillars, stairs, a gray spring (still), a gray closed door, all monochrome gray with pencil hatching. RIGHT HALF: the "
    "SAME kind of level, but ALIVE in saturated rainbow color where an every-color pencil has touched it: moving "
    "platforms with motion arrows, a coiled spring bouncing, a door swinging open with light, a pixel waterfall pouring, "
    "pixel flowers blooming, sparkles. On the seam in the middle: " + JADE + " swinging a big rainbow-gradient colored "
    "pencil like a magic wand, a bright rainbow stroke trailing from its tip across the seam, color spreading from it. "
    + CHARLIE + " is bouncing high on the colored spring (right side); " + RICKY + " rides a moving colored platform "
    "playing guitar (right side). In the lower-left there is one large wide flat blank gray stone block face (empty, for "
    "carved text) and in the lower-right one large wide flat blank glossy block face (empty, for text). " + PIXREF + CROP
    + NOTEXT), [R["pixel"], R["trio"]])

VOX = ("The three heroes are VOXEL figures exactly like the engine render attached (blocky characters built from small "
       "cubes, about 1:3 head-to-body, simple pixel faces), in full saturated color: Jade (long straight black hair, two "
       "pencils in a top bun, white cropped jacket with orange stripes, black crop top, baggy navy cargo pants with orange "
       "straps, white sneakers), Charlie (beige flat cap, curly dark hair, charcoal tee, jeans, brown boots, acoustic "
       "guitar), Ricky (short spiky black hair, blue-and-white vertical-striped shirt, jeans, white sneakers, wood-color "
       "electric guitar). ")
TALOS = ("Cinematic real-time 3D game render (Unreal-quality lighting on a voxel/low-poly world, The Talos Principle "
         "meets Monument Valley), volumetric light, long soft shadows, gentle bloom, shallow depth of field, 16:9 film frame. ")

P["k07"] = (NBP, TALOS + (
    "The moment just after the camera swung 90 degrees: the 2D pixel level has turned out to be one slice of a vast "
    "sunlit 3D world. GOLDEN HOUR. The whole environment is UNPAINTED: every colonnade, ruined temple, arch, staircase, "
    "cypress tree, terrace and the ground itself is matte cream plaster / white clay / pale graphite gray, like an "
    "architect's unpainted maquette, with faint pencil construction lines on some surfaces; NO green grass, no painted "
    "color anywhere in the architecture. Against it, the sky is intensely saturated (amber and rose near the low sun, deep "
    "cobalt overhead) and a saturated turquoise-cobalt sea glitters below the cliffs. Floating above the land: monumental "
    "plaster sculptures shaped like brush strokes of Chinese calligraphy. A long raised plaster causeway (the old 2D "
    "level strip, still with its brick edge) runs from the foreground deep into the scene. On the causeway, small in the "
    "lower third but clearly readable, the three heroes stand looking out in awe, warm rim-lit. " + VOX + "Only the heroes, "
    "sky and sea have color. No text."), [R["voxel"], R["trio"]])

P["k08"] = (NBP, TALOS + (
    "A ruined ancient amphitheater carved from unpainted cream plaster / white clay at the very end of golden hour, the "
    "sky deep saturated violet-to-amber, the sea glowing beyond. Stepped semicircular plaster seating, broken columns, "
    "cypresses also of white plaster. On the round stage: three hard white SPOTLIGHT cones slam down from above through "
    "atmospheric haze, each isolating one band member: Charlie on the left playing acoustic guitar, Jade in the center "
    "singing into one of her pencils like a microphone, one arm raised, Ricky on the right playing electric guitar, "
    "leaning back. For one bar they are a band on a stage. Behind the stage, a broken stone lintel/arch spanning the "
    "back wall with a long EMPTY flat dark rectangular sign panel on it (blank, for marquee light-bulb lettering added "
    "later). " + VOX + "Low camera from the seats, wide. No text."), [R["voxel"], R["trio"]])

P["k09"] = (NBP, TALOS + (
    "THE PAINT FLOOD at the peak of the rap verse: the unpainted cream-plaster world (terraces, colonnades, plaster "
    "meadow flowers, cypresses) is being flooded with color by a racing wavefront of colored-pencil hatching that sweeps "
    "diagonally across the frame from the lower-left: behind the wavefront everything is vividly colored (lush green "
    "grass, warm terracotta and ochre stone, red and blue banners, turquoise tiles, blooming flowers), ahead of it "
    "everything is still white plaster; the wavefront edge itself is a crisp band of visible rainbow pencil strokes and "
    "sparkling color. Center: Jade has just planted a giant rainbow-gradient colored pencil in the ground like a flag, "
    "the color wave radiating out from it. Around her, a DANCE BATTLE: Charlie and Ricky strike dance poses, facing cute "
    "chunky VOXEL bugs (a red ladybug, a green beetle, a pale moth, a striped caterpillar, a glowing firefly) who dance "
    "back; the firefly is turning into a lamp and the beetle into a wheel. " + VOX + "Energetic low wide angle. No text."),
    [R["voxel"], R["trio"]])

P["k10"] = (NBP, (
    "Hand-drawn COLORED-PENCIL illustration on warm toothy cream paper, exactly the drawing style of the attached "
    "character sheets (fine pencil hatching, soft colored-pencil shading, delicate line art) and the attached running "
    "illustration of the same girl: a cutscene portrait. Medium close-up (waist up) of Jade singing softly at DUSK, "
    "eyes half closed, lips gently parted mid-note, serene and sultry; she is the girl from the attached images: long "
    "straight black hair with a small top bun pierced by two pencils (one with a pink-orange eraser cap, one with a blue "
    "eraser cap), orange headphones around her neck, white cropped jacket with orange stripes (no patches), black crop "
    "top. With both hands she holds up a large sheet of paper beside her face, facing the viewer. The sheet is BACKLIT by "
    "the low dusk sun behind it, so a colorful colored-pencil drawing on its BACK shows through faintly, mirror-reversed "
    "and glowing (a little landscape with flowers and a sun); the side facing us is otherwise plain blank cream paper "
    "with nothing written on it (text will be added later). Background: soft dusk sky in violet, rose and amber pencil "
    "strokes, blank white erased paper ground fading into hatching. Lots of air, quiet mood. No text, no letters."),
    [R["jade_paper"], R["jade"], R["charlie"]])

P["k11"] = (NBP, TALOS + (
    "THE PERSPECTIVE LOCK. The world has been erased to blank white-gray paper at dusk: a vast flat pale ground scored by "
    "long smeared WHITE ERASER TRAILS, with eraser crumbs. Throughout the air float hundreds of broken graphite-gray stroke "
    "fragments (brush-stroke-shaped slabs) scattered at many depths. From this exact viewpoint, the floating fragments and "
    "the white eraser trails on the ground behind them line up perfectly into ONE COLOSSAL CHINESE CHARACTER filling the "
    "upper center of the frame: its shape, position and size must match the attached guide image (image 1) exactly. The "
    "character is IGNITING: full rainbow color races through its strokes as glowing colored-pencil hatching, light "
    "spilling from it, and color starting to pour back down into the white ground beneath it. In the lower-left "
    "foreground, seen from behind over her shoulder, Jade (voxel figure) stands on the top of a spiral sound-wave bridge, "
    "holding a pencil at arm's length like a painter measuring. On the right horizon, a MOUNTAIN-SIZED gray rubber "
    "eraser block with a sleepy-grumpy face, stopped mid-rub, looks at the glowing character in surprise. "
    "No other text."), [os.path.join(LAY, "k11.png"), R["voxel"], R["jade"]])

P["k12"] = (NBP, TALOS + (
    "DROP 2 AERIAL. The camera has rocketed straight up: a nearly top-down aerial view from very high above a vast, "
    "fully colored, sunlit voxel/low-poly world (green meadows, turquoise sea inlets, terracotta ruins, cypress groves, "
    "golden late-afternoon light with long shadows). Written across the whole landscape are FOUR COLOSSAL CHINESE "
    "CHARACTERS: each stroke is a gigantic raised causeway / terraced landform / ridge, every stroke painted a different "
    "saturated rainbow color with colored-pencil hatching texture, casting long shadows. Their shapes, positions and "
    "sizes must match the attached guide image (image 1) exactly, the same four characters left to right. Tiny heroes "
    "(three voxel figures) run along the top of the second character's strokes, with a tiny pink eraser and tiny voxel "
    "bugs following them; a few small clouds drift below the camera. No other text."),
    [os.path.join(LAY, "k12.png"), R["voxel"]])

R["vtrio"] = os.path.join(W, "refs", "voxel_trio_k08.png")
VOX2 = ("The three heroes must look EXACTLY like the voxel characters in the attached hero reference image (same blocky "
        "cube-built voxel style, same faces, outfits and instruments): Charlie with beige flat cap and ACOUSTIC guitar, Jade "
        "with long black hair, pencils in her bun, white-and-orange cropped jacket, navy cargo pants; Ricky with blue-white "
        "striped shirt and a natural-wood ELECTRIC Stratocaster guitar. ")
P["k07b"] = (NBP, TALOS + (
    "The moment just after the camera swung 90 degrees: the 2D pixel level has turned out to be one slice of a vast "
    "sunlit 3D world. GOLDEN HOUR. The whole environment is UNPAINTED: every colonnade, ruined temple, arch, staircase, "
    "cypress tree, cliff and terrace is matte cream plaster / white clay / pale graphite gray, like an architect's "
    "unpainted maquette, with faint pencil construction lines on some surfaces; no grass, no painted color in the "
    "architecture. Against it, the sky is intensely saturated (amber and rose near the low sun, deep cobalt overhead) and "
    "a saturated turquoise-cobalt sea glitters below the cliffs. Floating in the sky: a few monumental plaster sculptures "
    "each shaped like ONE single isolated calligraphy brush stroke (a long sweeping diagonal slash, a teardrop dot, a hooked "
    "stroke) - abstract single strokes only, never combined into any letter, character or symbol. A long raised plaster "
    "causeway with a brick edge (the old 2D level strip) runs from the foreground deep into the scene toward the sun. On "
    "the causeway in the lower third, the three heroes stand looking out in awe, warm rim light, long shadows. " + VOX2 +
    "Only the heroes, sky and sea have color. No text, no letters, no characters anywhere."),
    [R["vtrio"], R["voxel"]])
P["k09b"] = (NBP, TALOS + (
    "THE PAINT FLOOD at the peak of the rap verse: an unpainted cream-plaster world (terraces, colonnades, plaster meadow "
    "flowers, plaster cypresses) is being flooded with color by a racing wavefront of colored-pencil hatching that sweeps "
    "diagonally across the frame from the left: behind the wavefront everything is vividly colored (lush green grass, "
    "warm terracotta and ochre stone, red and blue banners, turquoise tiles, blooming flowers); ahead of it, on the right, "
    "everything is still pure white plaster. The wavefront edge itself is a crisp curling wave of visible rainbow pencil "
    "strokes and sparkling color. Center: Jade has just planted a giant rainbow-gradient colored pencil in the ground like "
    "a flag, color radiating from it. Around her a DANCE BATTLE: Charlie (acoustic guitar slung) and Ricky (electric "
    "guitar slung) strike big dance poses facing cute chunky VOXEL bugs (red ladybug, green beetle, pale moth, striped "
    "caterpillar, glowing firefly) who dance back; the firefly is turning into a lamp and the beetle into a wheel. " + VOX2 +
    "Energetic low wide angle. No text."), [R["vtrio"], R["voxel"]])
P["k07c"] = (NBP, (
    "Edit this image. Keep EVERYTHING exactly the same (composition, heroes, architecture, sea, sun, colors, lighting, the "
    "long diagonal floating slab on the left and the floating teardrop dot), except ONE change: the floating hooked "
    "sculpture on the upper right that looks like the number 3 must be removed and replaced by a single long, slightly "
    "curved HORIZONTAL brush-stroke slab of the same plaster material floating at the same height (a thick calligraphic "
    "horizontal stroke with a blunt start and tapered rounded end, lit by the same sunset). No text, no numbers, no letters."),
    [os.path.join(W, "raw", "k07b_v1.png")])

P["k13"] = (NBP, (
    "Re-render the FIRST attached image as a PHOTOREALISTIC aerial photograph, keeping the composition locked EXACTLY: "
    "same camera, same framing, and every shape in exactly the same position, size and outline. Shot from a high drone / "
    "satellite at golden hour with long warm shadows, real atmospheric haze, Nikon aerial photography, 8K detail. The "
    "four colossal raised strokes become REAL landscape features that follow each stroke's exact outline (the SECOND "
    "attached image is the exact stroke map: every colored shape is one stroke, keep each one's exact shape and "
    "position): terraced rice paddies in the Yuanyang style with curving water-filled terraces glinting in the sun, "
    "stone causeways and embankments edging the strokes, a river running along a stroke, groves of trees lining others. "
    "Each stroke stays clearly readable from above as a distinct band of terraces/causeway against the surrounding land "
    "(slightly raised, bordered by stone walls, its surface patterned with terraces). The surrounding land: real "
    "meadows, real forest, a real turquoise sea and coastline, real stone ruins where the toy ruins were, real clouds "
    "where the toy clouds are. Tiny people on the strokes appear only as specks/dots. No faces, no text, no voxels, no "
    "toy look: everything must look like a real photograph."),
    [os.path.join(CONC, "k12_aerial_yibiyihua.png"), os.path.join(LAY, "k12.png")])

P["k13b2"] = (NBP, (
    "Create a sharp, PHOTOREALISTIC aerial photograph (real DSLR drone photo, golden hour, long warm shadows, light "
    "haze, ultra-detailed real textures) whose composition matches the FIRST attached image exactly: that image is only "
    "a blurry low-resolution color/layout preview, so copy its layout, horizon-less top-down camera, coastline "
    "positions, sea inlets, sun glare in the top-left, cloud positions and color zones, but NOT its style. The SECOND "
    "attached image is the exact map of four giant landforms (each flat colored shape = one landform; keep each "
    "outline, position and size EXACTLY; ignore the flat colors). Each landform is a long band of real Yuanyang-style "
    "TERRACED RICE PADDIES following the shape: many thin curving terrace steps with water mirrors reflecting the "
    "golden sky, lined by stone retaining walls and a stone causeway path along its spine; along some shapes a river "
    "or a line of trees follows the edge. The terraces are vivid green and gold with silver water, clearly distinct "
    "from the surrounding land so each shape reads crisply from above. Surroundings: real meadows and forests, a real "
    "turquoise sea with surf and sandy beaches, two small real ancient stone ruins (at the ruin positions in the "
    "preview), real cumulus clouds drifting below the camera. A few tiny people appear only as specks on the "
    "causeways. Nothing toy-like, no voxels, no 3D-render look, no text."),
    [os.path.join(LAY, "k12_soft.png"), os.path.join(LAY, "k12.png")])

_REAL = ("A real aerial DRONE PHOTOGRAPH, top-down, shot at golden hour on a full-frame camera: long warm low-sun shadows, "
         "light haze, true photographic detail and color, like a National Geographic / Maxar satellite image of Yunnan. "
         "The attached image is a flat color-zone MAP that fixes the composition exactly: blue = sea, green = land, and "
         "the four tan shapes are four giant landforms whose outlines, positions and sizes must be kept EXACTLY. "
         "Each tan landform is a band of real Yuanyang-style TERRACED RICE PADDIES that fills exactly that shape: dozens "
         "of thin curving terrace steps following the shape's length, flooded paddies mirroring the golden sky, bright "
         "green and gold rice, dark earthen bunds, a stone causeway path along the spine. The shapes must contrast clearly "
         "with their surroundings so each reads crisply from above. Around them: real farmland, villages with tiny "
         "roofs, forests, a river, the real sea with surf on sandy beaches where the map is blue, a few real cumulus "
         "clouds casting shadows. Tiny people only as specks on the causeways. Strictly photographic: no 3D render, no "
         "toy or miniature look, no voxels, no extruded walls, no text.")
P["k13n"] = (NBP, _REAL, [os.path.join(LAY, "k12_zones.png")])
P["k13g"] = (GPT, _REAL + " Keep the empty margin bands at top and bottom as plain farmland.", [os.path.join(LAY, "k12_zones_32.png")])

P["k13p"] = (NBP, (
    "Redraw the attached aerial photograph as a GRAPHITE PENCIL DRAWING on warm off-white drawing paper: the "
    "'fixtures' view of the same world, a careful architect/illustrator's pencil rendering. Keep the composition "
    "EXACTLY identical, pixel-aligned: every coastline, river, road, village, tree clump, cloud and especially the four "
    "giant terraced shapes keep exactly the same outlines, positions and sizes. Monochrome graphite only (no color): "
    "crisp HB/2B contour lines on the four terraced shapes with fine curved hatching following each terrace step, "
    "softer hatching and stippling for forests and fields, the sea as light horizontal strokes, clouds left as white "
    "paper with a faint outline, shadows as cross-hatching. Visible paper grain and a few smudges. No text, no "
    "signature, no border, no color."), [os.path.join(LAY, "k13_photo_1920.png")])

P["k08b"] = (NBP, TALOS + (
    "Same world and look as the attached frames: a sunlit, UNPAINTED cream-plaster / white-clay world (ruined "
    "colonnades, cliffs, terraces) at golden hour under a saturated sky, clean and minimal like a sunlit puzzle test "
    "chamber made of plaster. Voxel heroes exactly like the attached hero reference. SCENE: a deep chasm splits the "
    "frame. On the FAR side, high on a sheer plaster cliff wall, a glowing BLUE ring-shaped portal; in the plaster FLOOR "
    "near the party on the near side, a glowing ORANGE ring-shaped portal lying flat. Both portal rings look ERASED out "
    "of the plaster: their rims are crumbly, rubbed-away eraser edges with soft smudges and little rolled eraser "
    "crumbs scattered around, glowing blue and orange from inside; through each ring you see the view out of the other. "
    "CHARLIE (beige flat cap, curly dark hair, charcoal tee, jeans, brown boots, acoustic guitar on his back) is flying "
    "mid-fling in a long arc out of the blue wall portal across the chasm, one hand holding his flat cap on, motion "
    "streaks along his arc. RICKY (blue-white striped shirt, jeans, wood-color electric Stratocaster) stands on the near "
    "side playing a sustained note; his sound wave becomes a translucent cyan HARD-LIGHT BRIDGE, a flat glowing ribbon "
    "with faint wave ripples, that runs from near Ricky into the orange floor portal and emerges from the blue wall "
    "portal across the chasm. JADE stands at the edge with her LONG BLACK HAIR FULLY DOWN and loose (no bun, nothing "
    "in her hair), white cropped jacket with orange stripes, navy cargo pants with orange straps, white sneakers; she "
    "holds a YELLOW pencil flipped around, its BLUE eraser cap pointed out toward the wall portal like a wand, the other "
    "yellow pencil (pink eraser cap) in her other hand. Only the heroes, the portal glows and the bridge have color; "
    "the world stays plaster-white. Wide cinematic three-quarter view. No logos, no text, no letters."),
    [R["vtrio"], os.path.join(W, "raw", "k07c_v1.png")])
_k08b_fix = (" IMPORTANT CHARACTER STYLE: all three heroes are blocky VOXEL figures built from visible small cubes (Minecraft-"
             "like, pixel-art faces), exactly the style of the attached heroes - NOT smooth low-poly. Ricky has SHORT SPIKY "
             "BLACK hair and a shirt with VERTICAL blue-and-white stripes. The hard-light bridge must visibly go INTO the "
             "orange floor portal and come OUT of the blue wall portal (it is not a straight beam across the chasm); Ricky "
             "stands beside the orange portal, not on it.")
P["k08b2"] = (NBP, P["k08b"][1] + _k08b_fix, [R["vtrio"], os.path.join(W, "raw", "k08_v1.png")])
P["k08b3"] = (NBP, (
    "Edit this image. Keep EVERYTHING identical (composition, lighting, Ricky, Charlie, portals, bridge, architecture) "
    "and change ONLY the girl on the right (Jade): (1) remove the small bun/top-knot and the little orange things on top "
    "of her head: her long black voxel hair hangs fully DOWN and loose, smooth top of head, nothing in her hair. (2) The "
    "yellow pencil in her RAISED hand is held reversed: its BLUE eraser cap points out toward the blue wall portal and "
    "its sharpened tip points back toward her. (3) The yellow pencil in her LOWER hand has a PINK-ORANGE eraser cap "
    "(not blue). Keep her voxel style, jacket and pants unchanged. No text."), [os.path.join(W, "raw", "k08b2_v1.png")])
P["k10b"] = (NBP, (
    "Hand-drawn COLORED-PENCIL illustration on warm toothy cream paper, in EXACTLY the drawing style and with EXACTLY "
    "the face, hair and costume of the girl in the attached character sheets (same face likeness: wide heart-shaped "
    "face, tall forehead with high centre-parted hairline, large dark eyes; black hair in a messy UPDO bun with two "
    "YELLOW pencils crossed in an X through the bun, one with a PINK-ORANGE eraser cap and one with a BLUE eraser cap; "
    "orange-and-black headphones around her neck; white cropped jacket with band collar, snap throat-tab, epaulets, "
    "zip front, an orange stripe across the chest and one small pale-blue dot on the chest; black top). A bridge "
    "cutscene at DUSK: medium close-up, waist up, she sings softly, eyes half closed, lips gently parted mid-note, "
    "serene. With BOTH hands she holds a large sheet of paper UP TOWARD THE CAMERA at chest height, slightly tilted, "
    "so we see its front clearly: a lovely colored-pencil drawing of a little landscape (hills, a sun, flowers, a "
    "river). The sheet's UPPER-RIGHT CORNER is folded forward/down toward the viewer, revealing a triangle of the "
    "BACK of the sheet: that folded triangle is plain blank cream paper with nothing on it (writing will be added "
    "later). Background: soft dusk sky in violet, rose and amber pencil strokes over blank white erased paper. Keep the "
    "lower-left area of the frame quiet and empty. No text, no letters, no lettering anywhere."),
    [os.path.join(W, "refs", "jade2_expr.png"), os.path.join(W, "refs", "jade2_turn.png"), R["charlie"]])
P["k10c"] = (NBP, (
    "Hand-drawn COLORED-PENCIL illustration on warm toothy cream paper, in EXACTLY the drawing style of the attached "
    "character sheets, and the girl must have EXACTLY the face of the attached sheets (same face shape, eyes, nose, "
    "mouth, brows, hairline - copy her likeness faithfully, do not beautify or change it). Her black hair is in a "
    "messy UPDO bun; two YELLOW pencils are stuck THROUGH the bun like hair sticks, crossing in an X whose crossing is "
    "hidden inside the bun (they do not lie on top of the hair): one pencil has a BLUE eraser cap and its sharpened tip, "
    "poking out the other side of the bun, has a RAINBOW multicolor lead; the other has a PINK-ORANGE eraser cap and a "
    "normal graphite lead. Costume exactly as the sheets: orange-and-black headphones around her neck, white cropped "
    "jacket with band collar, snap throat-tab, epaulets, zip front, an orange stripe across the chest and one small "
    "pale-blue dot on the chest, black top. A bridge cutscene at DUSK: medium close-up, waist up, she sings softly, "
    "eyes half closed, lips gently parted mid-note, serene. With BOTH hands she holds a large sheet of paper UP TOWARD "
    "THE CAMERA at chest height, slightly tilted, so we see its front clearly: a lovely colored-pencil drawing of a "
    "little landscape (hills, a sun, flowers, a river). The sheet's UPPER-LEFT CORNER is folded forward toward the "
    "viewer, revealing a LARGE triangle of the BACK of the sheet: that folded triangle is plain blank cream paper with "
    "nothing on it (writing will be added later). Background: soft dusk sky in violet, rose and amber pencil strokes "
    "over blank white erased paper. Keep the lower-left area of the frame quiet and empty. No text, no letters."),
    [os.path.join(W, "refs", "v3_paper_expr_jade.png"), os.path.join(W, "refs", "v3_paper_jade_turnaround.png")])
P["k08c"] = (NBP, TALOS + (
    "Same world, lighting and character style as the attached frames: a sunlit, UNPAINTED cream-plaster / white-clay "
    "world of ruined colonnades and cliffs at golden hour under a saturated violet-amber sky, clean like a sunlit puzzle "
    "chamber. The three heroes are blocky VOXEL figures built from visible small cubes with pixel-art faces, EXACTLY as "
    "in the attached hero reference. SCENE, a co-op puzzle that needs all three: a deep chasm crosses the frame. "
    "LEFT FOREGROUND: CHARLIE (beige flat cap, curly dark hair, charcoal tee, jeans, brown boots, acoustic guitar on his "
    "back) stands on a square plaster PRESSURE PLATE sunk into the floor, glowing faintly at its edges; a SECOND "
    "identical beige flat cap already sits on the plate beside his boots. CENTER, at the very edge of the cliff: a "
    "Talos-Principle-style CONNECTOR TRIPOD (a slender three-legged plaster-and-brass stand with a faceted crystal "
    "lens head) just planted by JADE, who stands right beside it with EMPTY hands, one hand still lifting off it; Jade "
    "has long black hair up in a bun with two YELLOW pencils stuck through the bun crossing in an X (one blue eraser "
    "cap, one pink-orange eraser cap), white cropped jacket with orange stripes, navy cargo pants with orange straps, "
    "white sneakers. RIGHT-CENTER near side: RICKY (short spiky black hair, blue-and-white vertical-striped shirt, "
    "jeans, white sneakers, natural-wood Stratocaster) leans back playing a sustained note; from his guitar a glowing "
    "COLORED sound beam (warm magenta-to-gold light with faint sine ripples, the only colored light in the world) runs "
    "into the tripod's crystal, which bends it at an angle and fires it straight across the chasm into a round crystal "
    "RECEIVER on a plinth on the far cliff. Spanning the chasm, a plaster BRIDGE shaped like ONE long calligraphy brush "
    "stroke (thick, blunt rounded start, slight wave, tapering end) is extending itself from the near side toward the "
    "far side, its leading tip still drawing with sparkling graphite dust, not yet touching the far cliff. Wide "
    "three-quarter view from slightly above. No portals, no logos, no text, no letters."),
    [R["vtrio"], os.path.join(W, "raw", "k08_v1.png")])
P["k08c2"] = (NBP, (
    "Edit this image. Keep the style, lighting, sky, architecture, Charlie on the glowing pressure plate with the second "
    "flat cap beside him, Jade at the tripod, the tripod, and the stroke-shaped bridge growing across the chasm. Fix "
    "these things: (1) RICKY must be on the NEAR side with the others (nobody has crossed yet): move him to the near "
    "cliff, standing just behind and to the right of Jade on the near ledge, leaning back playing his electric guitar; "
    "his warm magenta-gold sound beam runs from his guitar a short way INTO the tripod's crystal, and the tripod "
    "redirects it as a second beam straight ACROSS the chasm into the round crystal receiver on its plinth on the far "
    "cliff (keep that receiver; nobody stands on the far side). (2) Charlie carries exactly ONE acoustic guitar, on his "
    "back; remove the extra guitar. (3) Jade's bun has exactly TWO yellow pencils pushed through it crossing in an X, "
    "one with a blue eraser cap and one with a pink-orange cap. No text."), [os.path.join(W, "raw", "k08c_v1.png")])
P["k08c3"] = (NBP, (
    "Edit this image. Keep everything exactly the same except two fixes: (1) Charlie (left, on the glowing plate) has "
    "TWO acoustic guitars; remove the second one hanging at his right hip so he carries exactly ONE acoustic guitar "
    "slung on his back, and show his right arm and hand normally at his side. (2) Add a glowing magenta-to-gold SOUND "
    "BEAM with faint sine-wave ripples flowing from the body of Ricky's electric guitar straight into the crystal head "
    "of the tripod (same colour as the beam that leaves the tripod toward the far receiver), so the beam path reads: "
    "guitar -> tripod crystal -> far receiver. No text."), [os.path.join(W, "raw", "k08c2_v1.png")])
