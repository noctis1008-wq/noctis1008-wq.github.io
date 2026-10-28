/* 図鑑：型紙で読む（第7世代 SM・USUM 以外の作品）。作品ごとの違いは「型紙」(DXT_PROF) に書き、ここは共通。
   1) ゲーム画面の範囲（まわりの黒い余白を除いた所）を見つけ、型紙の座標（作品ごとの設計の大きさ）を画像の位置に直す
   2) 行ごとに、番号の場所の数字を1字ずつ切り出して、数字の見本 (tm) と比べる。番号は「上から1ずつ増える」ことを使って画面全体で決める
   3) 行ごとに、印の場所などの特徴（明るさ・色）を、状態の見本 (cls：捕まえた・見ただけ・見ていない) と比べる
   4) 見出しの色などから、どの図鑑の画面かを見分ける (dex) */
function dxtBox(px,W,H){
  const col=new Float32Array(W),row=new Float32Array(H);
  for(let y=0;y<H;y+=2)for(let x=0;x<W;x+=2){const i=(y*W+x)*4;if(px[i]+px[i+1]+px[i+2]>75){col[x]++;row[y]++}}
  const cx=[],cy=[];for(let x=0;x<W;x+=2)if(col[x]>H/2*.04)cx.push(x);for(let y=0;y<H;y+=2)if(row[y]>W/2*.04)cy.push(y);
  if(!cx.length||!cy.length)return null;return {x0:cx[0],y0:cy[0],x1:cx[cx.length-1]+2,y1:cy[cy.length-1]+2};
}
// ゲーム画面の候補（黒い余白で区切られた四角）。DS・3DS の録画は2画面が横や縦に並び、大きさがちがうこともあるので、
// 列ごとの上下のはし（横並び）・行ごとの左右のはし（縦並び）が変わる所で区切る
function dxtScreens(px,W,H){
  const st=Math.max(1,Math.round(Math.max(W,H)/480)),cw=Math.floor(W/st),ch=Math.floor(H/st),on=new Uint8Array(cw*ch);
  for(let y=0;y<ch;y++)for(let x=0;x<cw;x++){const i=((y*st)*W+x*st)*4;on[y*cw+x]=px[i]+px[i+1]+px[i+2]>75?1:0}
  const ext=(n,m,get)=>{const E=[];for(let a=0;a<n;a++){let c=0,lo=-1,hi=-1;for(let b=0;b<m;b++)if(get(a,b)){c++;if(lo<0)lo=b;hi=b}E.push(c>m*.08?[lo,hi]:null)}return E};
  const runs=(E,tol)=>{const R=[];let cur=null;E.forEach((e,a)=>{if(!e){cur=null;return}
      if(cur&&Math.abs(e[0]-cur.lo)<=tol&&Math.abs(e[1]-cur.hi)<=tol){cur.b=a;cur.los.push(e[0]);cur.his.push(e[1])}else{cur={a,b:a,lo:e[0],hi:e[1],los:[e[0]],his:[e[1]]};R.push(cur)}});
    const md=v=>v.slice().sort((p,q)=>p-q)[v.length>>1];return R.filter(r=>r.b-r.a>=8).map(r=>({a:r.a,b:r.b+1,lo:md(r.los),hi:md(r.his)+1}))};
  const out=[];
  for(const r of runs(ext(cw,ch,(x,y)=>on[y*cw+x]),Math.max(2,ch*.03)))out.push({x0:r.a*st,x1:r.b*st,y0:r.lo*st,y1:r.hi*st});
  for(const r of runs(ext(ch,cw,(y,x)=>on[y*cw+x]),Math.max(2,cw*.03)))out.push({x0:r.lo*st,x1:r.hi*st,y0:r.a*st,y1:r.b*st});
  return out;
}
// 型紙の画面（P.W×P.H）が、画像のどこにあるか（候補をいくつか返す。読めたものを使う）
function dxtMap(px,W,H,P){
  const a1=P.W/P.H,M=[],add=(x0,y0,w,h)=>{if(w<40||h<30||w*h<W*H*.08)return;if(M.some(m=>Math.abs(m.ox-x0)<4&&Math.abs(m.oy-y0)<4&&Math.abs(m.sx*P.W-w)<6))return;M.push({ox:x0,oy:y0,sx:w/P.W,sy:h/P.H})};
  const b=dxtBox(px,W,H);if(!b)return null;
  // 録画全体が型紙の画面と同じ形（Switch の録画など）なら、全体を画面とする（画面のはしが黒い作品でも、範囲をまちがえない）
  if(Math.abs(Math.log(W/H/a1))<.04&&(b.x1-b.x0>W*.9||b.y1-b.y0>H*.9))add(0,0,W,H);
  for(const r of [b,...dxtScreens(px,W,H)]){const w=r.x1-r.x0,h=r.y1-r.y0,ar=w/h;
    if(Math.abs(Math.log(ar/a1))<.1){add(r.x0,r.y0,w,h);continue}
    // 2つの画面が同じ高さで横に並ぶ（すき間なし）：型紙の形の幅を左はし・右はしから取る
    if(ar>a1*1.25){const ww=h*a1;add(r.x0,r.y0,ww,h);add(r.x1-ww,r.y0,ww,h)}
    if(ar<a1/1.25){const hh=w/a1;add(r.x0,r.y0,w,hh);add(r.x0,r.y1-hh,w,hh)}}
  return M.length?M:null;
}
// 型紙の座標の四角 [x0,y0,x1,y1] を、ow×oh の RGB に縮めて取り出す（2×2 の点の平均）
function dxtPatch(px,W,H,m,x0,y0,x1,y1,ow,oh){
  const o=new Float32Array(ow*oh*3),fx=(x1-x0)/ow,fy=(y1-y0)/oh;
  // （速さのため、点の位置は列ごと・行ごとに先に計算しておく。計算のしかたと結果は同じ）
  const XS=new Int32Array(ow*2),YS=new Int32Array(oh*2);
  for(let i=0;i<ow;i++){XS[i*2]=Math.round(m.ox+(x0+(i+.25)*fx)*m.sx);XS[i*2+1]=Math.round(m.ox+(x0+(i+.75)*fx)*m.sx)}
  for(let j=0;j<oh;j++){YS[j*2]=Math.round(m.oy+(y0+(j+.25)*fy)*m.sy);YS[j*2+1]=Math.round(m.oy+(y0+(j+.75)*fy)*m.sy)}
  for(let j=0;j<oh;j++)for(let i=0;i<ow;i++){let r=0,g=0,b=0,n=0;
    for(let a=0;a<2;a++){const Y=YS[j*2+a];if(Y<0||Y>=H)continue;for(let c=0;c<2;c++){const X=XS[i*2+c];
      if(X<0||X>=W)continue;const k=(Y*W+X)*4;r+=px[k];g+=px[k+1];b+=px[k+2];n++}}
    const q=(j*ow+i)*3;if(n){o[q]=r/n;o[q+1]=g/n;o[q+2]=b/n}else o[q]=o[q+1]=o[q+2]=-1}
  return o;
}
// 文字の濃さ。light：白っぽい文字（いちばん暗い色の明るさ）／dark：黒っぽい文字（暗さ）
function dxtInk(o,n,mode){const v=new Float32Array(n);
  if(mode==='best'){
    // 明るさ・赤・緑・青・あざやかさのうち、いちばんはっきり2つに分かれるもの（大津の方法の分かれ方）を使い、数の少ないほうを文字とする
    let best=-1,bc=null;
    for(let ch=0;ch<5;ch++){const c=new Float32Array(n);let k=0,mu=0;
      for(let i=0;i<n;i++){const r=o[i*3],g=o[i*3+1],b=o[i*3+2];if(r<0){c[i]=-1;continue}const mx=Math.max(r,g,b),mn=Math.min(r,g,b);
        c[i]=ch===0?(r+g+b)/3:ch===1?r:ch===2?g:ch===3?b:mx-mn;mu+=c[i];k++}
      if(!k)continue;mu/=k;let tv=0;for(let i=0;i<n;i++)if(c[i]>=0)tv+=(c[i]-mu)**2;if(tv<1)continue;
      // （速さのため、並べかえのかわりに 256 区切りの度数で数える。分け目は 5% きざみの位置）
      const hc=new Float64Array(256),hs=new Float64Array(256);for(let i=0;i<n;i++){const x=c[i];if(x<0)continue;const q=Math.min(255,Math.max(0,x|0));hc[q]++;hs[q]+=x}
      let bs=0;for(let q=1;q<20;q++){const idx=Math.floor(k*q/20);let cum=0,tb=0;for(;tb<256;tb++){cum+=hc[tb];if(cum>idx)break}
        let n0=0,s0=0;for(let z=0;z<=tb&&z<256;z++){n0+=hc[z];s0+=hs[z]}const n1=k-n0,s1=mu*k-s0;if(!n0||!n1)continue;const bv=n0*n1*(s0/n0-s1/n1)**2/k;if(bv>bs)bs=bv}
      const sc=bs/tv;if(sc>best){best=sc;bc=c}}
    if(!bc)return v;let lo=1e9,hi=-1e9;for(const x of bc)if(x>=0){lo=Math.min(lo,x);hi=Math.max(hi,x)}
    const mid=(lo+hi)/2;let up=0,k=0;for(const x of bc)if(x>=0){k++;if(x>mid)up++}const dark=up>k/2;
    for(let i=0;i<n;i++)v[i]=bc[i]<0?0:dark?hi-bc[i]:bc[i]-lo;return v}
  // （lum：明るさそのまま。地が暗く文字が明るい作品（BW）で、文字が太く見えて明るい点が半分を超えても、白黒を入れかえない）
  if(mode==='lum'){for(let i=0;i<n;i++){const r=o[i*3];v[i]=r<0?0:(o[i*3]+o[i*3+1]+o[i*3+2])/3}return v}
  if(mode==='auto'){
    // 文字の色が行で変わる作品（カーソルの行だけ白い など）：明るさで2つに分け、数の少ないほうを文字とする
    const L=new Float32Array(n);let lo=1e9,hi=-1e9;for(let i=0;i<n;i++){const r=o[i*3];L[i]=r<0?-1:(o[i*3]+o[i*3+1]+o[i*3+2])/3;if(r>=0){lo=Math.min(lo,L[i]);hi=Math.max(hi,L[i])}}
    const mid=(lo+hi)/2;let up=0,k=0;for(let i=0;i<n;i++)if(L[i]>=0){k++;if(L[i]>mid)up++}
    const dark=up>k/2;for(let i=0;i<n;i++)v[i]=L[i]<0?0:dark?255-L[i]:L[i];return v}
  for(let i=0;i<n;i++){const r=o[i*3],g=o[i*3+1],b=o[i*3+2];
  if(r<0){v[i]=0;continue}v[i]=mode==='dark'?255-Math.max(r,g,b):Math.min(r,g,b)}return v}
