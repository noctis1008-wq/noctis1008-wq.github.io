# グループ（status.py の結果）の行から、形の見本（fref）を作って型紙に入れる。 mkref.py 名前 グループ番号 特徴の番号
import sys,json,numpy as np
name,cl,ri=sys.argv[1],int(sys.argv[2]),int(sys.argv[3])
r=json.load(open(f'/tmp/claude-0/{name}_learn.json'));a=json.load(open(f'/tmp/claude-0/{name}_s.json'))['a'];i=0;V=[]
for f in r:
  m=(f['r'] or [None])[0]
  if not m:continue
  for row in m['rows']:
    if a[i]==cl:V.append(row['Pt'][ri])
    i+=1
v=np.mean(V,0);v=(v-v.mean())/v.std()
p=f'prof/{name}.json';P=json.load(open(p));P['fref'][ri]=[round(float(x),3) for x in v];json.dump(P,open(p,'w'));print(len(V))
