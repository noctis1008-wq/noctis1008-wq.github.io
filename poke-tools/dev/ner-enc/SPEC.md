# Poke tools 新ツール「出現ずかん」(NERversion 用) — 引き継ぎ資料

運営者の指示 (2026-11-06): **C案(検索結果型)** で Poke tools に組み込む。UI はほかのツールと統一。
作ったのは Claude (NERversion の ROM ハック作業のセッション)。実装は Poke tools のセッションへ引き継ぎ。

## 何をするツールか
運営者が遊んでいる改造ROM「Pokemerald NERversion」(日本語エメラルド・pokeemerald-expansion ベース・野生ランダマイザつき)で、
**野生のポケモンが どこに・どの方法で・何Lvで・何%で出るか** を引ける。ランダマイザの入れかえはセーブの値で決まるので、
**.sav を読みこんで、その場で計算する**(公開サイトなので、運営者のゲーム固有の表を前もって置かない)。

## 画面 (C案 = mock_ABC.png の右)
- 上: セーブのカード「NERversion のセーブ」+ 小さい説明(ランダマイザ ON/OFF・つかまえた n / みた n・読みこんだ日時)+「読みこむ ›」ボタン(.sav を選ぶ)。
- 「ポケモンから / ばしょから」の切りかえ(タブ)。
- 検索(名前・ばしょ、ひらがな OK。カタカナに直してくらべる)。
- 「すべて / 未捕獲 / 未発見」の 3 つの絞りこみ(件数つき)。
- 結果: ポケモンごとのカード。見出し = 図鑑番号・名前・状態バッジ(✓ つかまえた / ! みた / − みていない。孵化・遺伝ガイドと同じ形)。
  その下に場所の行: 「ばしょ名 + 出し方(小さく)」「Lv.a–b」「◯%」。
- 「ばしょから」のときは、ばしょごとのカード(見出し = ばしょ名)に、出し方ごとの行: 名前・状態・Lv・%。
- ポケモンのアイコン(公式の絵)は使わない。名前と番号だけ。
- 運営者の好み(HANDOFF.md「🎨」)に合わせる: 360〜393px で「…」切れ・はみ出しなし、ライト/ダーク両方、行の高さをそろえる。
- 参考に動くもの: https://claude.ai/artifact/BoK7pHzUzAmmncTjNy9jMW (運営者専用の確認ページ。デザインは Poke tools とちがう。中身の計算は同じ)

## 保存 (運営者の要望)
- 一度読みこんだら端末に保存して、次からは開くだけで出す。保存するのは seed・つかまえた/みた の図鑑番号・バッジ数・読みこんだ日時。.sav そのものは保存しない。
- 設定の「バックアップを書き出す/読み込む」にも入れる。
- 新しい .sav を読みこんだら上書き(つかまえた/みた が新しくなる)。

## ファイル (このフォルダ)
| ファイル | 中身 |
|---|---|
| `ner_save.js` | `nerReadSave(arrayBuffer)` → `{seed, randomizerWild, badges, caught:Set, seen:Set, ...}`。運営者の .sav 2 つで確かめ済み |
| `ner_randomizer.js` | `nerRandomizeWild(元の種族ID, mapGroup, mapNum, seed, SPECIES)` → 出る種族ID。ゲームの `Randomizer_PickSpecies` をそのまま移したもの |
| `ner_species.json` | `species[種族ID] = {e:有効, c:抽選の候補, t:フォルム表あり, b:合計種族値, d:全国図鑑番号, f:[えらべるフォルム], n:日本語名}`(ROM から書き出した) |
| `ner_wild.json` | 元の出現表。`maps[] = {g, n, area, name, sub, methods:[{type, rows:[[元の種族, 最低Lv, 最高Lv, %, (つりざお)]]}], feebas?}` |
| `test_vector_seed777.json` / `test.js` | seed=777 のときの ゲーム(エミュレータ)の答え 1976 件。`node test.js` で JS と全部一致 |
| `mock_ABC.png` | 運営者に見せた案。C案(右)が選ばれた |

## 計算のしかた
1. `info = nerReadSave(buf)`。`info.randomizerWild` が false なら入れかえなし(元の種族のまま表示)。
2. 各ばしょ・各行: `sp = info.randomizerWild ? nerRandomizeWild(row[0], map.g, map.n, info.seed, SPECIES) : row[0]`。
3. 同じばしょ・同じ出し方で同じ種族になった行は まとめる(%は足す、Lv は最小〜最大)。元がちがう種族でも、入れかえ後に同じになることがある。
4. 出し方の名前: land=くさむら・どうくつ / surf=なみのり / dive=ダイビング / rock=いわくだき / fish は rows[4] で old_rod=ボロのつりざお・good_rod=いいつりざお・super_rod=すごいつりざお(%はざおごと。表の % はスロットの割合なので、ざおごとに 100% になるよう足し直す: old 70/30, good 60/20/20, super 40/40/15/4/1)。
5. ヒンバス: `map.feebas` (119ばん どうろの きまった 6マス、どのつりざおでも 50%)。元の種族 349 を同じく入れかえる。
6. つかまえた/みた は `SPECIES[sp].d`(全国図鑑番号)で `info.caught` / `info.seen` を見る。フォルムちがいも同じ番号。
7. 名前は `SPECIES[sp].n`。

## 気をつけること
- 公開リポジトリなので、運営者の .sav やその中身(トレーナーID など)をコミットしない。
- ROM・パッチは絶対に置かない。
- NERversion のセーブの形を変えたら(今のところ変えない約束)、`ner_save.js` のオフセットを直す必要がある。

## 組みこみ済み(2026-11-06, Poke tools 2026.11.06a)
- `poke-tools/index.html` の「出現ずかん（NERversion）」の所(`vNer`・`renderNer`・`nerCalc`)。メニューのいちばん下(`TOOL_KEYS` の `ner`)。
- 表のデータは `#nerData`(`<script type="application/json">`)に入れてある。JSON を書き出しなおしたら `python3 poke-tools/dev/ner-enc/embed.py` で入れなおす。
- `ner_save.js`・`ner_randomizer.js` は index.html にそのまま入れてある。直したら index.html の同じ所も直す。
- 保存:`S.ner.sv = {seed, rw, badges, c, s, at}`(c・s は つかまえた/みた の全国図鑑番号のビット列を 16 進にしたもの)。設定のバックアップにも入る。
- 名前のないフォルムの ID(ビビヨンのもようなど)は、そのフォルムを持つ元のポケモンの番号・名前で出す。フォルム名のデータが無いので、すがた違いは「すがた違い」とだけ出す。
- 2026.11.06b:「出ないポケモン」タブを追加(参考:運営者の出現ずかんページ)。野生で出る全国図鑑番号の「進化のなかま」(SPDB の進化前をたどった根が同じもの)は、進化・タマゴで手に入るとみなす。残りを SPDB の区分で「伝説・幻」(準伝説・禁止級・幻)と「ふつう」に分け、UB・パラドックスに印。イベントなどで手に入るものは緑の字の注意(`NER_MNOTE`)。おこうがいるベビーや、交換・配布は考えていない。
