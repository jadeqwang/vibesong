import sys, concurrent.futures as cf_
from prompts import P
from common import gen
keys = sys.argv[1:]
with cf_.ThreadPoolExecutor(6) as ex:
    futs = {ex.submit(gen, k, *P[k]): k for k in keys}
    for f in cf_.as_completed(futs):
        try: f.result()
        except Exception as e: print(futs[f], "ERR", e)