// 数字の場所から、1字ずつ（左から）12×16 の形にして返す。文字と地の境目は、その場所の明るさから決める（大津の方法）
function dxtGlyphs(px,W,H,m,P,yc,xo=0){
  const N=P.num,oh=32,ow=Math.max(8,Math.round((N.x1-N.x0)/(N.y1-N.y0)*oh));
  const o=dxtPatch(px,W,H,m,xo+N.x0,yc+N.y0,xo+N.x1,yc+N.y1,ow,oh),v=dxtInk(o,ow*oh,N.ink);
  let lo=1e9,hi=-1e9;for(const a of v){if(a<lo)lo=a;if(a>hi)hi=a}
  if(hi-lo<N.minC)return null;
  // 大津の方法で、文字と地を分ける
  const hist=new Float32Array(64);for(const a of v)hist[Math.min(63,Math.floor((a-lo)/(hi-lo+1e-6)*64))]++;
  let best=-1,th=32,tot=v.length,sum=0;for(let i=0;i<64;i++)sum+=i*hist[i];let wb=0,sb=0;
  for(let i=0;i<64;i++){wb+=hist[i];if(!wb)continue;const wf=tot-wb;if(!wf)break;sb+=i*hist[i];const mb=sb/wb,mf=(sum-sb)/wf,bt=wb*wf*(mb-mf)**2;if(bt>best){best=bt;th=i+.5}}
  const T=lo+th/64*(hi-lo),bin=new Uint8Array(ow*oh);let ink=0;for(let i=0;i<v.length;i++)if(v[i]>T){bin[i]=1;ink++}
  if(ink>v.length*.6)return null;
  const colOn=[];for(let x=0;x<ow;x++){let c=0;for(let y=0;y<oh;y++)c+=bin[y*ow+x];colOn.push(N.edge&&c>=oh*.9?false:N.colMin?c>Math.max(1,oh*N.colMin):c>0)} // （P.num.edge：上から下まで黒い列は、となりの本との境目なので外す） // 背景のもようの点だけの列は、文字の列にしない
  const G=[];for(let x=0;x<ow;){if(!colOn[x]){x++;continue}let e=x;while(e+1<ow&&colOn[e+1])e++;G.push([x,e]);x=e+1}
  // （P.num.split：となり合う数字がくっついて1つの形になったとき（横長）、いちばん細い所で分ける）
  if(N.split){const cc=x=>{let c=0;for(let y=0;y<oh;y++)c+=bin[y*ow+x];return c};const hgt=(a,e)=>{let y0=oh,y1=-1;for(let y=0;y<oh;y++)for(let x=a;x<=e;x++)if(bin[y*ow+x]){if(y<y0)y0=y;if(y>y1)y1=y}return y1-y0+1};
    for(let i=0;i<G.length;i++){const [a,e]=G[i],h=hgt(a,e);if(e-a+1<=h*1.2)continue;let bx=-1,bv=1e9;for(let x=Math.round(a+(e-a)*.3);x<=Math.round(a+(e-a)*.7);x++){const v=cc(x);if(v<bv){bv=v;bx=x}}
      if(bx>a&&bx<e){G.splice(i,1,[a,bx-1],[bx+1,e]);i--}}}
  const out=[];
  for(const [a,e] of G){let y0=oh,y1=-1;for(let y=0;y<oh;y++)for(let x=a;x<=e;x++)if(bin[y*ow+x]){if(y<y0)y0=y;if(y>y1)y1=y}
    if(y1-y0<oh*.35||(e-a+1)<(y1-y0+1)*.15)continue; // 点や線（「.」など）、細いすじ（行のふち）は数字ではない
    if(N.edge&&y0===0&&y1===oh-1)continue; // 切り出した範囲の上から下までつながる形は、となりとの境目の線（P.num.edge の作品だけ）
    const f=new Float32Array(12*16),gw=e-a+1,gh=y1-y0+1;
    for(let gy=0;gy<16;gy++)for(let gx=0;gx<12;gx++){let s=0,n=0;
      const xs=a+gx*gw/12,xe=a+(gx+1)*gw/12,ys=y0+gy*gh/16,ye=y0+(gy+1)*gh/16;
      for(let y=Math.floor(ys);y<Math.ceil(ye);y++)for(let x=Math.floor(xs);x<Math.ceil(xe);x++){s+=Math.max(0,v[y*ow+x]-T);n++}
      f[gy*12+gx]=n?s/n:0}
    let mu=0;for(const q of f)mu+=q;mu/=f.length;let sd=0;for(let i=0;i<f.length;i++){f[i]-=mu;sd+=f[i]*f[i]}sd=Math.sqrt(sd/f.length)||1;for(let i=0;i<f.length;i++)f[i]/=sd;
    out.push({f,w:gw/gh,x:a/ow})}
  return out.length?out:null;
}
// 数字の見本との似かた。見本が2組（うすい行・カーソルの行用の tm2）あれば、似ているほう
function dxtCorr(f,tm,tm2){const s=[];for(let d=0;d<10;d++){let b=-1;for(const T of [tm,tm2]){const t=T&&T[d];if(!t)continue;let c=0;for(let i=0;i<t.length;i++)c+=t[i]*f[i];b=Math.max(b,c/t.length)}s.push(b)}return s}
// 印などの特徴。P.feat の四角ごとに：明るさの平均・ばらつき・白い所・黒い所・あざやかさ・赤み
function dxtFeat(px,W,H,m,P,yc,learn,xo=0){
  const F=[];
  P.feat.forEach((R0,ri)=>{const R=[R0[0]+xo,R0[1],R0[2]+xo,R0[3]];const o=dxtPatch(px,W,H,m,R[0],yc+R[1],R[2],yc+R[3],16,12),n=192;let sL=0,sL2=0,wh=0,dk=0,sat=0,red=0,k=0;
    for(let i=0;i<n;i++){const r=o[i*3],g=o[i*3+1],b=o[i*3+2];if(r<0)continue;k++;const L=(r+g+b)/3,mx=Math.max(r,g,b),mn=Math.min(r,g,b);
      sL+=L;sL2+=L*L;if(mn>200)wh++;if(mx<70)dk++;sat+=(mx-mn)/(mx+1);red+=(r-Math.max(g,b))/(mx+1)}
    k=k||1;const mu=sL/k;F.push(mu/255,Math.sqrt(Math.max(0,sL2/k-mu*mu))/128,wh/k,dk/k,sat/k,red/k);
    // 形の見本（P.fref：決まった絵。「?」など）があれば、その形とどれだけ似ているか（明るさの形の相関）
    if(P.fref&&(P.fref[ri]||learn)){
      // 少し広く取り、上下左右に 4・3 マスまでずらして、いちばん似ている所を使う（一覧が少しずれて止まっても合う）
      const cw=(R[2]-R[0])/16,chh=(R[3]-R[1])/12,O=dxtPatch(px,W,H,m,R[0]-4*cw,yc+R[1]-3*chh,R[2]+4*cw,yc+R[3]+3*chh,24,18);
      const L=new Float32Array(24*18);for(let i=0;i<L.length;i++)L[i]=(O[i*3]+O[i*3+1]+O[i*3+2])/3;
      const cut=(ox,oy)=>{const g=new Float32Array(n);let a=0;for(let y=0;y<12;y++)for(let x=0;x<16;x++){const v=L[(y+oy)*24+x+ox];g[y*16+x]=v;a+=v}a/=n;let v=0;for(let i=0;i<n;i++){g[i]-=a;v+=g[i]*g[i]}v=Math.sqrt(v/n)||1;for(let i=0;i<n;i++)g[i]/=v;return g};
      if(learn)(F.P||(F.P=[]))[ri]=Array.from(cut(4,3),x=>+x.toFixed(2));
      if(P.fref[ri]){const t=P.fref[ri];let best=-1;for(let oy=0;oy<=6;oy++)for(let ox=0;ox<=8;ox++){const g=cut(ox,oy);let c=0;for(let i=0;i<n;i++)c+=g[i]*t[i];if(c/n>best)best=c/n}F.push(best)}}});
  return F;
}
// 印の状態。見本の名前が「unknown_…」（XY：いちばん上の行で、マスの上が見出しの帯にかかっている）のときは「不明」とし、
// 型紙に hint があれば、その四角（hint.r：絵のまん中。見出しの帯にかからない所）の特徴で「見ただけ／見ていない」の見込み g を付ける（印がないことは分かっている。アプリが画面の上の数と合うときだけ使う）
function dxtSt(P,F,hf){const k=dxtNear(F,P.cls),st=k.replace(/_.*$/,''),o={status:st};const h=P.hint;if(h&&hf&&st==='unknown'&&k!=='unknown')o.g=hf(h.r)[h.i]>h.t?h.hi:h.lo;return o}
// いちばん近い見本の名前（特徴は見本ごとのばらつきで割る）。遠すぎるときは 'unknown'
function dxtNear(F,C){let best=null,bd=1e9,b2=1e9;
  for(const c of C.c){let d=0;for(let i=0;i<F.length;i++){const z=(F[i]-c.m[i])/C.s[i];d+=z*z}d=Math.sqrt(d/F.length);if(d<bd){b2=bd;bd=d;best=c}else if(d<b2)b2=d}
  return best&&bd<C.max?best.k:'unknown'}
