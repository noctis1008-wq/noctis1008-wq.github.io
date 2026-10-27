# 型紙を仕上げる：数字の見本・決まり(rule.py)で付けた名前から状態の見本・図鑑の見分け(dexmap)を作る
import sys,json,importlib.util,collections;sys.path.insert(0,'/home/claude/gen/tools');from cls import build,near
name=sys.argv[1];P=json.load(open(f'prof/{name}.json'));tm=json.load(open(f'prof/{name}_tm.json'));P['tm']=[tm.get(str(d)) for d in range(10)]
spec=importlib.util.spec_from_file_location('rule',f'prof/{name}_rule.py');R=importlib.util.module_from_spec(spec);spec.loader.exec_module(R)
r=json.load(open(f'/tmp/claude-0/{name}_learn.json'));X=[];L=[];DX=[];DL=[];LK=[];DK={}
import os
for f in r:
  m=(f['r'] or [None])[0]
  if not m or R.skip(f['u']):continue
  if hasattr(R,'dex'):
    d=R.dex(f['u'],m['dexF'])
    if d:DX.append(m['dexF']);DL.append(d);DK[os.path.basename(f['u'])]=d
  for row in m['rows']:
    if not row['G'] or (getattr(R,'digits',3) and len(row['G'])!=getattr(R,'digits',3)):continue
    if 'ok' in row and m.get('sure') and not row['ok']:continue # 番号が並びと合わないマス（マス目の外など）は使わない
    l,_=R.lab(row['F'])
    if l is None:continue
    X.append(row['F']);L.append(l);LK.append((f,row,l))
# 明るさ・コントラストを変えた静止画（prof/<name>_rule.py の aug。iPhone は動画の明るさの幅を広げて取り出すことがある）でも同じ見本を学ぶ。
# 名前は元の静止画の同じ行の名前を使う（明るさが変わると決まりの境目もずれるため）
import glob,os
lab0={(os.path.basename(f['u']),row['k']):l for f,row,l in [(f,row,l) for f,row,l in LK]}
for fa in sorted(glob.glob(f'/tmp/claude-0/{name}_aug_*.json')) if getattr(R,'aug',False) else []:
  na=0
  for f in json.load(open(fa)):
    m=(f['r'] or [None])[0]
    if not m:continue
    d=DK.get(os.path.basename(f['u']))
    if d and m.get('dexF'):DX.append(m['dexF']);DL.append(d)
    for row in m['rows']:
      l=lab0.get((os.path.basename(f['u']),row['k']))
      if l is None or not row['G']:continue
      X.append(row['F']);L.append(l);na+=1
  print('aug',fa,na)
P['cls']=build(X,L,getattr(R,'maxd',3.5))
if DX:P['dex']['cls']=build(DX,DL,4.0)
elif 'dex' in P and 'refs' not in P['dex']:del P['dex']
if hasattr(R,'chk'):P['chk']=R.chk
print(collections.Counter(L));print('見本で見分けた結果が決まりと同じ',sum(near(x,P['cls'])[0]==l for x,l in zip(X,L)),'/',len(X))
json.dump(P,open(f'prof/{name}_full.json','w'))
