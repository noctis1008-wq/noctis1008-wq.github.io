# 切り出した数字を形でグループ分けし、グループごとの見本の一覧画像を作る
import sys,json,numpy as np
from PIL import Image,ImageDraw
src,out,k=sys.argv[1],sys.argv[2],int(sys.argv[3])
r=json.load(open(src));X=[];W=[]
for f in r:
  for m in (f['r'] or [])[:1]:
    for row in m['rows']:
      if row['G']:
        for g,w in zip(row['G'],row['W']):X.append(g);W.append(w)
X=np.array(X,np.float32);rng=np.random.default_rng(0);C=X[rng.choice(len(X),k,replace=False)]
for it in range(30):
  d=((X[:,None,:]-C[None])**2).sum(-1);a=d.argmin(1)
  C=np.array([X[a==j].mean(0) if (a==j).any() else C[j] for j in range(k)])
np.save(out+'.npy',C);json.dump(a.tolist(),open(out+'_a.json','w'))
im=Image.new('L',(k*40+10,20*34+30),255);dr=ImageDraw.Draw(im)
for j in range(k):
  idx=np.where(a==j)[0][:20];dr.text((j*40+8,2),str(j),fill=0)
  for t,i in enumerate(idx):
    g=X[i].reshape(16,12);g=(g-g.min())/(g.max()-g.min()+1e-6)*255
    im.paste(Image.fromarray((255-g).astype(np.uint8)).resize((24,32),Image.NEAREST),(j*40+8,20+t*34))
im.save(out+'.png');print(len(X),[int((a==j).sum()) for j in range(k)])
