/* ---------- 出現ずかん（NERversion） ----------
   引き継ぎ資料：topsecret/dev/ner-enc/SPEC.md（2026-11-17 に Poke tools から 移した）。下の nerReadSave / nerRandomizeWild は、そのフォルダの ner_save.js / ner_randomizer.js をそのまま入れたもの。
   表のデータ（#nerData = src/ner_data.json）は ner_species.json / ner_wild.json から作る（topsecret/dev/ner-enc/embed.py）。 */
// NERversion の .sav (128KB, フラッシュ) から出現ずかんに必要な値を読む。
// 使い方: const info = nerReadSave(arrayBuffer)
//   → { seed, otid, randomizerWild, randomizerTrainer, badges, caught:Set(全国図鑑番号), seen:Set(全国図鑑番号), counter }
// 形は pokeemerald-expansion (このハックのセーブの形) に合わせてある。オフセットは
// arm-none-eabi-gcc で offsetof を出して確かめた値 (2026-11-06, NERversion Ver.27)。
(function (root) {
  const SECTOR = 0x1000, DATA = 0xF80, SIG = 0x08012025;
  const SB1 = { vars: 5036, flags: 4736, dexSeen: 13736, dexCaught: 13865, size: 15584 };
  const DEX_BYTES = 129;
  const VAR_RANDOMIZER_SEED = 0x40A1, FLAG_WILD = 0x20, FLAG_TRAINER = 0x21, FLAG_BADGE01 = 0x867;
  function nerReadSave(buf) {
    const d = new DataView(buf instanceof ArrayBuffer ? buf : buf.buffer);
    if (d.byteLength < 0x1C000) throw new Error('セーブデータの大きさがちがいます');
    let best = null;
    for (let slot = 0; slot < 2; slot++) {
      const secs = {}; let counter = -1;
      for (let i = 0; i < 14; i++) {
        const o = slot * 0xE000 + i * SECTOR;
        if (d.getUint32(o + 0xFF8, true) !== SIG) continue;
        const id = d.getUint16(o + 0xFF4, true);
        secs[id] = o; counter = Math.max(counter, d.getUint32(o + 0xFFC, true));
      }
      if (Object.keys(secs).length === 14 && (!best || counter > best.counter)) best = { secs, counter };
    }
    if (!best) throw new Error('ポケモン エメラルドの セーブデータとして 読めませんでした');
    const bytes = new Uint8Array(d.buffer, d.byteOffset, d.byteLength);
    const sb2 = bytes.subarray(best.secs[0], best.secs[0] + DATA);
    const sb1 = new Uint8Array(DATA * 4);
    for (let k = 0; k < 4; k++) sb1.set(bytes.subarray(best.secs[k + 1], best.secs[k + 1] + DATA), k * DATA);
    const v1 = new DataView(sb1.buffer);
    const flag = n => (sb1[SB1.flags + (n >> 3)] >> (n & 7)) & 1;
    const otid = new DataView(sb2.buffer, sb2.byteOffset).getUint32(10, true);
    const varSeed = v1.getUint16(SB1.vars + (VAR_RANDOMIZER_SEED - 0x4000) * 2, true);
    const bitsToSet = off => { const s = new Set(); for (let i = 0; i < DEX_BYTES * 8; i++) if ((sb1[off + (i >> 3)] >> (i & 7)) & 1) s.add(i + 1); return s; };
    let badges = 0; for (let i = 0; i < 8; i++) badges += flag(FLAG_BADGE01 + i);
    return {
      counter: best.counter, otid, varSeed,
      seed: varSeed !== 0 ? varSeed : otid,   // Randomizer_GetSeed と同じ
      randomizerWild: !!flag(FLAG_WILD), randomizerTrainer: !!flag(FLAG_TRAINER), badges,
      caught: bitsToSet(SB1.dexCaught), seen: bitsToSet(SB1.dexSeen),
    };
  }
  root.nerReadSave = nerReadSave;
  if (typeof module !== 'undefined') module.exports = { nerReadSave };
})(typeof window !== 'undefined' ? window : globalThis);

