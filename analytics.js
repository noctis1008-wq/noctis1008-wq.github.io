// ===========================================================================
// Google Analytics (GA4)
//
// ★ 設置手順
//   1. https://analytics.google.com/ でプロパティを作成する
//   2. 「管理」→「データストリーム」→ ウェブ → サイトのURLを登録
//   3. 表示される「測定ID」(G- で始まる文字列) を下の GA_MEASUREMENT_ID に貼る
//
// 測定IDを入れるまでは何も読み込まれないので、このままでもサイトは正常に動く。
// index.html と privacy.html の両方がこのファイルを読み込んでいる。
// ===========================================================================
const GA_MEASUREMENT_ID = "G-XXXXXXXXXX";

(function loadAnalytics() {
  // 測定IDが未設定のあいだは何もしない
  if (!GA_MEASUREMENT_ID || GA_MEASUREMENT_ID === "G-XXXXXXXXXX") return;

  const s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(GA_MEASUREMENT_ID);
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", GA_MEASUREMENT_ID);
})();
