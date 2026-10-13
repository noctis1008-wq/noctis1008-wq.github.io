// ===========================================================================
// アクセスカウンター
//
// GitHub Pages は静的ホスティングなので、数を保存する場所が外部に必要。
// ここでは登録不要の CountAPI 互換サービスを使う。
//
// ★ 設定はこの2つだけ
//   COUNTER_API : カウント用APIのベースURL
//   COUNTER_KEY : このサイト専用のキー名(他サイトと衝突しない固有の名前)
//
// 仕様
//   - localStorage に記録を残し、同じブラウザからは1回しか加算しない
//     (ページビューではなく「訪問者数」に近い値にするため)
//   - API に到達できない場合はカウンターを表示しない(壊れた表示を出さない)
//   - 数字の取得に失敗してもサイトの変換機能には一切影響しない
//
// ★ 注意
//   このAPIは登録不要な反面、キーが公開されるため第三者がURLを叩いて
//   数を増やすことができる。厳密な数値が必要な場合は、Cloudflare Workers 等で
//   自前のカウンターを立てて COUNTER_API を差し替えること。
// ===========================================================================
const COUNTER_API = "https://countapi.mileshilliard.com/api/v1";
const COUNTER_KEY = "ner_converter_noctis1008_github_io";
const COUNTER_STORAGE_KEY = "ner_converter_visited";

(function visitorCounter() {
  const footer = document.querySelector("footer");
  if (!footer) return;

  let alreadyCounted = false;
  try {
    alreadyCounted = localStorage.getItem(COUNTER_STORAGE_KEY) === "1";
  } catch (e) {
    // プライベートモード等で localStorage が使えない場合は毎回 /get にする
    alreadyCounted = true;
  }

  const endpoint = alreadyCounted
    ? `${COUNTER_API}/get/${encodeURIComponent(COUNTER_KEY)}`
    : `${COUNTER_API}/hit/${encodeURIComponent(COUNTER_KEY)}`;

  fetch(endpoint, { cache: "no-store" })
    .then(res => (res.ok ? res.json() : Promise.reject(new Error("HTTP " + res.status))))
    .then(data => {
      const n = Number(data && data.value);
      if (!Number.isFinite(n) || n < 0) return;

      if (!alreadyCounted) {
        try { localStorage.setItem(COUNTER_STORAGE_KEY, "1"); } catch (e) { /* 無視 */ }
      }

      const el = document.createElement("div");
      el.className = "visitor-counter";
      el.textContent = "これまでの訪問者数 " + n.toLocaleString("ja-JP");
      footer.appendChild(el);
    })
    .catch(() => {
      // 到達できない・落ちている場合は何も表示しない
    });
})();
