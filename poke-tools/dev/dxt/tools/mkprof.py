# 型紙を仕上げる：数字の見本・決まり(rule.py)で付けた名前から状態の見本・図鑑の見分け(dexmap)を作る
import sys,json,importlib.util,collections;sys.path.insert(0,'/home/claude/gen/tools');from cls import build,near
name=sys.argv[1];P=json.load(open(f'prof/{name}.json'));tm=json.load(open(f'prof/{name}_tm.json'));P['tm']=[tm.get(str(d)) for d in range(10)]
spec=importlib.util.spec_from_file_location('rule',f'prof/{name}_rule.py');R=importlib.util.module_from_spec(spec);spec.loader.exec_module(R)
r=json.load(open(f'/tmp/claude-0/{name}_learn.json'));X=[];L=[];DX=[];DL=[]
for f in r:
  m=(f['r'] or [None])[0]
  if not m or R.skip(f['u']):continue
  if hasattr(R,'dex'):
    d=R.dex(f['u'],m['dexF'])
    if d:DX.append(m['dexF']);DL.append(d)
  for row in m['rows']:
    if not row['G'] or (getattr(R,'digits',3) and len(row['G'])!=getattr(R,'digits',3)):continue
    if 'ok' in row and m.get('sure') and not row['ok']:continue # 番号が並びと合わないマス（マス目の外など）は使わない
    l,_=R.lab(row['F'])
    if l is None:continue
    X.append(row['F']);L.append(l)
P['cls']=build(X,L,getattr(R,'maxd',3.5))
if DX:P['dex']['cls']=build(DX,DL,4.0)
elif 'dex' in P:del P['dex']
if hasattr(R,'chk'):P['chk']=R.chk
print(collections.Counter(L));print('見本で見分けた結果が決まりと同じ',sum(near(x,P['cls'])[0]==l for x,l in zip(X,L)),'/',len(X))
json.dump(P,open(f'prof/{name}_full.json','w'))
