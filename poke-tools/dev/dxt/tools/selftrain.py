# 番号は「上から1ずつ増える」ことを使って、数字の見本を作る（いくつかの数字が分かっていれば、残りも決まる）
import sys,json,numpy as np
src,init,out=sys.argv[1],sys.argv[2],sys.argv[3];maxNo=int(sys.argv[4]);digits=int(sys.argv[5]) if len(sys.argv)>5 else 3
r=json.load(open(src))
if init.endswith('.json'):T={int(d):np.array(v,np.float32) for d,v in json.load(open(init)).items()}
else:
  C=np.load(init[0:init.index(':')]+'.npy');mp=json.loads(init[init.index(':')+1:]) # {"cluster":digit}
  T={}
  for c,dg in mp.items():T.setdefault(dg,[]).append(C[int(c)])
  T={int(d):np.mean(v,0) for d,v in T.items()}
frames=[]
for f in r:
  m=(f['r'] or [None])[0]
  if not m:continue
  rows=[(row['k'],np.array(row['G'],np.float32)) for row in m['rows'] if row['G'] and (digits==0 or len(row['G'])==digits)]
  if len(rows)>=2:frames.append((f['u'],rows))
def tmat(T):
  M=np.zeros((10,192),np.float32)
  for d,v in T.items():M[d]=v
  return M
for it in range(6):
  M=tmat(T);lab=[];ok=0
  for u,rows in frames:
    S=[(k,(G@M.T)/192) for k,G in rows]
    best=-1e9;bb=0
    for b in range(1,maxNo+1):
      t=0
      for k,s in S:
        n=b+k
        if n>maxNo:t-=3;continue
        st=str(n).zfill(digits)
        if len(st)!=len(s):t-=1.5;continue
        t+=sum(s[j][int(st[j])] for j in range(len(st)))
      if t>best:best=t;bb=b
    mean=best/(len(S)*digits)
    if mean>.35:
      ok+=1
      for k,G in rows:
        st=str(bb+k).zfill(digits)
        for j,g in enumerate(G):
          d=int(st[j])
          if it>0 and d in T and (g@T[d])/192<0.55:continue # 見本と似ていない形（はしが切れた行など）は使わない
          lab.append((d,g))
  T={**T,**{d:np.mean([g for dd,g in lab if dd==d],0) for d in range(10) if any(dd==d for dd,_ in lab)}} # 材料がない数字は前の見本を残す
  print('iter',it,'frames ok',ok,'/',len(frames),'digits',sorted(T))
json.dump({str(d):[round(float(x),3) for x in v] for d,v in T.items()},open(out,'w'))
