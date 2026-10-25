def skip(u):return False
def lab(F):
  if F[4]>0.15:return 'caught',-abs(F[4]-0.15)
  return ('none' if F[18]>0.7 else 'seen'),-abs(F[18]-0.7)
