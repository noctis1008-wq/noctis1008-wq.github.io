# 動画から「止まった場面」を取り出す（開発用）。2コマ/秒で小さな画像を見て、前後と同じ場面の区間の真ん中を JPEG で保存
import sys,subprocess,numpy as np,os,json
src,out=sys.argv[1],sys.argv[2];fps=float(sys.argv[3]) if len(sys.argv)>3 else 4
os.makedirs(out,exist_ok=True)
W,H=192,108
raw=subprocess.check_output(['ffmpeg','-v','error','-i',src,'-vf',f'fps={fps},scale={W}:{H}','-f','rawvideo','-pix_fmt','gray','-'])
a=np.frombuffer(raw,np.uint8).reshape(-1,H,W).astype(np.float32)
d=np.array([1e9]+[np.percentile(np.abs(a[i]-a[i-1]),99) for i in range(1,len(a))])
still=d<6
segs=[];i=0
while i<len(a):
    if still[i] or (i+1<len(a) and still[i+1]):
        j=i
        while j+1<len(a) and still[j+1]:j+=1
        if j>i:segs.append((i,j))
        i=j+1
    else:i+=1
picks=[(s+e)//2 for s,e in segs]
for k,p in enumerate(picks):
    t=p/fps
    subprocess.run(['ffmpeg','-v','error','-y','-ss',f'{t:.3f}','-i',src,'-frames:v','1','-q:v','2',f'{out}/{k:03d}_{t:07.2f}.jpg'])
print(len(a),'frames',len(picks),'stills')