// 番号：すべての行にいちばん合う「いちばん上の番号」。行 i の番号は base+i。けた数が合わない行は減点
// pre：一覧の始めで、1番より上に空いた行がいくつまであるか（P.num.pre。RS/E はカーソルが真ん中のまま一覧が始まる）
function dxtDecode(R,maxNo,digits,pre=0){
  let best=-1e9,b2=-1e9,bb=0;const used=R.filter(r=>r.S).length;if(used<2)return null;
  for(let b=1-pre;b<=maxNo;b++){let t=0;
    for(const r of R){if(!r.S)continue;const n=b+r.k;if(n>maxNo||n<1){t-=3;continue}const s=digits?String(n).padStart(digits,'0'):String(n);
      if(s.length!==r.S.length){t-=1.5;continue}for(let j=0;j<s.length;j++)t+=r.S[j][+s[j]]}
    if(t>best){b2=best;best=t;bb=b}else if(t>b2)b2=t}
  let agree=0;R.forEach(r=>{if(!r.S)return;const n=bb+r.k,s=digits?String(n).padStart(digits,'0'):String(n);if(s.length!==r.S.length)return;
    if(r.S.every((a,j)=>a.indexOf(Math.max(...a))===+s[j]))agree++});
  // 平均は、くらべた数字の数で割る（桁数が変わる番号では、行ごとに桁数がちがう）
  let nd=0;R.forEach(r=>{if(r.S)nd+=r.S.length});
  return {base:bb,mean:best/Math.max(1,digits?used*digits:nd),margin:(best-b2)/used,used,agree};
}
// 番号が飛ぶ一覧（P.num.seq===false：SV の本棚。見ていないポケモンの本はない）は、本ごとに番号を読み、左から右へ増える本だけを使う
function dxtIndep(R,maxNo){
  const A=[];R.forEach(r=>{if(!r.S||!r.S.length)return;let s='',ok=true;for(const a of r.S){const o=a.map((v,i)=>[v,i]).sort((x,y)=>y[0]-x[0]);if(o[0][0]<.55||o[0][0]-o[1][0]<.06){ok=false;break}s+=o[0][1]}
    if(!ok||s[0]==='0')return;const n=+s;if(n>=1&&n<=maxNo)A.push({k:r.k,n})});
  // いちばん長い「増える並び」（読みまちがえた本を外す）
  const L=A.map(()=>1),pv=A.map(()=>-1);for(let i=0;i<A.length;i++)for(let j=0;j<i;j++)if(A[j].n<A[i].n&&A[i].n-A[j].n>=A[i].k-A[j].k&&L[j]+1>L[i]){L[i]=L[j]+1;pv[i]=j}
  let e=-1;L.forEach((v,i)=>{if(e<0||v>L[e])e=i});const keep=new Map();for(let i=e;i>=0;i=pv[i])keep.set(A[i].k,A[i].n);
  return {keep,used:A.length,agree:keep.size}}
