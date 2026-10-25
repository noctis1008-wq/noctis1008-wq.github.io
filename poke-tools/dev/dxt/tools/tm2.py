# 2組目の数字の見本：番号が決まった画面で、1組目と似ていなかった数字（うすい行・カーソルの行）から作る
import sys,json,numpy as np
src,tmf,out,maxNo=sys.argv[1],sys.argv[2],sys.argv[3],int(sys.argv[4]);digits=3
r=json.load(open(src));T=json.load(open(tmf));M=np.zeros((10,192),np.float32)
for d,v in T.items():M[int(d)]=v
low={};
for f in r:
  m=(f['r'] or [None])[0]
  if not m:continue
  rows=[(row['k'],np.array(row['G'],np.float32)) for row in m['rows'] if row['G'] and len(row['G'])==digits]
  good=[(k,G) for k,G in rows if ((G@M.T)/192).max(1).min()>0.6]
  if len(good)<3:continue
  best=-1e9;bb=0
  for b in range(1,maxNo+1):
    t=sum(sum(((G@M.T)/192)[j][int(str(b+k).zfill(3)[j])] for j in range(3)) for k,G in good if b+k<=maxNo)
    if t>best:best=t;bb=b
  if best/(len(good)*3)<0.7:continue
  for k,G in rows:
    st=str(bb+k).zfill(3)
    if bb+k>maxNo:continue
    for j,g in enumerate(G):
      d=int(st[j])
      if (g@M[d])/192<0.55:low.setdefault(d,[]).append(g)
T2={}
for d,v in low.items():
  if len(v)>=3:x=np.mean(v,0);x=(x-x.mean())/x.std();T2[str(d)]=[round(float(a),3) for a in x]
print({d:len(v) for d,v in sorted(low.items())});json.dump(T2,open(out,'w'))
