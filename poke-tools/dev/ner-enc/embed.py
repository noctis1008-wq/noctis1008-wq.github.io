#!/usr/bin/env python3
"""出現ずかん：ner_species.json と ner_wild.json を、poke-tools/index.html の #nerData に入れなおす。

使い方（リポジトリのいちばん上で）: python3 poke-tools/dev/ner-enc/embed.py
ROM を更新して JSON を書き出しなおしたときに使う。計算のコード（ner_save.js・ner_randomizer.js）を
直したときは、index.html の「出現ずかん（NERversion）」の所も同じように直すこと。
"""
import json, os, re

here = os.path.dirname(os.path.abspath(__file__))
html = os.path.join(here, '..', '..', 'index.html')
sp = json.load(open(os.path.join(here, 'ner_species.json'), encoding='utf-8'))
wild = json.load(open(os.path.join(here, 'ner_wild.json'), encoding='utf-8'))
# 種族は [e,c,t,b,d,f,n] の配列にちぢめる（index.html の nerDb() で元の形にもどす）
spc = [[x['e'], x['c'], x['t'], x['b'], x['d'], x['f'], x['n'].strip()] if x else 0 for x in sp['species']]
maps = [{k: m[k] for k in ('g', 'n', 'name', 'sub', 'methods', 'feebas') if k in m} for m in wild['maps']]
data = json.dumps({'sp': spc, 'maps': maps}, ensure_ascii=False, separators=(',', ':'))
assert '</' not in data
s = open(html, encoding='utf-8').read()
s, n = re.subn(r'(<script type="application/json" id="nerData">).*?(</script>)', lambda m: m.group(1) + data + m.group(2), s, flags=re.S)
assert n == 1, n
open(html, 'w', encoding='utf-8').write(s)
print('nerData を入れなおしました', len(data), 'bytes')
