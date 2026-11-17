#!/usr/bin/env python3
"""出現ずかん：ner_species.json と ner_wild.json から topsecret/src/ner_data.json を作りなおし、topsecret/index.html を作りなおす。
（2026-11-17 に Poke tools から NER's topSecret へ移した）

使い方（リポジトリのいちばん上で）: python3 topsecret/dev/ner-enc/embed.py
ROM を更新して JSON を書き出しなおしたときに使う。計算のコード（ner_save.js・ner_randomizer.js）を
直したときは、topsecret/src/ner.js の同じ所も同じように直すこと。
"""
import json, os, re

here = os.path.dirname(os.path.abspath(__file__))
out = os.path.join(here, '..', '..', 'src', 'ner_data.json')
sp = json.load(open(os.path.join(here, 'ner_species.json'), encoding='utf-8'))
wild = json.load(open(os.path.join(here, 'ner_wild.json'), encoding='utf-8'))
# 種族は [e,c,t,b,d,f,n] の配列にちぢめる（src/ner.js の nerDb() で元の形にもどす）
spc = [[x['e'], x['c'], x['t'], x['b'], x['d'], x['f'], x['n'].strip()] if x else 0 for x in sp['species']]
maps = [{k: m[k] for k in ('g', 'n', 'name', 'sub', 'methods', 'feebas') if k in m} for m in wild['maps']]
data = json.dumps({'sp': spc, 'maps': maps}, ensure_ascii=False, separators=(',', ':'))
assert '</' not in data
open(out, 'w', encoding='utf-8').write(data)
print('ner_data.json を作りなおしました', len(data), 'bytes')
import subprocess, sys
subprocess.run([sys.executable, os.path.join(here, '..', '..', 'src', 'build.py')], check=True)
