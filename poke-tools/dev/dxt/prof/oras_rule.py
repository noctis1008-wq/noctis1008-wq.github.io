def skip(u):return False
def lab(F):
  cur=F[11]>0.3
  sfx='_c' if cur else ''
  if F[3]>0.2:return 'seen'+sfx,-abs(F[3]-0.2)
  if F[2]>0.02:return 'caught'+sfx,-abs(F[2]-0.02)
  return 'none'+sfx,-min(abs(F[3]-0.2),abs(F[2]-0.02))