const dxtSureI=D=>D.agree>=3&&D.agree*4>=D.used*3;
// 確かか：数字が決めた番号と合わない行は 1 行まで（行が 3 行以下なら全部合うこと）
const dxtSure=D=>D&&D.mean>=.45&&(D.used>=4?D.agree>=Math.max(3,D.used-1):D.agree===D.used&&D.agree>=2);
// 1枚を読む。learn：見本づくり用に、行ごとの数字の形と特徴をそのまま返す
// 番号のない一覧（P.tiles：金銀クリスタルの「しんがたずかん」）。名前の文字（8×8 の升目）を見本とくらべ、図鑑の並び（P.tiles.names）と合う位置を、画面全体で決める。
// 名前の1字は [文字の見本の番号, 濁点・半濁点（0：なし）]（-1：見本にない字。くらべない）。「ー」が5つで印がない行＝見ていない。行の左の升目に色（ボール）＝捕まえた
function dxtReadTiles(px,W,H,P){
  const Ms=dxtMap(px,W,H,P);if(!Ms)return null;const T=P.tiles,nC=T.cls.length;let out=null;
  for(const m of Ms){
    const lum=(x,y)=>{const X=Math.round(m.ox+(x+.5)*m.sx),Y=Math.round(m.oy+(y+.5)*m.sy);if(X<0||Y<0||X>=W||Y>=H)return 0;const k=(Y*W+X)*4;return (px[k]+px[k+1]+px[k+2])/3};
    const tile=(x0,y0,line)=>{const v=new Float32Array(64);for(let y=0;y<8;y++){let on=0;for(let x=0;x<8;x++){const a=lum(x0+x,y0+y);v[y*8+x]=a;if(a>128)on++}if(line&&on>=7)for(let x=0;x<8;x++)v[y*8+x]=0}
      let mu=0;for(const a of v)mu+=a;mu/=64;let n=0;for(let i=0;i<64;i++){v[i]-=mu;n+=v[i]*v[i]}n=Math.sqrt(n);if(n<200)return null;for(let i=0;i<64;i++)v[i]/=n;return v};
    const corr=(v,C)=>C.map(c=>{let s=0;for(let i=0;i<64;i++)s+=v[i]*c[i];return s});
    const am=a=>{let b=0;for(let i=1;i<a.length;i++)if(a[i]>a[b])b=i;return b};
    const R=[];
    for(let r=0;r<T.n;r++){const y=T.y0+r*T.pitch,S=[],Mk=[];
      for(let j=0;j<T.len;j++){const v=tile(T.x0+8*j,y);S.push(v?corr(v,T.cls):null);const w=tile(T.x0+8*j,y-8,true);Mk.push(w?corr(w,T.mcls):null)}
      let sat=0;for(let yy=0;yy<8;yy++)for(let xx=0;xx<8;xx++){const X=Math.round(m.ox+(T.ball+xx+.5)*m.sx),Y=Math.round(m.oy+(y+yy+.5)*m.sy);if(X<0||Y<0||X>=W||Y>=H)continue;const k=(Y*W+X)*4,a=px[k],b=px[k+1],c=px[k+2];if(Math.max(a,b,c)-Math.min(a,b,c)>80)sat++}
      const ball=sat>=10,un=!ball&&S.every(x=>x&&am(x)===T.dash&&x[T.dash]>.7);
      R.push({k:r,S,Mk,ball,un})}
    const named=R.filter(x=>!x.un&&x.S.some(Boolean));if(named.length<2)continue;
    const sc=(b,row)=>{const nm=T.names[b+row.k];if(!nm)return -9;let t=0;for(let j=0;j<T.len;j++){const e=nm[j],S=row.S[j];
      if(!e){t+=S?-.5:.3;continue}if(e[0]<0)continue;if(!S){t-=.5;continue}t+=S[e[0]];
      const M=row.Mk[j];if(e[1]>0)t+=M?.5*M[e[1]-1]:-.3;else if(e[1]===0&&M)t-=.3}return t};
    let best=-1e9,b2=-1e9,bb=0;for(let b=0;b+T.n<=T.names.length;b++){let t=0;for(const row of named)t+=sc(b,row);if(t>best){b2=best;best=t;bb=b}else if(t>b2)b2=t}
    // 行ごとの確かめ：くらべた字がほぼ全部（1字まで）いちばん似ている字と同じ行だけを使う
    const okRow=row=>{const nm=T.names[bb+row.k];if(!nm)return false;let bad=0,n=0;for(let j=0;j<T.len;j++){const e=nm[j],S=row.S[j];
      if(!e){if(S)bad++;continue}if(e[0]<0)continue;n++;if(!S||am(S)!==e[0])bad++}return n>0&&bad<=1};
    const agree=named.filter(okRow).length;
    if(!(agree>=2&&agree>=named.length-(named.length>=4?1:0)&&best-b2>1.5)){if(!out)out={fail:'num'};continue}
    return {dex:T.dex,hdr:P.hdr?dxtHdr(px,W,H,m,P):null,rows:R.filter(x=>x.un||okRow(x)).map(x=>({num:bb+x.k+1,status:x.un?'none':x.ball?'caught':'seen'}))}}
  return out||{fail:'nolist'};
}
// 印が読めなかった行（unknown）には、その行の場所 box（画像の幅・高さに対する割合 [左, 上, 右, 下]）を付ける。
// Gemini と連携しているときは、その行だけを切り出してまとめて送る（画面まるごとは送らない）
function dxtBoxOf(P,m,r,WB,HB,o){if(o.status!=='unknown')return o;
  let x0=P.num.x0,x1=P.num.x1;for(const f of P.feat){x0=Math.min(x0,f[0]);x1=Math.max(x1,f[2])}
  const h=(P.rows.pitch||60)*.6,X=x=>Math.max(0,Math.min(1,(m.ox+(x+r.xo)*m.sx)/WB)),Y=y=>Math.max(0,Math.min(1,(m.oy+y*m.sy)/HB));
  const pd=(x1-x0)*.12;o.box=[X(x0-pd),Y(r.yc-h),X(x1+pd),Y(r.yc+h)].map(v=>+v.toFixed(4));return o}
