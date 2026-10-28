# hd.py prof hdr.json frame [mapIndex]
import sys,json
from playwright.sync_api import sync_playwright
P=json.load(open(f'/home/claude/gen/prof/{sys.argv[1]}_full.json'));H=json.loads(sys.argv[2]);P['hdr']=H
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page();pg.goto('http://127.0.0.1:8766/harness.html')
  print(json.dumps(pg.evaluate("""async([u,P,mi])=>{const B=await px(u,2400);const Ms=dxtMap(B.p,B.W,B.H,P);const Hd=P.hdr,tm=Hd.tm==='num'?P.tm:Hd.tm;const res=[];
    for(const m of Ms){const chk=!P.chk||P.chk.every(c=>{const v=dxtFeat(B.p,B.W,B.H,m,{feat:[c.slice(0,4)]},0)[c[4]];return v>=c[5]&&v<=c[6]});const o={m,chk,parts:[]};
     for(const S of Hd.sets||[{parts:Hd.parts}])for(const p of S.parts){const g=dxtGlyphs(B.p,B.W,B.H,m,{...P,num:{...P.num,x0:p[0],x1:p[1],y0:Hd.y0,y1:Hd.y1,digits:0,...(Hd.num||{})}},p[2]!=null?p[2]:Hd.y,0);
       o.parts.push(g?g.map(x=>{const f=x.f,n=f.length;const c=tm.map(t=>{if(!t)return -2;let s=0;for(let i=0;i<n;i++)s+=f[i]*t[i];return s/n});const srt=c.map((v,d)=>[v,d]).sort((a,b)=>b[0]-a[0]);return [srt[0][1],+srt[0][0].toFixed(2),+(srt[0][0]-srt[1][0]).toFixed(2),+x.w.toFixed(2)]}):null)}
     res.push(o)}return res}""",['http://127.0.0.1:8766/'+sys.argv[3],P,0])))
