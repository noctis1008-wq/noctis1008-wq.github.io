import sys
from PIL import Image,ImageDraw
im=Image.open(sys.argv[1]).convert('RGB');Z=float(sys.argv[2]);x0=float(sys.argv[3]);y0=float(sys.argv[4]);st=float(sys.argv[5]) if len(sys.argv)>5 else 10
d=ImageDraw.Draw(im);W,H=im.size
import math
v=math.ceil(x0/st)*st
while (v-x0)*Z<W:
  X=(v-x0)*Z;d.line([(X,0),(X,H)],fill=(255,0,0) if v%(st*5)==0 else (255,160,160));d.text((X+1,1),str(int(v)),fill=(255,0,0));v+=st
v=math.ceil(y0/st)*st
while (v-y0)*Z<H:
  Y=(v-y0)*Z;d.line([(0,Y),(W,Y)],fill=(0,0,255) if v%(st*5)==0 else (160,160,255));d.text((1,Y+1),str(int(v)),fill=(0,0,255));v+=st
im.save(sys.argv[1].replace('.png','_g.png'))