// 画面の上の数（P.hdr：SV の「捕まえた・見つけた」の数）。parts の場所ごとに字を切り出し、P.hdr.tm（0〜9 の形）と相関でくらべる。
// 字ごとに、いちばん似た形が min より似ていて、2番目と gap 以上はなれているときだけ読む（読めなければ null）
function dxtHdr(px,W,H,m,P,dk){const Hd=P.hdr;if(!Hd)return null;const tm=Hd.tm==='num'?P.tm:Hd.tm,out=[];
  // （Hd.sets：図鑑ごとの数が並ぶ画面（RS/E：ホウエン・ぜんこく）は、図鑑ごとに [捕まえた, 見つけた] の場所。d は図鑑のキー）
  for(const S of Hd.sets||[{d:null,parts:Hd.parts}]){if(S.d!=null&&dk!=null&&String(S.d)!==String(dk))continue;const v=[],TM=S.tm||tm,y0=S.y0!=null?S.y0:Hd.y0,y1=S.y1!=null?S.y1:Hd.y1,mn=S.min!=null?S.min:Hd.min,gp=S.gap!=null?S.gap:Hd.gap;
    // （写し方 m の倍率は、画面の端の見つけ方で少しずれる（1%で、上の画面の左の数は 6px ほど）。左右に少しずらしてみて、字の数がいちばん多く、字がいちばんよく合う位置で読む（端の字が切れた読み方をとらない））
    for(const p of S.parts){const y=p[2]!=null?p[2]:Hd.y;let best=null;
      for(const dx of Hd.dxs||[0,-1.5,1.5,-3,3,-4.5,4.5]){const x0=p[0]+dx,x1=p[1]+dx;
        const g=dxtGlyphs(px,W,H,m,{...P,num:{...P.num,x0,x1,y0,y1,digits:0,...(Hd.num||{}),...(S.num||{})}},y,0);if(!g||!g.length||g.length>3)continue;let s='',lo=9;
        for(const x of g){const f=x.f,n=f.length;let mu=0;for(let i=0;i<n;i++)mu+=f[i];mu/=n;let q=0;for(let i=0;i<n;i++)q+=(f[i]-mu)**2;q=Math.sqrt(q/n)||1;
          let b=-2,b2=-2,bd=-1;TM.forEach((t,d)=>{if(!t)return;let c=0;for(let i=0;i<n;i++)c+=(f[i]-mu)/q*t[i];c/=n;if(c>b){b2=b;b=c;bd=d}else if(c>b2)b2=c});
          if(b<mn||b-b2<gp){s='';break}s+=bd;lo=Math.min(lo,b)}
        if(!s||(s.length>1&&s[0]==='0'&&!Hd.lead0))continue;if(!best||s.length>best[2]||s.length===best[2]&&lo>best[1])best=[+s,lo,s.length]}
      if(!best){v.length=0;break}v.push(best[0])}
    const d=S.d!=null?S.d:dk||null;if(v.length===2&&v[1]>=v[0]&&!out.some(o=>o.d===d&&o.v[0]===v[0]&&o.v[1]===v[1]))out.push({d,v})}
  return out.length?out:null}
