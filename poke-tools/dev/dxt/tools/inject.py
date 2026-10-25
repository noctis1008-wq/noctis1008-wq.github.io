# dxt.js と型紙（prof/*_full.json）を index.html に組み込む（/*DXT-BEGIN*/〜/*DXT-END*/ を置きかえる）
import json,re,sys,glob
p='/home/claude/noctis1008-wq.github.io/poke-tools/index.html';s=open(p).read()
code=open('/home/claude/gen/dxt.js').read()
def rnd(o):
  if isinstance(o,float):return round(o,3)
  if isinstance(o,list):return [rnd(x) for x in o]
  if isinstance(o,dict):return {k:rnd(v) for k,v in o.items()}
  return o
games=json.load(open('/home/claude/gen/prof/games.json'))
prof={k:rnd(json.load(open(f'/home/claude/gen/prof/{k}_full.json'))) for k in games}
for k,v in prof.items():v.pop('_',None)
blk="/*DXT-BEGIN*/\n"+code+"\n// 作品ごとの型紙（開発用の道具で、運営者の録画から作った。数字の見本 tm・状態の見本 cls・図鑑の見分け dex・一覧の画面かの目印 chk）\nconst DXT_PROF="+json.dumps(prof,ensure_ascii=False,separators=(',',':'))+";\nconst DXT_GAME="+json.dumps({g:k for k,gs in games.items() for g in gs})+"; // 作品 → 型紙\n/*DXT-END*/"
if '/*DXT-BEGIN*/' in s:s=re.sub(r'/\*DXT-BEGIN\*/.*?/\*DXT-END\*/',lambda m:blk,s,flags=re.S)
else:
  a="function dxr7Rows(";i=s.index(a);s=s[:i]+blk+"\n"+s[i:]
open(p,'w').write(s);print('ok',{k:len(json.dumps(v)) for k,v in prof.items()})
