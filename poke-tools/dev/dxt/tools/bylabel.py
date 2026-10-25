# 決まり（rule.py の lab(F)）で行に名前を付け、名前ごとに行の絵を並べる。境目に近いものを先に並べる
import sys,json,numpy as np,importlib.util
from PIL import Image,ImageDraw
src,prof,rule,out=sys.argv[1:5];crop=json.loads(sys.argv[5]);n=int(sys.argv[6]) if len(sys.argv)>6 else 10
spec=importlib.util.spec_from_file_location('rule',rule);R=importlib.util.module_from_spec(spec);spec.loader.exec_module(R)
P=json.load(open(prof));r=json.load(open(src));items=[]
for f in r:
  m=(f['r'] or [None])[0]
  if not m or R.skip(f['u']):continue
  for row in m['rows']:
    if not row['G'] or (getattr(R,'digits',3) and len(row['G'])!=getattr(R,'digits',3)):continue
    if 'ok' in row and m.get('sure') and not row['ok']:continue # 番号が並びと合わないマス（マス目の外など）は使わない
    lab,score=R.lab(row['F'])
    if lab is None:continue
    items.append((lab,score,f['u'].split('8766/')[1],{**m['m'],'d':m.get('d',0)},row['k']))
labs=sorted(set(i[0] for i in items));import os;Z=float(os.environ.get('ZM',480/P['W']));cw,ch=int((crop[2]-crop[0])*Z),int((crop[3]-crop[1])*Z)
im=Image.new('RGB',(len(labs)*(cw+8),n*(ch+4)+20),'white');dr=ImageDraw.Draw(im)
for j,l in enumerate(labs):
  L=sorted([i for i in items if i[0]==l],key=lambda i:i[1]);dr.text((j*(cw+8)+4,4),f'{l}:{len(L)}',fill='black')
  for t,(lab,sc,u,m,kk) in enumerate(L[:n]):
    nc=P.get('cols',{}).get('n',1);cp=P.get('cols',{}).get('pitch',0);yc=P['rows']['y0']+m.get('d',0)+(kk//nc)*P['rows']['pitch'];xo=(kk%nc)*cp;I=Image.open(u)
    box=(m['ox']+(crop[0]+xo)*m['sx'],m['oy']+(yc+crop[1])*m['sy'],m['ox']+(crop[2]+xo)*m['sx'],m['oy']+(yc+crop[3])*m['sy'])
    im.paste(I.crop(tuple(int(v) for v in box)).resize((cw,ch)),(j*(cw+8)+4,20+t*(ch+4)))
im.save(out);import collections;print(collections.Counter(i[0] for i in items))
