def skip(u):return False
# ボールの印（黒いふちがある）＝捕まえた。印がなく、名前の上半分に文字がない（「-----」）＝見ていない。印がなく名前がある＝見ただけ
# カーソルの行（地が白い）は別の見本にする（_c）。白い地では「-----」でも少しばらつくので、境目を上げる
def lab(F):
  cur=F[14]>0.5;sfx='_c' if cur else ''
  if F[3]>0.07:return 'caught'+sfx,-abs(F[3]-0.07)
  t=0.17 if cur else 0.06
  return ('none' if F[7]<t else 'seen')+sfx,-abs(F[7]-t)
aug=True # 明るさを変えた静止画でも学ぶ（mkprof.py）
