import json,numpy as np,sys;sys.path.insert(0,'tools');from cls import build,near
P=json.load(open('prof/swsh.json'));P['tm']=[json.load(open('prof/swsh_tm.json'))[str(d)] for d in range(10)]
r=json.load(open('/tmp/claude-0/swsh_learn.json'))
bad={'034','035','057','058','059'};X=[];L=[];DX=[];DL=[]
for f in r:
  n=f['u'].split('/')[-1][:3];m=(f['r'] or [None])[0]
  if not m or n in bad:continue
  i=int(n);DX.append(m['dexF']);DL.append('27' if i<=33 else '28' if i<=56 else '29')
  for row in m['rows']:
    x=row['F'];cur=x[15]>0.5 and x[6]>0.45
    if cur:lab='caught_c' if x[2]>0.1 else 'seen_c'
    else:lab='caught' if x[3]>0.08 else 'seen' if x[7]>0.12 else 'none'
    X.append(x);L.append(lab)
P['cls']=build(X,L,3.5);P['dex']['cls']=build(DX,DL,4.0)
# 一覧の画面か：右上の「番号順」の帯が暗い
P['chk']=[[1150,30,1900,110,0,0,0.35]]
from collections import Counter;print(Counter(L))
ok=sum(near(x,P['cls'])[0]==l for x,l in zip(X,L));print('train',ok,'/',len(X))
json.dump(P,open('prof/swsh_full.json','w'))