// NERversion のランダマイザ (src/random_mon_generation.c の Randomizer_PickSpecies) を JS に移したもの。
// 使い方: const sp = nerRandomizeWild(origSpecies, mapGroup, mapNum, seed, SPECIES)
//   seed: セーブの VAR_RANDOMIZER_SEED (0x40A1)。0 ならトレーナーID (SaveBlock2.playerTrainerId の 4 バイト, little endian, u32)
//   SPECIES: ner_species.json の species 配列 (index = 種族ID)
(function (root) {
  const u32 = x => x >>> 0;
  const mul = (a, b) => Math.imul(a, b) >>> 0;
  function mix(x) {
    x = u32(x);
    x = u32(x ^ (x >>> 16)); x = mul(x, 0x85EBCA6B);
    x = u32(x ^ (x >>> 13)); x = mul(x, 0xC2B2AE35);
    x = u32(x ^ (x >>> 16));
    return x;
  }
  // SFC32 (src/random.c, STREAM1 = 1)
  function seedRng(seed) {
    const st = { a: 0, b: 0, c: u32(seed), ctr: 1 };
    for (let i = 0; i < 16; i++) next(st, 1);
    return st;
  }
  function next(st, stream = 1) {
    const result = u32(st.a + st.b + st.ctr);
    st.ctr = u32(st.ctr + stream);
    st.a = u32(st.b ^ (st.b >>> 9));
    st.b = mul(st.c, 9);
    st.c = u32(result + u32((st.c << 21) | (st.c >>> 11)));
    return result;
  }
  const LENIENCY = [100, 200, 1000], TRIES = 400; // NERversion Ver.32 から ±100 で はじめる
  function pickSpecies(original, salt, seed, SP) {
    const n = SP.length; // NUM_SPECIES
    if (original === 0 || original >= n || !SP[original].e) return original;
    const st = seedRng(mix(u32(seed) ^ mix(u32(mul(salt, 0x9E3779B9) + original))));
    const bst = SP[original].b;
    for (const len of LENIENCY) {
      const lo = bst > len ? bst - len : 0, hi = bst + len;
      for (let i = 0; i < TRIES; i++) {
        const cand = (next(st) % (n - 1)) + 1;
        const c = SP[cand];
        if (!c.c) continue;                 // 有効・基本の姿・全国図鑑番号あり
        if (c.b < lo || c.b > hi) continue; // 合計種族値の幅
        if (!c.t) return cand;              // フォルム表なし (乱数を使わない)
        if (c.f.length === 0) continue;
        return c.f[next(st) % c.f.length];
      }
    }
    return original;
  }
  function nerRandomizeWild(original, mapGroup, mapNum, seed, SP) {
    return pickSpecies(original, ((mapGroup << 8) | mapNum) >>> 0, seed, SP);
  }
  root.nerRandomizeWild = nerRandomizeWild;
  root.nerRandomizeTrainer = (original, seed, SP) => pickSpecies(original, 0xFFFF0000, seed, SP);
  if (typeof module !== 'undefined') module.exports = { nerRandomizeWild, nerRandomizeTrainer: root.nerRandomizeTrainer };
})(typeof window !== 'undefined' ? window : globalThis);

