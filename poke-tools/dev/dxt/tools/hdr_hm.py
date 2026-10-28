# hm.py prof frame.png out.png [xmin xmax ymin ymax]  -> profile-space image + m
import sys,json
from playwright.sync_api import sync_playwright
from PIL import Image
P=json.load(open(f'/home/claude/gen/prof/{sys.argv[1]}_full.json'));fr=sys.argv[2];out=sys.argv[3]
ext=[float(v) for v in sys.argv[4:8]] if len(sys.argv)>7 else [0,P['W'],0,P['H']]
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page();pg.goto('http://127.0.0.1:8766/harness.html')
  r=pg.evaluate("""async([u,P])=>{const B=await px(u,2400);const Ms=dxtMap(B.p,B.W,B.H,P)||[];const ok=[];for(const m of Ms){const c=!P.chk||P.chk.every(c=>{const v=dxtFeat(B.p,B.W,B.H,m,{feat:[c.slice(0,4)]},0)[c[4]];return v>=c[5]&&v<=c[6]});
     const o=dxtMap;dxtMap=()=>[m];let R=null;try{R=dxtRead(B.p,B.W,B.H,P,false)}finally{dxtMap=o}ok.push({m,c:c&&!!(R&&R.rows&&R.rows.length)})}return {W:B.W,H:B.H,ok,scale:B.s||1}}""",['http://127.0.0.1:8766/'+fr,P])
  print(json.dumps(r))
  I=Image.open(fr).convert('RGB')
  ms=[o['m'] for o in r['ok'] if o['c']] or [o['m'] for o in r['ok']]
  m=ms[0];sc=r['W']/I.width
  x0,x1,y0,y1=ext;Z=max(1,int(800/(x1-x0)))
  box=((m['ox']+x0*m['sx'])/sc,(m['oy']+y0*m['sy'])/sc,(m['ox']+x1*m['sx'])/sc,(m['oy']+y1*m['sy'])/sc)
  im=I.crop(tuple(int(v) for v in box)).resize((int((x1-x0)*Z),int((y1-y0)*Z)),Image.NEAREST);im.save(out);print('Z',Z,'box',box)
