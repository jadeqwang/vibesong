import concurrent.futures as cf_, canonfix as c
with cf_.ThreadPoolExecutor(4) as ex:
    fs=[ex.submit(c.run,k) for k in ("k04","k06","k08b")]+[ex.submit(c.run_cur,"k09")]
    for f in fs: print(f.result())
