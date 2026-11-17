# テキストボックス メーカー → Dropbox「動画用素材」への 保存

ボタン「この ページ」「ぜんぶ」で、作った 画像（PNG / GIF）を Dropbox の `/動画用素材` フォルダに 送ります。
ブラウザから 直接 Dropbox に つなぎます（サーバーは ありません）。つなぐ 鍵は その 端末の ブラウザに だけ 保存されます。

## はじめに 1回だけ: Dropbox の アプリを 作る

1. https://www.dropbox.com/developers/apps を ひらき「Create app」。
2. 「Scoped access」→「Full Dropbox」→ 名前は 何でも よい（例: `ner-textbox-maker`）。
3. 「Permissions」タブで `files.content.write` に チェック →「Submit」。
4. 「Settings」タブ:
   - 「OAuth 2 → Redirect URIs」に `https://noctis1008-wq.github.io/topsecret/` を 追加。
   - 「Allow public clients (Implicit Grant & PKCE)」は「Allow」。
   - 「App key」を コピー（App secret は いりません。どこにも 書かない）。
5. テキストボックス メーカーの「くわしい 設定」→ Dropbox の「App key」に はりつける。
6. 「この ページ」か「ぜんぶ」を 押す → Dropbox の 画面で「許可」→ もどったら もう一度 押す。

- ファイル名は `<窓の 種類>_<日時>_<ページ>.png|gif`。同じ 名前が あれば Dropbox が 番号を つけます。
- 「Dropbox との つながりを 切る」で その 端末の 鍵を 消します。
- App key は 公開されても 問題ない 値なので、`app.js` の `APP_KEY` に 書いて 入力を はぶいても よい。
