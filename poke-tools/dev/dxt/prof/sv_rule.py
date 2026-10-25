# SV の本棚：木の本＝見ていない（番号だけ出る）、灰色の本＝見ただけ、色のある本＝捕まえた。見ていないポケモンの本は棚にないこともある
digits=0
def skip(u):return False
def lab(F):
  iwh,sat=F[2],F[4]
  if sat>0.4:return 'none',-abs(sat-0.4)
  if iwh>0.25:return 'seen',-abs(iwh-0.25)
  return 'caught',-abs(iwh-0.25)
