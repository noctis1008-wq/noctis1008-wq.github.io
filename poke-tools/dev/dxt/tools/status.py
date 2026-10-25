# 行の特徴でグループ分けし、グループごとの行の絵を並べる（状態の見本づくり用）
import sys,json,numpy as np
from PIL import Image,ImageDraw
src,prof,out,k=sys.argv[1],sys.argv[2],sys.argv[3],int(sys.argv[4]);crop=json.loads(sys.argv[5]) # [x0,dy0,x1,dy1]
P=json.load(open(prof));r=json.load(open(src));X=[];ref=[]
for f in r:
  m=(f['r'] or [None])[0]
  if not m:continue
  for row in m['rows']:X.append(row['F']);ref.append((f['u'].split('8766/')[1],{**m['m'],'d':m.get('d',0)},row['k']))
X=np.array(X,np.float32);mu=X.mean(0);sd=X.std(0)+1e-3;Z=(X-mu)/sd
rng=np.random.default_rng(1);C=Z[rng.choice(len(Z),k,replace=False)]
for it in range(40):
  a=((Z[:,None]-C[None])**2).sum(-1).argmin(1);C=np.array([Z[a==j].mean(0) if (a==j).any() else C[j] for j in range(k)])
json.dump({'a':a.tolist(),'ref':ref,'X':X.tolist()},open(out+'.json','w'))
import os;Z=float(os.environ.get('ZM',480/P['W']));cw,ch=int((crop[2]-crop[0])*Z),int((crop[3]-crop[1])*Z);n=8
im=Image.new('RGB',(k*(cw+8),n*(ch+4)+20),'white');dr=ImageDraw.Draw(im)
for j in range(k):
  idx=np.where(a==j)[0];dr.text((j*(cw+8)+4,4),f'{j}:{len(idx)}',fill='black')
  for t,i in enumerate(rng.permutation(idx)[:n]):
    u,m,kk=ref[i];nc=P.get('cols',{}).get('n',1);cp=P.get('cols',{}).get('pitch',0);hs=P.get('cols',{}).get('scroll');yc=P['rows']['y0']+(0 if hs else m.get('d',0))+(kk//nc)*P['rows']['pitch'];xo=(kk%nc)*cp+(m.get('d',0) if hs else 0);I=Image.open(u)
    box=(m['ox']+(crop[0]+xo)*m['sx'],m['oy']+(yc+crop[1])*m['sy'],m['ox']+(crop[2]+xo)*m['sx'],m['oy']+(yc+crop[3])*m['sy'])
    im.paste(I.crop(tuple(int(v) for v in box)).resize((cw,ch)),(j*(cw+8)+4,20+t*(ch+4)))
im.save(out+'.png');print([int((a==j).sum()) for j in range(k)])
