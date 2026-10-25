def skip(u):return False
def lab(F):
  cur=F[5]>0.25 and F[0]<0.7
  wh=F[2]
  if cur:
    if wh>0.1:return 'caught_c',-abs(wh-0.1)
    return ('none_c' if F[25]>0.7 else 'seen_c'),-abs(F[25]-0.7)
  if wh>0.15:return 'caught',-abs(wh-0.15)
  return ('none' if F[12]>0.6 else 'seen'),-abs(F[12]-0.6)
maxd=3.5
def dex(u,F):return 'nat' if F[6]>0.8 else None
