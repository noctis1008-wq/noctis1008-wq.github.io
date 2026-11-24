import json,re,sys
G=json.load(open(sys.argv[1]))
TY={'NORMAL':'ノーマル','FIRE':'ほのお','WATER':'みず','ELECTRIC':'でんき','GRASS':'くさ','ICE':'こおり','FIGHTING':'かくとう','POISON':'どく','GROUND':'じめん','FLYING':'ひこう','PSYCHIC':'エスパー','BUG':'むし','ROCK':'いわ','GHOST':'ゴースト','DRAGON':'ドラゴン','DARK':'あく','STEEL':'はがね','FAIRY':'フェアリー'}
IT={'ITEM_SUN_STONE':'たいようのいし','ITEM_KINGS_ROCK':'おうじゃのしるし','ITEM_METAL_COAT':'メタルコート','ITEM_DRAGON_SCALE':'りゅうのウロコ','ITEM_UP_GRADE':'アップグレード','ITEM_GEN4_EVOLUTION_STONE':'シンオウのいし','ITEM_GEN5_EVOLUTION_STONE':'イッシュのいし','ITEM_OTHER_EVOLUTION_STONE_MAPLE_A':'あまーいリンゴ','ITEM_OTHER_EVOLUTION_STONE_MAPLE_B':'すっぱいリンゴ','ITEM_OTHER_EVOLUTION_STONE_MAPLE_C':'みついりりんご','ITEM_OTHER_EVOLUTION_STONE_A':'コレクレーのコイン'}
LU={'ITEM_TROY_DISK_GLACIAL':'アイスルアーモジュール','ITEM_TROY_DISK_MAGNETIC':'マグネットルアーモジュール','ITEM_TROY_DISK_MOSSY':'ハーブルアーモジュール','ITEM_TROY_DISK_RAINY':'レイニールアーモジュール'}
Q={x['templateId']:x['data']['evolutionQuestTemplate'] for x in G if 'evolutionQuestTemplate' in x['data']}
def types(g):
  for c in g.get('condition',[]):
    for k in('withPokemonType','withOpponentPokemonBattleStatus'):
      if k in c:
        L=c[k].get('pokemonType') or c[k].get('opponentPokemonType') or []
        return '・'.join(TY[t.replace('POKEMON_TYPE_','')] for t in L)
  return ''
def qtext(qid):
  t=Q[qid];g=t['goals'][0];n=g['target'];ty=types(g);k=t['questType']
  if k=='QUEST_BUDDY_EVOLUTION_WALK':return f'相棒にして {n}km 歩く'
  if k=='QUEST_BUDDY_EARN_AFFECTION_POINTS':return f'相棒にしてハートを {n}個 ためる'
  if k=='QUEST_BUDDY_FEED':return f'相棒にして おやつを {n}回 あげる'
  if k=='QUEST_USE_INCENSE':return f'相棒にして おこうを {n}回 使う'
  if k=='QUEST_CATCH_POKEMON':return f'相棒にして {ty}タイプを {n}匹 捕まえる'
  if k=='QUEST_FIGHT_POKEMON':return f'相棒にして {ty}タイプのポケモンを {n}匹 倒す'
  if k=='QUEST_COMPLETE_RAID_BATTLE':return f'相棒にして レイドバトルに {n}回 勝つ'
  if k=='QUEST_COMPLETE_BATTLE':return f'相棒にして {ty}タイプのレイドバトルに {n}回 勝つ'
  if k=='QUEST_LAND_THROW':return f'相棒にして エクセレントスローを {n}回 投げる'
  raise Exception(k)
num={}
for x in G:
  p=x['data'].get('pokemonSettings')
  if p:
    m=re.match(r'V(\d{4})_POKEMON_',x['templateId'])
    if m:num.setdefault(p['pokemonId'],int(m.group(1)))
cand={}
for x in G:
  p=x['data'].get('pokemonSettings')
  if not p:continue
  m=re.match(r'V(\d{4})_POKEMON_(.*)',x['templateId']);src=int(m.group(1))
  base=x['templateId']==f'V{src:04d}_POKEMON_{p["pokemonId"]}'
  normal=x['templateId'].endswith('_NORMAL')
  for b in p.get('evolutionBranch',[]):
    if 'evolution' not in b:continue
    T=num.get(b['evolution'])
    if not T or T==src:continue
    rank=0 if base else 1 if normal else 2
    cand.setdefault(T,[]).append((rank,src,x['templateId'],b))