let NER_DB=null;
function nerDb(){
  if(NER_DB)return NER_DB;
  const raw=JSON.parse(document.getElementById('nerData').textContent);
  const SP=raw.sp.map(x=>x?{e:x[0],c:x[1],t:x[2],b:x[3],d:x[4],f:x[5],n:x[6]}:{e:0,c:0,t:0,b:0,d:0,f:[],n:''});
  const base=new Map();SP.forEach((x,i)=>x.f.forEach(f=>{if(!base.has(f))base.set(f,i)}));
  return NER_DB={SP,maps:raw.maps,base};
}
// 種族ID → 全国図鑑番号・名前・すがた違いか（フォルムの表にしか無い ID は、もとのポケモンの番号と名前を使う）
function nerSpInfo(x){
  const {SP,base}=nerDb();let o=SP[x]||SP[0];
  let d=o.d,n=o.n;if((!d||!n)&&base.has(x)){const b=SP[base.get(x)];d=d||b.d;n=n||b.n}
  return {d,n:n||'？',form:x!==d};
}
const NER_M={land:'くさむら・どうくつ',surf:'なみのり',dive:'ダイビング',rock:'いわくだき',old_rod:'ボロのつりざお',good_rod:'いいつりざお',super_rod:'すごいつりざお',feebas:'きまった6マスでつり'};
const NER_MO=['land','surf','dive','rock','old_rod','good_rod','super_rod','feebas'];
const nerHex=set=>{const b=new Uint8Array(129);set.forEach(n=>{if(n>=1&&n<=1032)b[(n-1)>>3]|=1<<((n-1)&7)});return Array.from(b,v=>v.toString(16).padStart(2,'0')).join('')};
const nerUnhex=h=>{const s=new Set();if(typeof h!=='string')return s;for(let i=0;i<h.length/2;i++){const v=parseInt(h.substr(i*2,2),16)||0;for(let k=0;k<8;k++)if(v>>k&1)s.add(i*8+k+1)}return s};
function nerNorm(){
  const n=S.ner&&typeof S.ner==='object'?S.ner:{};
  S.ner=Object.assign({tab:'mon',f:'all'},n);
  if(!['mon','pl','miss'].includes(S.ner.tab))S.ner.tab='mon';
  if(!['all','todo','unseen'].includes(S.ner.f))S.ner.f='all';
}
nerNorm();
let nerCache=null,nerQ='';
// ばしょごと・出し方ごとに、入れかえ後の種族でまとめる（%は足す・Lvは最小〜最大）
function nerCalc(){
  const sv=S.ner.sv;if(!sv)return null;
  const key=`${sv.seed}|${sv.rw?1:0}`;if(nerCache&&nerCache.key===key)return nerCache;
  const {SP,maps}=nerDb(),rnd=o=>sv.rw?nerRandomizeWild(o,m.g,m.n,sv.seed,SP):o;let m;
  const places=[],mons=new Map();
  maps.forEach((mp,pi)=>{
    m=mp;const pl={i:pi,name:mp.name,sub:mp.sub||'',groups:[]};
    const add=(meth,o,lo,hi,p)=>{
      const x=rnd(o);let g=pl.groups.find(g=>g.m===meth);if(!g){g={m:meth,rows:[]};pl.groups.push(g)}
      let r=g.rows.find(r=>r.x===x);if(!r){r={x,lo,hi,p:0};g.rows.push(r)}
      r.lo=Math.min(r.lo,lo);r.hi=Math.max(r.hi,hi);r.p+=p;
    };
    mp.methods.forEach(t=>t.rows.forEach(r=>add(t.type==='fish'?r[4]:t.type,r[0],r[1],r[2],r[3])));
    if(mp.feebas)add('feebas',mp.feebas.orig,mp.feebas.lo,mp.feebas.hi,mp.feebas.pct);
    pl.groups.sort((a,b)=>NER_MO.indexOf(a.m)-NER_MO.indexOf(b.m));
    pl.groups.forEach(g=>{g.rows.sort((a,b)=>b.p-a.p||a.x-b.x);g.rows.forEach(r=>{
      let e=mons.get(r.x);if(!e){const I=nerSpInfo(r.x);e={x:r.x,d:I.d,n:I.n,form:I.form,list:[]};mons.set(r.x,e)}
      e.list.push({pl,m:g.m,lo:r.lo,hi:r.hi,p:r.p});
    })});
    places.push(pl);
  });
  const ml=[...mons.values()].sort((a,b)=>a.d-b.d||a.x-b.x);
  return nerCache={key,places,mons:ml};
}
// 出ないポケモン：野生で出ず、野生で出るポケモンの進化・タマゴ（同じ進化のなかま）でも手に入らないもの。交換・配布は考えない
const NER_UB=new Set([793,794,795,796,797,798,799,803,804,805,806]);
const NER_PDX=new Set([984,985,986,987,988,989,990,991,992,993,994,995,1005,1006,1009,1010,1020,1021,1022,1023]);
const NER_MNOTE={151:'配布チケットがいる',249:'配布チケットがいる',250:'配布チケットがいる',386:'配布チケットがいる',377:'イベントで1回だけ会える',378:'イベントで1回だけ会える',379:'イベントで1回だけ会える',382:'イベントで1回だけ会える',383:'イベントで1回だけ会える',384:'イベントで1回だけ会える',380:'殿堂入りの後、どちらか1匹',381:'殿堂入りの後、どちらか1匹',345:'化石からどちらか1匹',346:'化石からどちらか1匹',347:'化石からどちらか1匹',348:'化石からどちらか1匹'};
[252,253,254,255,256,257,258,259,260].forEach(d=>NER_MNOTE[d]='さいしょの1匹のなかまだけ');
[152,153,154,155,156,157,158,159,160].forEach(d=>NER_MNOTE[d]='全国図鑑の後、博士から1匹');
const nerRoot=d=>{let r=d,k=0;while(SPDB[r-1]&&SPDB[r-1][5]&&k++<5)r=SPDB[r-1][5];return r};
function nerMiss(C){
  if(C.miss)return C.miss;
  const wild=new Set(C.mons.map(e=>e.d)),roots=new Set([...wild].map(nerRoot));
  let evo=0;const leg=[],norm=[];
  SPDB.forEach((r,i)=>{const d=i+1;if(wild.has(d))return;if(roots.has(nerRoot(d))){evo++;return}
    const o={d,n:r[0],tag:NER_UB.has(d)?'UB':NER_PDX.has(d)?'パラドックス':'',note:NER_MNOTE[d]||''};(r[4]&7?leg:norm).push(o)});
  return C.miss={wild:wild.size,evo,leg,norm,total:SPDB.length};
}
const nerPlName=pl=>pl.name+(pl.sub?' '+pl.sub:'');
const NER_ST={ok:'つかまえた',cond:'みた',no:'みていない'};
const nerStOf=d=>{const sv=S.ner.sv;return sv._c.has(d)?'ok':sv._s.has(d)?'cond':'no'};
const nerSt=s=>`<span class="egx-st ${s}"><svg viewBox="0 0 24 24" aria-hidden="true">${EG_ST_IC[s]}</svg>${NER_ST[s]}</span>`;
const nerLv=(a,b)=>a===b?`Lv.${a}`:`Lv.${a}–${b}`;
const nerPass=(s,f)=>f==='all'||(f==='todo'&&s!=='ok')||(f==='unseen'&&s==='no');
function nerFmtAt(t){const d=new Date(t);return isNaN(d)?'':`${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`}
function renderNer(){
  const sv=S.ner.sv;
  if(sv&&!(sv._c instanceof Set)){sv._c=nerUnhex(sv.c);sv._s=nerUnhex(sv.s)}
  document.getElementById('nerSub1').textContent=sv?`つかまえた ${sv._c.size}・みた ${sv._s.size}`:'まだ読みこんでいません';
  document.getElementById('nerSub2').textContent=sv?`ランダマイザ ${sv.rw?'ON':'OFF'}・${nerFmtAt(sv.at)}`:'.sav を選んでください';
  document.querySelectorAll('#nerTabs [data-nertab]').forEach(b=>b.setAttribute('aria-selected',b.dataset.nertab===S.ner.tab));
  document.querySelectorAll('#vNer [data-nerf]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.nerf===S.ner.f));
  const qx=document.getElementById('nerQx');qx.hidden=!nerQ;
  const list=document.getElementById('nerList'),cnt=document.getElementById('nerCount');
  const C=nerCalc();
  if(!C){
    ['nerTMon','nerTPl','nerNAll','nerNTodo','nerNUnseen'].forEach(id=>document.getElementById(id).textContent='');
    cnt.textContent='';
    list.innerHTML='<div class="nex-empty"><b>セーブを読みこんでください</b>上の「読みこむ」から、NERversion の .sav を選びます。</div>';
    return;
  }
  const q=kata(nerQ.trim()),hit=t=>!q||kata(t).includes(q);
  document.getElementById('nerTMon').textContent=`${C.mons.length}しゅるい`;
  document.getElementById('nerTPl').textContent=`${C.places.length}か所`;
  const MS=nerMiss(C);document.getElementById('nerTMiss').textContent=`${MS.leg.length+MS.norm.length}しゅるい`;
  // 件数：検索に合うポケモンの数（つかまえた・みた で分ける）
  const n={all:0,todo:0,unseen:0};
  const monRows=C.mons.map(e=>{const st=nerStOf(e.d),byName=hit(e.n);const rows=byName?e.list:e.list.filter(r=>hit(nerPlName(r.pl)));return {e,st,rows}}).filter(o=>o.rows.length);
  const missRows=S.ner.tab==='miss'?[...MS.leg,...MS.norm].filter(o=>hit(o.n)).map(o=>({o,st:nerStOf(o.d)})):null;
  (missRows||monRows).forEach(o=>{n.all++;if(o.st!=='ok')n.todo++;if(o.st==='no')n.unseen++});
  document.getElementById('nerNAll').textContent=n.all;document.getElementById('nerNTodo').textContent=n.todo;document.getElementById('nerNUnseen').textContent=n.unseen;
  const f=S.ner.f;let h='',shown=0;
  if(S.ner.tab==='mon'){
    monRows.filter(o=>nerPass(o.st,f)).forEach(({e,st,rows})=>{shown++;
      h+=`<div class="nex-card"><div class="nex-hd"><span class="nex-no">${String(e.d).padStart(3,'0')}</span><span class="nex-nm">${esc(e.n)}</span>${e.form?'<span class="nex-fm">すがた違い</span>':''}${nerSt(st)}</div>`+
        rows.map(r=>`<div class="nex-r"><span class="nex-l"><b>${esc(r.pl.name)}</b><small>${r.pl.sub?esc(r.pl.sub)+'・':''}${NER_M[r.m]}</small></span><span class="nex-v"><b>${r.p}%</b><small>${nerLv(r.lo,r.hi)}</small></span></div>`).join('')+'</div>';
    });
    cnt.textContent=`${shown}しゅるいを表示`;
  }else if(S.ner.tab==='pl'){
    C.places.forEach(pl=>{
      const byPl=hit(nerPlName(pl));let body='',rowsN=0;
      pl.groups.forEach(g=>{
        const rs=g.rows.map(r=>({r,I:nerSpInfo(r.x)})).filter(({r,I})=>(byPl||hit(I.n))&&nerPass(nerStOf(I.d),f));
        if(!rs.length)return;rowsN+=rs.length;
        body+=`<div class="nex-mh">${NER_M[g.m]}</div>`+rs.map(({r,I})=>`<div class="nex-r"><span class="nex-l"><span class="nm"><b>${esc(I.n)}</b>${nerSt(nerStOf(I.d))}</span><small>No.${String(I.d).padStart(3,'0')}${I.form?'・すがた違い':''}</small></span><span class="nex-v"><b>${r.p}%</b><small>${nerLv(r.lo,r.hi)}</small></span></div>`).join('');
      });
      if(!rowsN)return;shown++;
      h+=`<div class="nex-card"><div class="nex-hd"><span class="nex-pn">${esc(nerPlName(pl))}</span></div>${body}</div>`;
    });
    cnt.textContent=`${shown}か所を表示`;
  }else{
    const show=new Set(missRows.filter(o=>nerPass(o.st,f)).map(o=>o.o));
    h+=`<div class="nex-sum"><span>全国図鑑 <b>${MS.total}</b></span><span>野生で出る <b>${MS.wild}</b></span><span>進化・タマゴで手に入る <b>${MS.evo}</b></span><span>出ない <b>${MS.leg.length+MS.norm.length}</b></span></div>`;
    const sec=(t,desc,arr)=>{const rs=arr.filter(o=>show.has(o));if(!rs.length)return;shown+=rs.length;
      h+=`<div class="nex-card"><div class="nex-hd"><span class="nex-pn">${t}</span><span class="nex-no">${rs.length}しゅるい</span></div><div class="nex-gd">${desc}</div>`+
        rs.map(o=>`<div class="nex-r"><span class="nex-l"><span class="nm"><b>${esc(o.n)}</b>${o.tag?`<span class="nex-tag">${o.tag}</span>`:''}</span><small${o.note?' class="ev"':''}>No.${String(o.d).padStart(3,'0')}${o.note?'・'+esc(o.note):''}</small></span>${nerSt(nerStOf(o.d))}</div>`).join('')+'</div>'};
    sec('伝説・幻','準伝説もふくみます。緑の字があるものは、ゲームのイベントなどで手に入ります。',MS.leg);
    sec('ふつうのポケモン','UB・パラドックスポケモンもここに入れて、印をつけています。',MS.norm);
    cnt.textContent=`${shown}しゅるいを表示`;
  }
  list.innerHTML=h||'<div class="nex-empty"><b>見つかりません</b>検索のことばや、「すべて / 未捕獲 / 未発見」を変えてみてください。</div>';
}
document.getElementById('nerLoad').addEventListener('click',()=>document.getElementById('nerFile').click());
document.getElementById('nerFile').addEventListener('change',async e=>{
  const fl=e.target.files&&e.target.files[0];e.target.value='';if(!fl)return;
  let info;try{info=nerReadSave(await fl.arrayBuffer())}catch(err){toast((err&&err.message)||'セーブデータを読めませんでした',4000);return}
  // セーブそのものは保存しない。入れかえの番号・つかまえた/みた・バッジ数・読みこんだ日時だけ（新しく読んだら上書き）
  S.ner.sv={seed:info.seed>>>0,rw:!!info.randomizerWild,badges:info.badges|0,c:nerHex(info.caught),s:nerHex(info.seen),at:Date.now()};
  nerCache=null;save();renderNer();
  toast(`読みこみました（つかまえた ${info.caught.size}・みた ${info.seen.size}）`);
});
document.getElementById('nerTabs').addEventListener('click',e=>{const b=e.target.closest('[data-nertab]');if(!b)return;S.ner.tab=b.dataset.nertab;save();renderNer();window.scrollTo(0,0)});
document.getElementById('vNer').addEventListener('click',e=>{
  const b=e.target.closest('[data-nerf]');if(b){S.ner.f=b.dataset.nerf;save();renderNer();return}
  if(e.target.closest('#nerQx')){nerQ='';const i=document.getElementById('nerQ');i.value='';renderNer();i.focus()}
});
document.getElementById('nerQ').addEventListener('input',e=>{nerQ=e.target.value;renderNer()});
