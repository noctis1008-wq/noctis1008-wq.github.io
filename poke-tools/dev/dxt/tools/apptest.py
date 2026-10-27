# アプリの画面で、動画（または画像）を選ぶ流れを試し、正解表とくらべる
import sys,json,time
from playwright.sync_api import sync_playwright
game,dex,truth=sys.argv[1],sys.argv[2],json.load(open(sys.argv[3]));files=sys.argv[4:]
T=truth.get(dex,{})
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844});errs=[];pg.on('console',lambda m:print('LOG',m.text[:400]) if 'GAP' in m.text else None);pg.on('pageerror',lambda e:errs.append(str(e)[:300]))
    pg.route('**/fonts.googleapis.com/**',lambda r:r.abort());pg.route('**/generativelanguage.googleapis.com/**',lambda r:r.abort());import os
    if os.environ.get('GM'):pg.add_init_script('window.__GM=1')
    pg.goto('http://127.0.0.1:8765/poke-tools/index.html');pg.wait_for_timeout(400)
    pg.evaluate("""([g,d])=>{const o=document.getElementById('onb');if(o)o.hidden=true;document.body.classList.remove('modal');document.querySelectorAll('.sheet').forEach(x=>x.hidden=true);dxScan=null;dxCarry=null;
      S.dx.game=g;S.dx.dex[g]=d;localStorage.removeItem('ner-gemini-key');save();setView('dex');renderDex();dxShotMode='local';if(window.__GM){localStorage.setItem(GM_K,'test-key');dxShotMode='gm'}}""",[game,dex])
    t0=time.time();pg.set_input_files('#dxShotFile',files)
    pg.wait_for_function("dxScan&&(dxScan.items)||document.getElementById('dxBusy').hidden&&!dxScan",timeout=1800000);el=time.time()-t0
    rows=pg.evaluate("()=>{if(!dxScan)return null;const m=new Map(dxEntries().map(([n,s])=>[s,n]));return dxScan.items.map(([s,v])=>[m.get(s),v])}")
    st=pg.evaluate("document.getElementById('dxShotStatus').textContent");tip=pg.evaluate("dxScan&&dxScan.tip")
    if rows is None:print('読めず',st);sys.exit()
    got={str(n):v for n,v in rows};ok=sum(1 for n,v in got.items() if T.get(n)==v);bad=[(n,v,T.get(n)) for n,v in got.items() if n in T and T[n]!=v];extra=[n for n in got if n not in T]
    miss=[n for n in T if n not in got]
    print(f'{el:.0f}秒 読めた{len(got)} 正しい{ok} 誤り{len(bad)} {bad[:8]} 正解表にない{len(extra)} 読めなかった{len(miss)} | {tip}')
    import collections;c=collections.Counter(got.values());print('数',dict(c),'捕まえた',c['caught'],'見つけた(捕まえた+見ただけ)',c['caught']+c['seen'])
    print('gaps',pg.evaluate("JSON.stringify(dxScan.gaps)"));print('vt',st)
    print('errors',errs)
    allno=pg.evaluate("()=>dxEntries().map(([n,s])=>n)");print('未読の番号',[n for n in allno if str(n) not in got][:60])
