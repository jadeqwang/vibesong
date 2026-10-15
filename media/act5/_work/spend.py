import json
tot=0; rows=[]
for l in open("/home/jade/Documents/vibesong/media/genlog.jsonl"):
    d=json.loads(l)
    if str(d.get("tag","")).startswith("act5") and d.get("ok"):
        tot+=d.get("est_usd") or 0; rows.append((d["ts"],d["model"],d["tag"],d.get("est_usd")))
import os
p="/home/jade/Documents/vibesong/media/gen/spend.jsonl"
if os.path.exists(p):
    for l in open(p):
        d=json.loads(l)
        if str(d.get("tag",d.get("shot",""))).startswith("act5"): print("vgen",d)
for r in rows: print(*r)
print("ACT5 TOTAL $%.2f"%tot)