out={}
for T,L in sorted(cand.items()):
  r=min(c[0] for c in L)
  if r==2:  # 地方のすがたからだけ
    tid=sorted(c[2] for c in L)[0];L=[c for c in L if c[2]==tid]
  else:L=[c for c in L if c[0]==r]
  parts=[];chips=[];cs=[];bits=0
  for _,src,tid,b in L:
    q=[qd['questRequirementTemplateId'] for qd in b.get('questDisplay',[])]
    q=[x for x in q if '_CD_' not in x and 'EVENT' not in x]
    c=b.get('candyCost');d=[]
    if c:d.append(f'アメ{c}個');cs.append(c)
    if 'evolutionItemRequirement' in b:
      n=IT[b['evolutionItemRequirement']];bits|=4 if n.endswith('いし') else 8;k=b.get('evolutionItemRequirementCost');d.append(n+(f'{k}個' if k else ''));chips.append(n)
    if any(k in b for k in('lureItemRequirement','questDisplay','kmBuddyDistanceRequirement','mustBeBuddy','onlyDaytime','onlyNighttime','onlyDuskPeriod','onlyFullMoon','onlyUpsideDown','genderRequirement')):bits|=64
    if b.get('noCandyCostViaTrade'):bits|=16
    if 'lureItemRequirement' in b:
      d.append(LU[b['lureItemRequirement']]+'のそばで');chips.append('ルアー')
    if b.get('genderRequirement'):d.append('メスだけ' if b['genderRequirement']=='FEMALE' else 'オスだけ')
    if q:d.append(qtext(q[0]));chips.append('相棒タスク')
    elif b.get('kmBuddyDistanceRequirement'):d.append(f'相棒にして {b["kmBuddyDistanceRequirement"]:g}km 歩く');chips.append('相棒タスク')
    elif b.get('mustBeBuddy'):d.append('相棒にする');chips.append('相棒')
    if b.get('onlyDaytime'):d.append('昼だけ');chips.append('昼')
    if b.get('onlyNighttime'):d.append('夜だけ');chips.append('夜')
    if b.get('onlyDuskPeriod'):d.append('夕方だけ（ゲームの時間）');chips.append('夕方')
    if b.get('onlyFullMoon'):d.append('満月の夜だけ');chips.append('満月')
    if b.get('onlyUpsideDown'):d.append('スマホを上下さかさまにして進化');chips.append('さかさま')
    if b.get('noCandyCostViaTrade'):d.append('交換したポケモンならアメ0個')
    FM={'URSHIFU_SINGLE_STRIKE':'いちげきのかた','URSHIFU_RAPID_STRIKE':'れんげきのかた','LYCANROC_MIDDAY':'まひるのすがた','LYCANROC_MIDNIGHT':'まよなかのすがた'}
    pre=FM.get(b.get('form'),'')+'：' if len(L)>1 and b.get('form') in FM else ''
    parts.append(pre+'＋'.join(d[:1])+('（'+'・'.join(d[1:])+'）' if d[1:] else ''))
  parts=list(dict.fromkeys(parts))
  chip=chips[0] if chips else (f'アメ{cs[0]}' if cs else '')
  u=list(dict.fromkeys(chips))
  if len(u)>1 and len(''.join(u))<=6:chip='・'.join(u)
  if not bits and cs:bits=1
  chip={'コレクレーのコイン':'コイン999','相棒タスク・昼':'相棒・昼','相棒タスク・夜':'相棒・夜','あまーいリンゴ':'リンゴ','すっぱいリンゴ':'リンゴ','みついりりんご':'リンゴ'}.get(chip,chip)  # 一覧で切れないように短く
  out[T]=[chip,' ／ '.join(parts),min(cs) if cs else 0,bits]
json.dump(out,open(sys.argv[2],'w'),ensure_ascii=False,separators=(',',':'))
for T in [26,136,197,198,350,461,462,471,700,745,892,1000,809,184,186,423,983,1011]:print(T,out.get(T))
print(len(out))
