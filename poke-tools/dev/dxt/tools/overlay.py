# 読み取り結果を画面に書き込んで並べる（目で確かめる用）
import sys,json,random
from PIL import Image,ImageDraw,ImageFont
r=json.load(open(sys.argv[1]));P=json.load(open(sys.argv[2]));out=sys.argv[3];n=int(sys.argv[4]);crop=json.loads(sys.argv[5])
ok=[x for x in r if x['r'] and 'rows' in x['r']];random.seed(int(sys.argv[6]) if len(sys.argv)>6 else 0);pick=random.sample(ok,min(n,len(ok)))
ft=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc',34)
C={'caught':(0,170,60),'seen':(230,170,0),'none':(120,120,140),'unknown':(255,0,0)}
tiles=[]
for x in pick:
  I=Image.open(x['u'].split('8766/')[1]).convert('RGB');s=I.width/P['W'];dr=ImageDraw.Draw(I)
  for k,row in enumerate(x['r']['rows']):
    yc=(P['rows']['y0']+k*P['rows']['pitch'])*s
    dr.rectangle((crop[0]*s-170,yc-24,crop[0]*s-4,yc+24),fill=C[row['status']]);dr.text((crop[0]*s-166,yc-22),f"{row['num']:03d}",fill='white',font=ft)
  I=I.crop((int((crop[0]-0)*s)-175,int(crop[1]*s),int(crop[2]*s),int(crop[3]*s)));I.thumbnail((640,640));tiles.append((I,x['r'].get('dex')))
W=sum(t.width for t,_ in tiles[:3])+20;H=max(t.height for t,_ in tiles)*((len(tiles)+2)//3)+40
M=Image.new('RGB',(W,H),'white');d=ImageDraw.Draw(M);xx=yy=0
for i,(t,dx) in enumerate(tiles):
  if i and i%3==0:xx=0;yy+=t.height+14
  M.paste(t,(xx,yy+12));d.text((xx+4,yy),f'dex {dx}',fill='black');xx+=t.width+6
M.save(out)
