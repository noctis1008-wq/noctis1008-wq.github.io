# ht.py prof hdr.json frames...  -> counts of hdr reads
import sys,json,collections
from playwright.sync_api import sync_playwright
P=json.load(open(f'/home/claude/gen/prof/{sys.argv[1]}_full.json'))
if sys.argv[2]!='-':P['hdr']=json.load(open(sys.argv[2])) if sys.argv[2].endswith('.json') else json.loads(sys.argv[2])
C=collections.Counter();bad=[]
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page();pg.goto('http://127.0.0.1:8766/harness.html')
  for u in sys.argv[3:]:
    r=pg.evaluate("""async([u,P])=>{const B=await px(u,2400);const R=dxtRead(B.p,B.W,B.H,P,false);return R?{dex:R.dex||null,hdr:R.hdr||null,n:R.rows?R.rows.length:-1}:null}""",['http://127.0.0.1:8766/'+u,P])
    k=json.dumps(r and [r["dex"],r["hdr"]]);C[(r and r['n']>0, k)]+=1

for k,v in C.most_common():print(v,k)
