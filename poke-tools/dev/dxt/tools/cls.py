import numpy as np
def build(X,L,maxd=3.0,sub=3):
  # 状態ごとに、見え方のちがう行（カーソル・帯にかかった行など）があるので、状態ごとに最大 sub 個の見本を作る
  X=np.array(X,np.float32);ks=sorted(set(L));L=np.array(L)
  W=np.concatenate([X[L==k]-X[L==k].mean(0) for k in ks]);s=np.maximum(W.std(0),0.02)
  C=[]
  for k in ks:
    Z=X[L==k]/s;n=min(sub,max(1,len(Z)//30));rng=np.random.default_rng(0);c=Z[rng.choice(len(Z),n,replace=False)]
    for it in range(30):
      a=((Z[:,None]-c[None])**2).sum(-1).argmin(1);c=np.array([Z[a==j].mean(0) if (a==j).any() else c[j] for j in range(n)])
    for j in range(n):C.append({'k':k,'m':[round(float(v),4) for v in c[j]*s]})
  return {'c':C,'s':[round(float(v),4) for v in s],'max':maxd}
def near(F,C):
  best=None;bd=1e9
  for c in C['c']:
    d=np.sqrt(np.mean(((np.array(F)-np.array(c['m']))/np.array(C['s']))**2))
    if d<bd:bd=d;best=c['k']
  return best if bd<C['max'] else 'unknown',bd
