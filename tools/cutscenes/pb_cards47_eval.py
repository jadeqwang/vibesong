"""v4.7 (unit v47_cards): judge a card take. Lag from the phoneme template (pb_tmplsync.py), motion (pb_motion.py), whole-frame
coherent gesture energy, and a contact sheet at the song times where the acting beats should land (mapped through the best lag).
    $OSPY tools/cutscenes/pb_cards47_eval.py TAKE.mp4 CARD FRAMING OUT_PREFIX       CARD 03|04|06, FRAMING cur|med
Writes OUT_PREFIX.sheet.jpg and OUT_PREFIX.json."""
import sys, subprocess, json, re, numpy as np, cv2
take, card, fr, outp = sys.argv[1:5]
OSPY = sys.executable; T = "/home/jade/Documents/vibesong/tools/cutscenes/"
S0 = float(sys.argv[5]) if len(sys.argv) > 5 else {"03": 19.60, "04": 48.00, "06": 142.90}[card]
CROP = {("03", "cur"): "0.05,0.0,0.55,0.65", ("03", "med"): "0.25,0.0,0.7,0.55", ("04", "cur"): "0.25,0.0,0.75,0.6",
        ("04", "med"): "0.25,0.0,0.75,0.55", ("06", "cur"): "0.05,0.0,0.55,0.65", ("06", "med"): "0.1,0.0,0.55,0.6"}[(card, fr)]
BEATS = {"03": [(20.17, "cut in"), (20.6, "because"), (21.2, "my"), (21.7, "imagi-"), (22.6, "is"), (23.3, "linked"), (23.75, "cut out")],
         "04": [(48.57, "cut in"), (48.9, "just"), (49.4, "ask"), (49.8, "my-"), (50.2, "-self"), (50.65, "cut out")],
         "06": [(143.40, "cut in"), (143.9, "just"), (144.3, "ask"), (144.7, "my-"), (145.1, "-self"), (145.45, "what"), (145.9, "is"), (146.19, "cut out")]}[card]
r = subprocess.run([OSPY, T + "pb_tmplsync.py", take, str(S0), card, CROP], capture_output=True, text=True).stdout
m = re.search(r"best lag ([+-][0-9.]+) \(r ([0-9.-]+)\)", r); lag, rr = float(m.group(1)), float(m.group(2))
labs = re.findall(r"^\s+(.+?)\s+stem .* err ([+-][0-9.]+)", r, re.M)
mo = subprocess.run([OSPY, T + "pb_motion.py", take], capture_output=True, text=True).stdout
h = re.search(r"head\s+([0-9.]+) px/s", mo); b = re.search(r"torso\s+([0-9.]+) px/s", mo)
cap = cv2.VideoCapture(take); fps = cap.get(cv2.CAP_PROP_FPS); frames = []
while True:
    ok, f = cap.read()
    if not ok: break
    frames.append(f)
# whole-frame coherent gesture energy: mean |flow| over 8x8 blocks (block-averaged so pencil boil cancels), px/s at 1080p
g = [cv2.cvtColor(cv2.resize(f, (480, 270)), cv2.COLOR_BGR2GRAY) for f in frames]; E = []
for a, c in zip(g[:-1], g[1:]):
    fl = cv2.calcOpticalFlowFarneback(a, c, None, .5, 3, 15, 3, 5, 1.2, 0); bl = fl.reshape(27, 10, 48, 10, 2).mean((1, 3))
    E.append(np.linalg.norm(bl, axis=2));
E = np.array(E); gest = float(np.percentile(E.mean(0), 90) * fps * 4)   # 90th pct block = the moving limb, 1080p px/s
tiles = []
for t, lab in BEATS:
    k = int(round((t - S0 + lag) * fps)); k = min(max(k, 0), len(frames) - 1)
    im = cv2.resize(frames[k], (427, 240)); cv2.putText(im, f"{lab} {t:.2f}", (6, 22), cv2.FONT_HERSHEY_SIMPLEX, .6, (0, 0, 255), 2); tiles.append(im)
while len(tiles) % 4: tiles.append(np.zeros_like(tiles[0]))
rows = [np.hstack(tiles[i:i + 4]) for i in range(0, len(tiles), 4)]; cv2.imwrite(outp + ".sheet.jpg", np.vstack(rows), [cv2.IMWRITE_JPEG_QUALITY, 85])
res = dict(take=take.split("/")[-1], card=card, framing=fr, lag=lag, r=rr, labials={a.strip(): float(e) for a, e in labs},
           head=float(h.group(1)) if h else None, torso=float(b.group(1)) if b else None, gesture=round(gest, 1))
json.dump(res, open(outp + ".json", "w")); print(json.dumps(res))
