import sys,json
from playwright.sync_api import sync_playwright
P=json.load(open(sys.argv[1]));u='http://127.0.0.1:8766/'+sys.argv[2]
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page();pg.goto('http://127.0.0.1:8766/harness.html')
    print(pg.evaluate("""async([u,P])=>{const B=await px(u,2400);const m=dxtMap(B.p,B.W,B.H,P)[+(P._mi||0)];const out={m,box:dxtBox(B.p,B.W,B.H)};out.rows=[];
      for(let k=0;k<P.rows.n;k++){const yc=P.rows.y0+k*P.rows.pitch,N=P.num,oh=32,ow=Math.round((N.x1-N.x0)/(N.y1-N.y0)*oh);
        const o=dxtPatch(B.p,B.W,B.H,m,N.x0,yc+N.y0,N.x1,yc+N.y1,ow,oh),v=dxtInk(o,ow*oh,N.ink);let lo=1e9,hi=-1e9;for(const a of v){lo=Math.min(lo,a);hi=Math.max(hi,a)}
        const g=dxtGlyphs(B.p,B.W,B.H,m,P,yc);out.rows.push([lo|0,hi|0,g?g.map(x=>x.w.toFixed(2)):null])}
      return out}""",[u,P]))