function dxtRead(pxB,WB,HB,P,learn){
  if(P.tiles)return learn?null:dxtReadTiles(pxB,WB,HB,P);
  const Ms=dxtMap(pxB,WB,HB,P);if(!Ms)return null;let out=null;
  for(const m of Ms){
    // 一覧の画面か（型紙の目印の場所の明るさ・色が決まった範囲にあるか）
    if(P.chk&&!P.chk.every(c=>{const v=dxtFeat(pxB,WB,HB,m,{feat:[c.slice(0,4)]},0)[c[4]];return v>=c[5]&&v<=c[6]}))continue;
    let dex=null,dexF=null,hk=null; // （hk：画面の上の数を読んでよい図鑑。見出しの形の似かたが hdr.dexMin 以上（一覧の図鑑の見分けより少しゆるく））
    // 見出しの文字の形で図鑑を見分ける（P.dex.refs：図鑑ごとの形の見本。いちばん似ていて、fmin より似ているもの）
    if(P.dex&&P.dex.refs){const F=dxtFeat(pxB,WB,HB,m,{feat:P.dex.refs.map(()=>P.dex.r),fref:P.dex.refs.map(x=>x.ref)},0);let b=-1;
      P.dex.refs.forEach((x,i)=>{const v=F[i*7+6];if(v>b){b=v;dex=x.k}});if(P.hdr&&P.hdr.dexMin&&b>=P.hdr.dexMin)hk=dex;if(!(b>=P.dex.fmin))dex=null}
    else if(P.dex){dexF=dxtFeat(pxB,WB,HB,m,{feat:[P.dex.r],fref:[P.dex.fref||null]},0,learn);if(P.dex.cls){dex=dxtNear(dexF,P.dex.cls);if(dex==='unknown')dex=null}
      // 見出しの文字の形の見本があるときは、形がはっきり同じときだけ、その図鑑とする（ほかの図鑑の画面を取りちがえない）
      if(P.dex.fref&&P.dex.fmin!=null&&!(dexF[dexF.length-1]>=P.dex.fmin))dex=null;}
    // 行の位置：一覧がなめらかに動いて途中で止まる作品（P.rows.scroll）は、行の位置を少しずつずらしてみて、数字がいちばんよく読める位置を使う
    // 行の間かくがそろわない一覧（P.rows.at：[行の中心の y, 左右のずれ] の並び。DP・Pt の図鑑は輪のように曲がった一覧）は、行ごとの位置を使う
    // マス目の作品（P.cols）は、行ごとに列を左から右へ。番号は左上から 1 ずつ増える（k ＝ 行×列の数＋列）
    const nc=P.cols?P.cols.n:1,cp=P.cols?P.cols.pitch:0;
    const rowsAt=(d,feat)=>{const R=[];const dy=P.cols&&P.cols.scroll?0:d,dx=P.cols&&P.cols.scroll?d:0;for(let r=0;r<P.rows.n;r++)for(let c=0;c<nc;c++){const at=P.rows.at&&P.rows.at[r],yc=(at?at[0]:P.rows.y0+r*P.rows.pitch)+dy,xo=dx+c*cp+(at?at[1]:0),k=r*nc+c,g=dxtGlyphs(pxB,WB,HB,m,P,yc,xo);
      const cut=P.cols&&P.cols.xmin!=null&&(P.num.x0+xo<P.cols.xmin||P.num.x1+xo>P.cols.xmax); // 一覧の端で切れた列は数字を読まない
      const S=!cut&&P.tm&&g&&(!P.num.digits||g.length===P.num.digits)?g.map(x=>P.num.one&&x.w<P.num.one?[0,1,0,0,0,0,0,0,0,0]:dxtCorr(x.f,P.tm,P.tm2)):null; // （P.num.one：細い棒だけの「1」（RS/E など）は、形をそろえると比べられないので、幅で「1」とする）
      R.push({k,yc,xo,S,G:learn?g:null,F:feat?dxtFeat(pxB,WB,HB,m,P,yc,learn,xo):null})}return R};
    let d0=0;
    // （横に流れる一覧（P.cols.scroll：SV の本棚など）は、列の位置を同じようにずらして探す）
    const scP=P.cols&&P.cols.scroll?P.cols.pitch:P.rows.scroll?P.rows.pitch:0;
    if(scP){const sc=d=>rowsAt(d,false).reduce((t,r)=>t+(P.tm?(r.S?r.S.reduce((a,x)=>a+Math.max(...x),0):0):(r.G&&r.G.length>=1&&r.G.length<=(P.num.digits||3)?1:0)),0); // 見本がまだないとき（学習の最初）は、数字らしい形が切り出せた行の数
      let best=-1;const h=scP/2;for(let d=-h;d<=h;d+=scP/12){const v=sc(d);if(v>best){best=v;d0=d}}
      for(const d of [d0-scP/24,d0+scP/24]){const v=sc(d);if(v>best){best=v;d0=d}}}
    const rows=rowsAt(d0,true);
    if(learn&&P.num.seq===false){const DI=P.tm?dxtIndep(rows,(P.dex&&P.dex.refs&&(P.dex.refs.find(x=>x.k===dex)||{}).max)||P.maxNo):null,sure=!!DI&&dxtSureI(DI);
      out=out||[];out.push({m,d:d0,dex,sure,dexF:Array.from(dexF||[]),dexP:dexF&&dexF.P&&dexF.P[0],rows:rows.map(r=>{const n=sure&&DI.keep.has(r.k)?DI.keep.get(r.k):null;return {k:r.k,num:n,ok:n!=null,G:r.G&&r.G.map(x=>Array.from(x.f)),W:r.G&&r.G.map(x=>x.w),F:Array.from(r.F),Pt:r.F.P}})});continue}
    if(learn){const DL=P.tm?dxtDecode(rows,P.maxNo,P.num.digits,P.num.pre):null,sure=DL&&dxtSure(DL);
      const okL=r=>{if(!sure||!r.S)return false;const n=DL.base+r.k,st=P.num.digits?String(n).padStart(P.num.digits,'0'):String(n);if(st.length!==r.S.length)return false;return r.S.every((a,j)=>a.indexOf(Math.max(...a))===+st[j])};
      out=out||[];out.push({m,d:d0,dex,sure,dexF:Array.from(dexF||[]),dexP:dexF&&dexF.P&&dexF.P[0],rows:rows.map(r=>({k:r.k,num:sure?DL.base+r.k:null,ok:okL(r),G:r.G&&r.G.map(x=>Array.from(x.f)),W:r.G&&r.G.map(x=>x.w),F:Array.from(r.F),Pt:r.F.P}))});continue}
    const mxNo=(P.dex&&P.dex.refs&&(P.dex.refs.find(x=>x.k===dex)||{}).max)||P.maxNo; // 図鑑ごとの最大の番号
    if(P.num.seq===false){const DI=dxtIndep(rows,mxNo);if(!dxtSureI(DI)){if(!out)out={fail:'num',dex};continue}
      return {dex,hdr:P.hdr&&(dex||hk||!P.dex)?dxtHdr(pxB,WB,HB,m,P,dex||hk):null,rows:rows.filter(r=>DI.keep.has(r.k)).map(r=>dxtBoxOf(P,m,r,WB,HB,{num:DI.keep.get(r.k),...dxtSt(P,r.F,R=>dxtFeat(pxB,WB,HB,m,{feat:[R]},r.yc,0,r.xo))}))}}
    const D=dxtDecode(rows,P.maxNo,P.num.digits,P.num.pre);
    if(!D||!dxtSure(D)){if(D&&!out)out={fail:'num',dex};continue}
    // 1行ずつの確かめ：その行の数字が、決めた番号と2けた以上合う行だけを入れる（一覧の外・はしで切れた行・読みまちがえた行は入れない）
    const okRow=r=>{if(!r.S||D.base+r.k<1)return false;const n=D.base+r.k,st=P.num.digits?String(n).padStart(P.num.digits,'0'):String(n);if(st.length!==r.S.length)return false;
      let c=0;r.S.forEach((a,j)=>{if(a.indexOf(Math.max(...a))===+st[j])c++});return c>=Math.min(2,st.length)};
    return {dex,hdr:P.hdr&&(dex||hk||!P.dex)?dxtHdr(pxB,WB,HB,m,P,dex||hk):null,rows:rows.filter(okRow).map(r=>dxtBoxOf(P,m,r,WB,HB,{num:D.base+r.k,...dxtSt(P,r.F,R=>dxtFeat(pxB,WB,HB,m,{feat:[R]},r.yc,0,r.xo))}))};
  }
  // 型紙では読めなかった画面は「省く」ではなく「読めなかった」とする（Gemini と連携していれば、Gemini に回る。カメラで斜めに撮った画面など）
  return out||(learn?null:{fail:'nolist'});
}
