# 引き継ぎメモ — ポータル・NER Converter・Poke tools(noctis1008-wq.github.io)

## ⚠️ 必ず守ること(このプロジェクトは複数の開発者が同時に作業しています)

人間でも AI(Claude・Codex など)でも、このリポジトリで作業する人は全員、次の 3 つを守ってください。

1. **作業を始める前に**、`git pull`(または `git fetch`)で最新にしてから、この `HANDOFF.md` を読む。
   ほかの人が何をしたか・何をしている途中か・何を頼まれているかは、ここに書いてあります。
2. **作業が終わったら(コミット・PR の前に)**、下の「作業ログ」のいちばん上に記録を 1 つ足す。
   「現在の状態」「進行中・やり残し」も、変わったところを書き直す。
3. **記録のない変更はマージしない・公開しない。** 小さな修正でも 1 行は書く。
   GitHub の自動チェック(「引き継ぎメモの確認」)が、HANDOFF.md を変えずにファイルを変えたコミット・PR に ✗ を付けます。

### 記録の書き方(作業ログ)

```
### YYYY-MM-DD — だれが(名前、または「Claude(セッションのリンク)」など)
- やったこと: (版番号があれば書く。例: v81)
- 確かめたこと: (テスト・ブラウザでの確認など)
- 次の人へ: (途中の作業・気をつけること・頼まれていて未対応のこと。なければ「なし」)
```

- やさしい日本語で、あとから来た人が読んでわかるように書く。
- 公開されているリポジトリなので、他人のセーブデータの中身・個人を特定できる情報・パスワードは書かない。

---

## 現在の状態(2026-10-25 時点)

| 場所 | 中身 | 版 |
|---|---|---|
| `/`(`index.html`、画像は `img/`) | ポータル(NER PORTAL SITE) | 2026-10-21 にデザイン刷新 |
| `/converter/` | NER Converter(金銀クリスタル → 3DS VC 版のセーブ変換) | v18 |
| `/poke-tools/` | Poke tools の Web 版(個体管理・個体値ジャッジ・図鑑埋め支援 など) | 開発中 |
| `/portal/`・`/privacy.html` | 旧 URL からの転送ページ | — |

- ポータルの NER Pokémon Recovery の欄は、**Recovery がまだ非公開のため「近日公開」**で、修復依頼ページ(`repair-request/`)へつないでいる。Recovery を公開するときの戻し方は `index.html` のコメントにある。
- ポータルのフッターに © マークは付けない(運営者の希望)。
- 最新動画は youtube-nocookie の埋め込み。「エラー 153」対策で referrer を送る設定(`<meta name="referrer">` と iframe の `referrerpolicy`)を消さないこと。
- 広告(AdSense)・Google アナリティクスは削除済み(Converter v18)。
- Converter を更新するときは `converter/app.js` の `APP_VERSION`、`converter/index.html`・`privacy.html` の `?v=`、`CHANGELOG.md` をそろえる。
- Poke tools のアプリ版(Google Play / App Store)は未公開。ポータルのストアのボタンは無効にしてある。

## 進行中・やり残し

- 動画の説明欄・X に貼ってある Converter のリンクを `/converter/` に差し替える(運営者の作業)。

## ほかのリポジトリの引き継ぎメモ

3 つのサイトは同じドメイン(https://noctis1008-wq.github.io/)で、互いにリンク・データの受け渡しがあります。関係するときは、そちらの HANDOFF.md も読んでください。

- ポータル・NER Converter・Poke tools(Web 版): https://github.com/noctis1008-wq/noctis1008-wq.github.io/blob/main/HANDOFF.md
- NER Pokémon Recovery: https://github.com/noctis1008-wq/Pokemon-Save-Rescue/blob/main/HANDOFF.md
- 修復依頼ページ: https://github.com/noctis1008-wq/repair-request/blob/main/HANDOFF.md

---

## 作業ログ(新しいものが上)

### 2026-10-25 — Claude(https://claude.ai/code/session_01JUok9xt7wAbcW7ReTZmiLq)
- やったこと: 引き継ぎメモ(この HANDOFF.md)と、作業前に読む・作業後に書くルールを追加。AI 向けの `CLAUDE.md`・`AGENTS.md`、PR のチェック項目、HANDOFF.md を変えていない変更に ✗ を付ける自動チェックを追加。README の版番号を v18 に直した。
- 確かめたこと: 自動チェックが動くこと。
- 次の人へ: これからは作業のたびに、このログに記録を足してください。

### 2026-10-20 〜 10-25 — (コミット履歴から要約。この HANDOFF.md ができる前の作業)
- Poke tools(`poke-tools/`): 個体値ジャッジの追加と個体管理との連動、個体管理(テラスタイプ・タマゴ技・一覧の再デザイン)、すばやさ比べ(新しいツール)、下のタブバー、はじめての案内、バックアップのお知らせ、設定の再デザイン。図鑑埋め支援は Gemini での AI 読み取り、カメラ写真・動画からの登録と、その読み取りの改良(10-25 まで継続中)。
- 2026-10-21: Converter を NER ツール共通のデザインに(v17)、広告・アナリティクスを削除(v18)、ポータルのデザイン刷新。
- 2026-10-20(Claude): ポータルをトップ(`/`)へ、Converter を `/converter/` へ移動(v16)。旧 URL に転送ページ。Recovery の欄を近日公開にして修復依頼ページへ。© を削除。YouTube のエラー 153 対策。
