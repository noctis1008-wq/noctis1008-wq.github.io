#!/usr/bin/env python3
"""NER's topSecret の 1ページの アプリ（topsecret/index.html）を src/ の 部品から 作る。

  python3 topsecret/src/build.py

部品:
  app.html        画面の 骨組み（☰メニュー・下のバー・テキストボックス メーカー・ROM・説明書）
  poke.css        Poke tools の 見た目（poke-tools/index.html の <style> を 写した もの。2026-11-17）
  app.css         topSecret で 足す 見た目（tb- ・lk- で はじまる）
  ner_view.html   出現ずかんの 画面（Poke tools から 移した）
  ner.js          出現ずかんの しくみ（Poke tools から 移した。dev/ner-enc/ と 同じ 計算）
  ner_data.json   出現ずかんの 表（dev/ner-enc/embed.py で 作る）
  shared.js       ポケモンの 名前の 表など（Poke tools から 写した）
  textbox_core.js テキストボックスの 描きかた（topSecret の tools/textbox_maker/web/ で web/build.py が 作った もの。ROM と 1ドットも ちがわない ことを その リポジトリの test/web_check.js で 確かめる）
  app.js          画面の うごき（NERJS の ところに ner.js が 入る）
"""
import os
HERE = os.path.dirname(os.path.abspath(__file__))
r = lambda n: open(os.path.join(HERE, n), encoding='utf-8').read()
html = r('app.html')
parts = {
    '/*POKECSS*/': r('poke.css'),
    '/*APPCSS*/': r('app.css'),
    '<!--VNER-->': r('ner_view.html'),
    '/*NERDATA*/': r('ner_data.json').strip(),
    '/*SHARED*/': r('shared.js'),
    '/*TBCORE*/': r('textbox_core.js'),
    '/*APPJS*/': r('app.js').replace('/*NERJS*/', r('ner.js')),
}
for k, v in parts.items():
    assert html.count(k) == 1, k
    html = html.replace(k, v)
out = os.path.join(HERE, '..', 'index.html')
open(out, 'w', encoding='utf-8').write(html)
print(os.path.normpath(out), len(html.encode()), 'bytes')
