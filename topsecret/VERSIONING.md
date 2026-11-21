# NER's topSecret の 版の ルール

topSecret（`/topsecret/`）を 変える 人（人間・AI）が 守る こと。
ホーム画面に 置いた アプリは 古い 版の まま 残りやすいので、**版を まちがえると 運営者の スマホに 新しい 版が とどきません**。

## 1. 版は 2つ ある

| 版 | どこに | だれが つける | 何に つかう |
|---|---|---|---|
| **TS_BUILD**（例 `799101731f`）| `topsecret/index.html` の 中（`app.js` の いちばん 上の `const TS_BUILD`）| `build.py` が 自動で（中身の ハッシュ）| アプリの「新しい 版が あります」の おしらせ、図鑑登録メーカーの 読みなおし |
| **記録の 版**（例 `2026-11-22d`）| `HANDOFF.md` の いちばん 上の「最新」の 行 | 変えた 人が 手で | 人・AI が「前より 新しく なったか」を 知る |

## 2. 変えたら かならず する こと

1. `topsecret/src/` か `topsecret/zukan/` を 変えたら、**`python3 topsecret/src/build.py` を 実行**して、できた `topsecret/index.html` も **いっしょに コミット**する。
   - `topsecret/index.html` は 手で 書きかえない（`src/` の 部品から 作る もの）。
   - `TS_BUILD` は 手で 書かない。`'__BUILD__'` の まま に して おけば `build.py` が 入れる。
2. `HANDOFF.md` の「最新」の 行の `NER's topSecret YYYY-MM-DD<文字>(…)` を 新しく する。
   - 同じ 日に 何回も 出す ときは、日付の あとの 文字を a → b → c … と すすめる。
   - かっこの 中は、何を 変えたかを みじかく。
3. `HANDOFF.md` の「作業ログ」の いちばん 上に 記録を 足す（書き方は `HANDOFF.md` の 先頭）。

わすれると、GitHub の 自動チェック（`.github/workflows/handoff-check.yml`）が ✗ を つける:
- 「引き継ぎメモが ありません」… `HANDOFF.md` を 変えて いない
- 「topSecret の 作りなおし わすれ」… `index.html` が `build.py` の 出力と ちがう

## 3. 版の しくみ（なぜ 必要か）

- アプリは ひらいた とき と、ほかの アプリから もどった とき（30秒に 1回まで）に、サイトの `index.html` を キャッシュなしで 読み、その 中の `TS_BUILD` と 自分の `TS_BUILD` を くらべる。
- ちがえば、下の バーの 上に「新しい 版が あります（押すと 更新）」を 出す。押すと `?v=<新しい 版>` を つけて ひらき なおす（`?v` は ひらいた あと すぐ URL から 消す）。
- 図鑑登録メーカーは `zukan/?v=<TS_BUILD>` で iframe に 読む。`TS_BUILD` には `zukan/index.html` の 中身も ふくまれるので、図鑑登録メーカーだけ 変えた ときも、作りなおせば 版が かわる。
- だから **作りなおさないと、サイトに 上げても スマホには とどかない**（2026-11-22、ロトムの 鳴き声を 消した ときに 起きた）。

## 4. 新しい ツールを 足す とき

- topSecret の 中の 画面に する（☰メニューと 下の バー。新しい ページに 移らない）。
- 別の HTML（`zukan/` の ような もの）を iframe で 見せる ときは:
  - `src` に `?v=' + TS_BUILD` を つける。
  - `build.py` の ハッシュに その HTML も ふくめる（いまは `zukan/index.html` を ふくめて いる。ふやしたら ここに 書く）。

## 5. ほかの アプリの 版（参考）

- Poke tools … `poke-tools/index.html` の `APP_VER`（`2026.11.17a` の 形）。
- NER Converter … `converter/app.js` の `APP_VERSION` と `?v=`、`CHANGELOG.md`。
- どちらも、変えたら `HANDOFF.md` の「最新」の 行を そろえる。
