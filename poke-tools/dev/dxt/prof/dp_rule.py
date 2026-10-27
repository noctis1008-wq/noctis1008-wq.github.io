def skip(u):return False
# モンスターボールの印（赤・白・黒で明るさのばらつきが大きい）＝捕まえた。印がうすい丸で、名前の上半分に文字がない（「-----」）＝見ていない。名前がある＝見ただけ
def lab(F):
  if F[1]>0.2:return 'caught',-abs(F[1]-0.2)
  return ('none' if F[7]<0.1 else 'seen'),-abs(F[7]-0.1)
# 見出しが「ぜんこくずかん」の形と同じなら全国図鑑（シンオウ図鑑の画面は、選んでいる図鑑で数える）
def dex(u,F):return 'nat' if F[6]>0.8 else None
aug=True # 明るさを変えた静止画でも学ぶ（mkprof.py）
