import sys,json,glob
from playwright.sync_api import sync_playwright
prof,d,out=sys.argv[1],sys.argv[2],sys.argv[3]
P=json.load(open(prof));fs=sorted(glob.glob(d+'/*.jpg'))
import os
tmf=prof.replace('.json','_tm.json')
if 'tm' not in P and os.path.exists(tmf) and (P['rows'].get('scroll') or P.get('cols',{}).get('scroll')):T=json.load(open(tmf));P['tm']=[T.get(str(i)) for i in range(10)] # 行の位置さがしに使う
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page();pg.goto('http://127.0.0.1:8766/harness.html')
    r=pg.evaluate("([u,P])=>run(u,P,true)",[[ 'http://127.0.0.1:8766/'+f for f in fs],P])
dg=P['num'].get('digits',3)
for f in r:
  if f['r']:f['r']=sorted(f['r'],key=lambda m:-sum(1 for row in m['rows'] if row['G'] and (not dg or len(row['G'])==dg)))[:1]
json.dump(r,open(out,'w'));print(len(r))
