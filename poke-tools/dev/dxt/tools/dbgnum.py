# 1枚の画面で、行ごとの数字の読み（いちばん似ている数字と似かた）を出す（型紙づくりの確かめ用）。dbgnum.py 型紙 画像
import sys,json
from playwright.sync_api import sync_playwright
P=json.load(open(sys.argv[1]));u='http://127.0.0.1:8766/'+sys.argv[2]
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page();pg.goto('http://127.0.0.1:8766/harness.html')
    r=pg.evaluate("""async([u,P])=>{const B=await px(u,2400);const L=dxtRead(B.p,B.W,B.H,P,true);if(!L)return null;const m=L[0];
      return {d:m.d,sure:m.sure,rows:m.rows.map(r=>({k:r.k,num:r.num,ok:r.ok,W:r.W,S:r.G?r.G.map(f=>{const s=dxtCorr(f,P.tm,P.tm2);const o=s.map((v,i)=>[v,i]).sort((a,b)=>b[0]-a[0]);return o.slice(0,2).map(x=>x[1]+':'+x[0].toFixed(2)).join(' ')}):null}))}}""",[u,P])
    print('d',r and r['d'],'sure',r and r['sure'])
    for row in (r or {}).get('rows',[]):print(row['k'],row['num'],row['ok'],row['W'] and [round(w,2) for w in row['W']],row['S'])
