import sys,json,numpy as np
from PIL import Image
T=json.load(open(sys.argv[1]));im=Image.new('L',(10*40,40),255)
for d in range(10):
  if str(d) in T:
    g=np.array(T[str(d)]).reshape(16,12);g=(g-g.min())/(g.max()-g.min()+1e-6)*255
    im.paste(Image.fromarray((255-g).astype(np.uint8)).resize((24,32),Image.NEAREST),(d*40+8,4))
im.save(sys.argv[2])
