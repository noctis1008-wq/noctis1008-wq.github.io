# 止まった画面をすべて読み、図鑑ごとにまとめる。食いちがい（同じ番号で違う状態）を出す
import sys,json,collections
r=json.load(open(sys.argv[1]));agg=collections.defaultdict(dict);bad=0
for x in r:
  n=x['u'].split('/')[-1]
  if not x['r'] or 'fail' in x['r']:print('  読めず',n,(x['r'] or {}).get('fail'));continue
  for row in x['r']['rows']:
    d=x['r'].get('dex') or '-';prev=agg[d].get(row['num'])
    if prev and prev!=row['status']:print('  食いちがい',n,row,prev);bad+=1
    agg[d][row['num']]=row['status']
for d,v in agg.items():c=collections.Counter(v.values());print('図鑑',d,len(v),'匹',min(v),'〜',max(v),dict(c),'捕まえた',c['caught'],'見つけた',c['caught']+c['seen'])
json.dump(agg,open(sys.argv[2],'w'));print('食いちがい',bad)
