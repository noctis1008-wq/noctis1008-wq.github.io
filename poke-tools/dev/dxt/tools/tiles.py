# 番号のない一覧（金銀クリスタルの「しんがたずかん」）の型紙を作る（P.tiles）。
# tiles.py 止まった画面の場所 図鑑の並び.json 出力_full.json ox,oy,sx,sy
#  図鑑の並び.json：{"sp":[種類の番号…],"names":[カタカナの名前…]}（アプリの DEXN と SPDB から作る。ジョウト図鑑の順）
#  1枚目の画面は一覧のいちばん上（001 から）であること。そこで覚えた字で次の画面の位置を決め、字を覚え足していく
import sys,json,glob,unicodedata,collections
import numpy as np
from PIL import Image
OX,OY,SX,SY=[float(x) for x in sys.argv[4].split(',')] # 録画の中の GBC の画面の左上と 1 ドットの大きさ（例 422,75,6.725,6.722）
def grid(path):
  im=np.array(Image.open(path).convert('RGB')).astype(int)
  xs=(OX+(np.arange(160)+.5)*SX).astype(int);ys=(OY+(np.arange(144)+.5)*SY).astype(int)
  return im[ys][:,xs]  # 144x160x3
def tiles(g):
  L=g.mean(2);B=(L>128).astype(np.uint8)
  rows=[]
  for r in range(7):
    ty=2+2*r
    base=[B[ty*8:ty*8+8,c*8:c*8+8] for c in range(11,17)]
    mark=[B[ty*8-8:ty*8,c*8:c*8+8] for c in range(11,17)]
    ball=g[ty*8:ty*8+8,80:88]
    rows.append((base,mark,ball))
  return rows
def key(t):return ''.join(map(str,t.flatten()))

J=json.load(open(sys.argv[2]));N=J['names']
def dec(nm):
  out=[]
  for ch in nm:
    d=unicodedata.normalize('NFD',ch);out.append((d[0],d[1:] or ''))
  return out
ND=[dec(n) for n in N]
fs=sorted(glob.glob(sys.argv[1]+'/*.jpg'))
def mk(t):
  t=t.copy()
  for y in range(8):
    if t[y].sum()>=7:t[y]=0
  t[:,7]=0 if t[:,7].sum()>=7 else t[:,7]
  return key(t)
F=[]
for f in fs:
  g=grid(f);R=tiles(g);rows=[]
  for b,m,ball in R:
    bk=[key(t) for t in b[:5]];mm=[mk(t) for t in m[:5]];hb=int((ball[...,0]>150).sum())
    rows.append((bk,mm,hb))
  F.append(rows)
Z='0'*64
DASH=F[0][1][0][0]
D={Z:' '};M={Z:''}
def score(rows,b):
  s=0;n=0
  for k,(bk,mm,hb) in enumerate(rows):
    if all(x==DASH for x in bk) and hb<10:continue
    i=b+k
    if i>=len(N):return -99
    nm=ND[i]+[(' ','')]*(5-len(ND[i]))
    for j in range(5):
      if bk[j] in D:s+=1 if D[bk[j]]==nm[j][0] else -2;n+=1
      if bk[j]!=Z and mm[j] in M:s+=1 if M[mm[j]]==nm[j][1] else -2
  return s
def learn(rows,b):
  for k,(bk,mm,hb) in enumerate(rows):
    if all(x==DASH for x in bk) and hb<10:continue
    nm=ND[b+k]+[(' ','')]*(5-len(ND[b+k]))
    for j in range(5):
      D.setdefault(bk[j],nm[j][0]);
      if bk[j]!=Z:M.setdefault(mm[j],nm[j][1])
learn(F[0],0)
B=[None]*len(F);B[0]=0
for it in range(3):
  for i,rows in enumerate(F):
    sc=sorted(((score(rows,b),b) for b in range(len(N)-6)),reverse=True)
    if sc[0][0]>=3 and sc[0][0]-sc[1][0]>=3:B[i]=sc[0][1];learn(rows,B[i])

OXr,OYr=OX,OY
def lumgrid(path):
  g=grid(path);return g.mean(2)
acc=collections.defaultdict(list);macc=collections.defaultdict(list);sat=collections.defaultdict(list)
for fi,(f,b) in enumerate(zip(fs,B)):
  L=lumgrid(f);g=grid(f)
  rows=F[fi]
  for k,(bk,mm,hb) in enumerate(rows):
    un=all(x==DASH for x in bk) and hb<10
    ty=16+16*k
    bt=g[ty:ty+8,80:88].astype(int);s=int(((bt.max(2)-bt.min(2))>80).sum())
    if un:sat['none'].append(s);continue
    nm=ND[b+k]+[(' ','')]*(5-len(ND[b+k]))
    sat['ball' if hb>=20 else 'noball'].append(s)
    for j in range(5):
      t=L[ty:ty+8,88+8*j:96+8*j]
      if nm[j][0]!=' ':acc[nm[j][0]].append(t)
      if nm[j][1]:
        mt=L[ty-8:ty,88+8*j:96+8*j].copy()
        for y in range(8):
          if (mt[y]>128).sum()>=7:mt[y]=0
        macc[nm[j][1]].append(mt)
for k,v in sat.items():print(k,np.percentile(v,[0,5,50,95,100]))
def norm(t):
  t=t.astype(float).flatten();t-=t.mean();n=np.sqrt((t*t).sum()) or 1;return t/n
C=sorted(acc);CM=sorted(macc)
def robust(ts):
  m=norm(np.mean(ts,0))
  for _ in range(3):
    keep=[t for t in ts if m@norm(t)>0.7] or ts;m=norm(np.mean(keep,0))
  return m
cls=[robust(acc[c]).round(3).tolist() for c in C]
mcls=[robust(macc[c]).round(3).tolist() for c in CM]
# self-check: classify all training tiles
err=0;tot=0;mn=1
A=np.array(cls)
for c in C:
  for t in acc[c]:
    s=A@norm(t);tot+=1;mn=min(mn,s[C.index(c)])
    if C[int(s.argmax())]!=c:err+=1
bc=sorted(collections.Counter((c,C[int((A@norm(t)).argmax())]) for c in C for t in acc[c] if C[int((A@norm(t)).argmax())]!=c).items(),key=lambda x:-x[1]);print(bc[:10]);print('chars',len(C),'tiles',tot,'err',err,'min own corr',round(mn,3))

def enc(nm):
  out=[]
  for ch in nm:
    d=unicodedata.normalize('NFD',ch);b=d[0];mk=d[1:]
    out.append([C.index(b) if b in C else -1, CM.index(mk)+1 if mk in CM else (0 if not mk else -1)])
  return out
names=[enc(n) for n in J['names']]
unk=[J['names'][i] for i,n in enumerate(names) if any(x[0]<0 for x in n)]
print('names with unknown chars',len(unk),unk[:20])
P={"W":160,"H":144,"tiles":{"x0":88,"y0":16,"pitch":16,"n":7,"len":5,"ball":80,"dash":C.index('ー'),"chars":''.join(C),"marks":''.join(CM),"cls":cls,"mcls":mcls,"names":names,"dex":"3"},"vseg":True,"maxNo":251}
json.dump(P,open(sys.argv[3],'w'),ensure_ascii=False)
print('saved')
