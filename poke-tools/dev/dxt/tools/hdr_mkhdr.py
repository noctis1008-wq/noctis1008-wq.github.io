# mkhdr.py prof hdr.json expected.json out.json frames...
#  各 part の y を ±4 の範囲で探し、録画の字の平均を見本にする（ない字は、一覧の番号の見本 P.tm が同じ字体なら使う）
import sys,json,numpy as np
from playwright.sync_api import sync_playwright
P=json.load(open(f'/home/claude/gen/prof/{sys.argv[1]}_full.json'));H=json.loads(sys.argv[2]);E=json.loads(sys.argv[3]);OUT=sys.argv[4];fr=sys.argv[5:]
nz=lambda x:(x-x.mean())/(x.std() or 1)
def glyphs(pg,x0,x1,y,dd=None):
  return pg.evaluate("""async([us,P,H,x0,x1,y,dd])=>{const o=[];for(const u of us){const B=await px(u,2400);const Ms=dxtMap(B.p,B.W,B.H,P)||[];
      const okm=Ms.filter(m=>!P.chk||P.chk.every(c=>{const v=dxtFeat(B.p,B.W,B.H,m,{feat:[c.slice(0,4)]},0)[c[4]];return v>=c[5]&&v<=c[6]}));const om=dxtMap;const okr=okm.filter(m=>{dxtMap=()=>[m];try{const R=dxtRead(B.p,B.W,B.H,P,false);return !!(R&&R.rows&&R.rows.length)}finally{dxtMap=om}});const m=okr[0];if(!m){o.push(null);continue}if(P.dex&&P.dex.refs&&H.dexMin){const F=dxtFeat(B.p,B.W,B.H,m,{feat:P.dex.refs.map(()=>P.dex.r),fref:P.dex.refs.map(x=>x.ref)},0);if(!(Math.max(...P.dex.refs.map((x,i)=>F[i*7+6]))>=H.dexMin)){o.push(null);continue}}else if(P.dex){const R=dxtRead(B.p,B.W,B.H,P,false);if(!R||!R.dex||((H.onlyDex||dd)&&String(R.dex)!==String(H.onlyDex||dd))){o.push(null);continue}}
      const g=dxtGlyphs(B.p,B.W,B.H,m,{...P,num:{...P.num,x0,x1,y0:H.y0,y1:H.y1,digits:0,...(H.num||{})}},y,0);o.push(g?g.map(x=>Array.from(x.f)):null)}return o}""",[['http://127.0.0.1:8766/'+u for u in fr],P,H,x0,x1,y,dd])
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page();pg.goto('http://127.0.0.1:8766/harness.html')
  sets=H.get('sets') or [{'parts':H['parts']}]
  PT=json.load(open(f"/home/claude/gen/prof/{H.pop('tmFrom')}_full.json")) if H.get('tmFrom') else P
  ptm=[nz(np.array(t)) if t else None for t in (PT.get('tm') or [None]*10)]
  allG={}
  for si,S in enumerate(sets):
    for pi,part in enumerate(S['parts']):
      exp=E[si][pi];best=None
      for k in range(-16,17):
        y=part[2]+k*0.25;G=glyphs(pg,part[0],part[1],y,S.get('d'))
        G=[g for g in G if g is not None] or G
        ok=[g for g in G if g and len(g)==len(exp)]
        if len(ok)<2:continue
        D={}
        for g in ok:
          for j,f in enumerate(g):D.setdefault(exp[j],[]).append(nz(np.array(f)))
        cs=[float(np.mean(x*nz(np.mean(v,0)))) for v in D.values() for x in v]
        pc=[float(np.mean(x*ptm[int(d)])) for d,v in D.items() for x in v if ptm[int(d)] is not None] if not H.get('noP') else []
        sc=(round(len(ok)/len(G),1),round(float(np.median(pc)) if pc else float(np.median(cs)),3),-abs(k))
        if best is None or sc>best[0]:best=(sc,y,k,ok)
      if not best:print('part fail',si,pi);sys.exit(1)
      part[2]=best[1];print('set',si,'part',pi,exp,'y',best[1],'frames',len(best[3]),'/',len(fr),'score',best[0])
      for g in best[3]:
        for j,f in enumerate(g):allG.setdefault(exp[j],[]).append(nz(np.array(f)))
  M={d:nz(np.mean(v,0)) for d,v in allG.items()}
  for it in range(3):
    allG={d:[x for x in v if float(np.mean(x*M[d]))>=0.8] or v for d,v in allG.items()};M={d:nz(np.mean(v,0)) for d,v in allG.items()}
  print('kept',{d:len(v) for d,v in allG.items()})
  # 一覧の番号の見本と同じ字体か
  same=[float(np.mean(M[d]*ptm[int(d)])) for d in M if ptm[int(d)] is not None]
  print('recorded digits',sorted(M),'corr with list tm',np.round(same,2))
  useP=len(same)==len(M) and float(np.median(same))>=0.85
  TM=[None]*10
  for d in range(10):
    if str(d) in M:TM[d]=M[str(d)]
    elif useP and ptm[d] is not None:TM[d]=ptm[d]
  # 自分の字の読み分け（録画の字が正しく、差があるか）
  mins=[];gaps=[]
  for d,v in allG.items():
    for x in v:
      c=[float(np.mean(x*t)) if t is not None else -2 for t in TM];o=sorted(c,reverse=True);mins.append(c[int(d)]);gaps.append(c[int(d)]-max(c[e] for e in range(10) if e!=int(d)))
  print('useListTm',useP,'have',[d for d in range(10) if TM[d] is not None],'min corr',round(min(mins),3),'min gap',round(min(gaps),3))
  H['tm']=[[round(float(v),3) for v in t] if t is not None else None for t in TM]
  json.dump(H,open(OUT,'w'))
