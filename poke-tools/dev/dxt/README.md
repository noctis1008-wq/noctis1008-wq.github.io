# 図鑑の読み取り「型紙」の開発用の道具

Poke tools の図鑑埋め支援で、スマホ内で図鑑の画面を読むしくみのうち、**第7世代（SM・USUM）以外**の作品のための道具です。
アプリには入りません（`poke-tools/index.html` の `/*DXT-BEGIN*/`〜`/*DXT-END*/` に、`dxt.js` と型紙が組み込まれます）。

## しくみ（dxt.js）

1. ゲーム画面さがし（`dxtScreens`・`dxtMap`）：黒い余白で区切られた四角を探し、型紙の画面の形（`W`×`H`）に合うものを候補にする。DS・3DS の2画面（並べ方・大きさがちがってもよい）にも対応。
2. 行（とマス目の列）ごとに、番号の場所の数字を1字ずつ切り出し（`dxtGlyphs`）、数字の見本 `tm`（と2組目 `tm2`）と比べる。
3. 番号は「上から（マス目は左上から右へ）1ずつ増える」ことを使い、画面全体で決める（`dxtDecode`）。数字が合わない行が2行以上あれば、その画面は使わない（`dxtSure`）。行ごとにも、番号と数字が2けた以上合う行だけを結果に入れる。
4. 状態（捕まえた・見ただけ・見ていない）は、行の特徴（`feat` の四角の明るさ・色・形の見本 `fref` との似かた）を、状態の見本 `cls` と比べる（`dxtNear`）。
5. 見出しから、どの図鑑の画面か（`dex`）を見分ける。
6. 一覧が途中で止まる作品（`rows.scroll`）は、行の位置を少しずつずらして、数字がいちばんよく読める位置を使う。

## 型紙を作る手順（例：作品 xx）

道具は Python と Playwright（Chromium）を使います。`harness.html` を `python3 -m http.server 8766` で開ける場所に置いて使います（道具の中のパス `/home/claude/gen`・`/tmp/claude-0` は、作った人の作業場所です。自分の場所に直してください）。

1. `tools/stills.py 録画 st/xx 8`：録画から止まった場面を取り出す。
2. `prof/xx.json` を書く：設計の大きさ `W`・`H`、行 `rows`（`y0`・`pitch`・`n`）、列 `cols`、番号の四角 `num`、特徴の四角 `feat`、最大の番号 `maxNo`。
3. `tools/learn.py prof/xx.json st/xx 学習.json`：数字と特徴を取り出す。
4. `tools/glyphs.py 学習.json グループ 14`：数字をグループ分けして絵にする → 絵を見て、グループ番号と数字の対応を決める。
5. `tools/selftrain.py 学習.json 'グループ:{"0":7,...}' prof/xx_tm.json 最大の番号`：番号の並びを使って、0〜9 の見本を作る。
6. `tools/status.py`（グループ分け）・`tools/bylabel.py`（決まりで名前を付けて、境目に近い行から並べる）で、状態の見分け方を決め、`prof/xx_rule.py` に書く。「?」や「-----」の形は `tools/mkref.py` で形の見本にできる。
7. `tools/mkprof.py xx`：型紙を仕上げる（`prof/xx_full.json`）。
8. `tools/read.py`・`tools/check.py`：全部の場面を読み、同じ番号の食いちがいがないか、画面の「捕まえた数・見つけた数」と合うかを確かめる。
9. `prof/games.json` に `"型紙の名前":["作品のid"]` を足し、`tools/inject.py` で `index.html` に組み込む。`tools/apptest.py` で、アプリの画面での読み取りを確かめる。
