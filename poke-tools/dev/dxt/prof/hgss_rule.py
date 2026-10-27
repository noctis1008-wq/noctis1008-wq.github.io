def skip(u):return False
# 番号の左にボールの印＝捕まえた。印がなく、絵（うすい絵）がある＝見ただけ。絵がない（白いマスだけ）＝見ていない
def lab(F):
  if F[1]>0.2:return 'caught',-abs(F[1]-0.2)
  return ('none' if F[7]<0.05 else 'seen'),-abs(F[7]-0.05)
aug=True # 明るさを変えた静止画でも学ぶ（mkprof.py）
