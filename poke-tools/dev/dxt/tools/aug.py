# 明るさ・コントラストを変えた静止画を作り、学習用の結果（/tmp/claude-0/<型紙>_aug_<変え方>.json）を作る。
# iPhone は動画の明るさの幅を広げて取り出すことがあり（暗い所はより暗く、明るい所はより明るく）、型紙の見本から外れて「不明」になった（LA・DP）。
# 使い方：python3 tools/aug.py 型紙 静止画のフォルダ名   （そのあと prof/<型紙>_rule.py に aug=True を書き、mkprof.py を実行）
import sys,glob,os,subprocess,numpy as np
from PIL import Image
name,sd=sys.argv[1],sys.argv[2]
V={'exp':lambda a:np.clip((a-16)*255/219,0,255),'cmp':lambda a:16+a*219/255,'g09':lambda a:255*(a/255)**0.85,'g11':lambda a:255*(a/255)**1.18}
for n,f in V.items():
  od=f'st/{sd}_{n}';os.makedirs(od,exist_ok=True)
  for p in sorted(glob.glob(f'st/{sd}/*.jpg')):
    a=np.asarray(Image.open(p).convert('RGB'),np.float32);Image.fromarray(f(a).astype(np.uint8)).save(od+'/'+os.path.basename(p),quality=92)
  subprocess.run([sys.executable.replace('python3','python3') if 'pwenv' in sys.executable else '/workspace/pwenv/bin/python','tools/learn.py',f'prof/{name}.json',od,f'/tmp/claude-0/{name}_aug_{n}.json'],check=True)
