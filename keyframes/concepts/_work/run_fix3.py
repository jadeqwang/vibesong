import concurrent.futures as cf_, canonfix as c
with cf_.ThreadPoolExecutor(2) as ex:
    fs=[ex.submit(c.run,"k08b3"), ex.submit(c.run_cur,"k09b")]
    for f in fs: print(f.result())
