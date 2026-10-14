// ===========================================================================
// アクセスカウンター / 変換回数カウンター
//
// GitHub Pages は静的ホスティングなので、数を保存する場所が外部に必要。
// ここでは登録不要の CountAPI 互換サービスを使う。
//
// ★ 設定はここだけ
//   COUNTER_API            : カウント用APIのベースURL
//   COUNTER_KEY_VISITS     : 訪問者数のキー
//   COUNTER_KEY_CONVERSIONS: 変換回数のキー
//
//   ※ COUNTER_KEY_VISITS は既存の数を引き継ぐため名前を変えないこと。
//
// 数え方
//   訪問者数 : localStorage に記録を残し、同じブラウザからは1回しか加算しない
//              (ページビューではなく「訪問者数」に近い値にするため)
//   変換回数 : 変換が成功するたびに加算する。同じ人が何度変換しても毎回数える
//              (「何回変換が行われたか」を知りたいので重複を除かない)
//
// 失敗時の扱い
//   API に到達できない場合は、その数字を表示しない。変換機能には一切影響しない。
//
// ★ 注意
//   このAPIは登録不要な反面、キーが公開されるため第三者がURLを叩いて
//   数を増やすことができる。厳密な数値が必要な場合は、Cloudflare Workers 等で
//   自前のカウンターを立てて COUNTER_API を差し替えること。
// ===========================================================================
const COUNTER_API = "https://countapi.mileshilliard.com/api/v1";
const COUNTER_KEY_VISITS = "ner_converter_noctis1008_github_io";
const COUNTER_KEY_CONVERSIONS = "ner_converter_noctis1008_github_io_conversions";
const COUNTER_STORAGE_KEY = "ner_converter_visited";

(function counters() {
  const footer = document.querySelector("footer");
  if (!footer) return;

  const wrap = document.createElement("div");
  wrap.className = "visitor-counter";
  let shown = false;

  // 数字が1つでも取れたときだけフッターに出す
  function show(cls, label, n) {
    if (!shown) { footer.appendChild(wrap); shown = true; }
    let el = wrap.querySelector("." + cls);
    if (!el) {
      if (wrap.childNodes.length) wrap.appendChild(document.createTextNode(" · "));
      el = document.createElement("span");
      el.className = cls;
      wrap.appendChild(el);
    }
    el.textContent = label + " " + n.toLocaleString("ja-JP");
  }

  function call(path, key) {
    return fetch(`${COUNTER_API}/${path}/${encodeURIComponent(key)}`, { cache: "no-store" })
      .then(res => (res.ok ? res.json() : Promise.reject(new Error("HTTP " + res.status))))
      .then(data => {
        const n = Number(data && data.value);
        if (!Number.isFinite(n) || n < 0) throw new Error("bad value");
        return n;
      });
  }

  // --- 訪問者数 ---
  let alreadyCounted = false;
  try {
    alreadyCounted = localStorage.getItem(COUNTER_STORAGE_KEY) === "1";
  } catch (e) {
    // プライベートモード等で localStorage が使えない場合は加算しない側に倒す
    alreadyCounted = true;
  }
  call(alreadyCounted ? "get" : "hit", COUNTER_KEY_VISITS)
    .then(n => {
      if (!alreadyCounted) {
        try { localStorage.setItem(COUNTER_STORAGE_KEY, "1"); } catch (e) { /* 無視 */ }
      }
      show("counter-visits", "これまでの訪問者数", n);
    })
    .catch(() => { /* 到達できない場合は表示しない */ });

  // --- 変換回数(表示のみ。加算は変換成功時に app.js から呼ぶ) ---
  call("get", COUNTER_KEY_CONVERSIONS)
    .then(n => show("counter-conversions", "変換回数", n))
    .catch(() => { /* まだキーが無い場合もここに来る。初回の変換で作られる */ });

  // app.js から呼ばれる。変換が成功するたびに +1 して表示を更新する。
  window.nerCountConversion = function () {
    call("hit", COUNTER_KEY_CONVERSIONS)
      .then(n => show("counter-conversions", "変換回数", n))
      .catch(() => { /* 失敗しても変換自体には影響させない */ });
  };
})();
