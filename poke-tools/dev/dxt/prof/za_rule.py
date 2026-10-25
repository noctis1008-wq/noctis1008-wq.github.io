def skip(u):return False
def lab(F):
  iL,isd,iwh,ired,q=F[0],F[1],F[2],F[5],F[12]
  if iL>0.8:  # カーソルのマス（白い札）
    if ired>0.05:return 'caught_c',-abs(ired-0.05)
    return 'unknown_c',0   # カーソルの白い札では、見ただけ・見ていないを決めない（ほかの画面で決まる）
  if isd<0.1:return 'none',-abs(isd-0.1)
  if iwh>0.08 or ired>-0.25:return 'caught',-abs(iwh-0.08)
  return 'seen',-abs(isd-0.1)
