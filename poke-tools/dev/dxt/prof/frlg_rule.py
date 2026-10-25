def skip(u):return False
def lab(F):
  if F[5]>0.1:return 'caught',-abs(F[5]-0.1)
  return ('none' if F[24]>0.75 else 'seen'),-abs(F[24]-0.75)
