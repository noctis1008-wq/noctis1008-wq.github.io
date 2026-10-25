import sys,json,glob
from playwright.sync_api import sync_playwright
P=json.load(open(sys.argv[1]));fs=sorted(glob.glob(sys.argv[2]+'/*.jpg'))
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page();pg.goto('http://127.0.0.1:8766/harness.html')
    r=pg.evaluate("([u,P])=>run(u,P,false)",[[ 'http://127.0.0.1:8766/'+f for f in fs],P])
json.dump(r,open(sys.argv[3],'w'))
import collections;c=collections.Counter('null' if not x['r'] else 'fail' if 'fail' in x['r'] else 'ok' for x in r);print(c)
