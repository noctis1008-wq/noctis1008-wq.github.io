// ===========================================================================
// NER Converter
//
// バージョンは連番。更新のたびに 1 つ増やす。
// 旧 ZIP の v1 … v7 の続きとして v8 から開始している。
// この値・配布 ZIP のファイル名・CHANGELOG.md の 3 つを必ず一致させること。
// ===========================================================================
const APP_VERSION = "8";
const APP_VERSION_DATE = "2026-09-21";

// ---------------------------------------------------------------------------
// セーブ構造の根拠 (2026-09-21 に日本語版ROMの実バイトで確定)
//
// ゲーム本体がSRAMへ転送するゲームデータの長さは、ROM内のセーブルーチンの
// 即値で確定できる。主セーブは SRAM bank1 $A009 (= file 0x2009)、
// 副セーブは SRAM bank3 $B209 (= file 0x7209)。
//
//   日本語版 金・銀  (POKEMON_GLD/SLV):  ld bc,$0C83 = 3203 バイト
//     ROM 0x014D8F: 21 09 A0 | 01 83 0C | 3E 01 ... EA 0D AD  (主, 0x2D0D へ格納)
//     ROM 0x014E07: 21 09 B2 | 01 83 0C | 3E 03 ... EA 0D BF  (副, 0x7F0D へ格納)
//
//   日本語版 クリスタル (PM_CRYSTAL):     ld bc,$0ADA = 2778 バイト
//     ROM 0x014DF5: 21 09 A0 | 01 DA 0A | 3E 01
//     ROM 0x014E6D: 21 09 B2 | 01 DA 0A | 3E 03
//
// 各ゲームデータ末尾からチェックサム直前までは「パディング」であり、
// ゲームが読み戻さない領域である。実機カートリッジではここにプレイ履歴依存の
// ゴミ値が残るが、VC版が正規に作るセーブでは 00 である。ゴミ値が残っていると
// ポケムーバーがセーブを認識しない (クリスタルで実測・対照実験で確認済み)。
// よってパディングは主・副の両方をクリアする。
//
// 注意: 英語版 (pokecrystal / pokegold) のオフセットを日本語版に使ってはならない。
// 日本語版の名前フィールドは 6 バイト、英語版は 11 バイトで、累積差が
// クリスタルではちょうど 160 バイトになる。この誤適用が過去の不具合の原因だった。
// ---------------------------------------------------------------------------

const GS_INPUT_SIZE = 0x8000;
const GS_VC_SIZE = 0x8010;
const CRYSTAL_INPUT_SIZE = 0x10000;
const CRYSTAL_VC_SIZE = 0x10010;

// 金・銀: ゲームデータ 3203 バイト (0x0C83)
const PRIMARY_START = 0x2009;
const PRIMARY_END = 0x2C8B;          // 0x2009 + 0x0C83 - 1
const PRIMARY_CHECKSUM = 0x2D0D;
const SECONDARY_START = 0x7209;
const SECONDARY_END = 0x7E8B;        // 0x7209 + 0x0C83 - 1
const SECONDARY_CHECKSUM = 0x7F0D;
const GS_PATCH1_START = 0x2C8C;      // 主パディング (129 バイト)
const GS_PATCH1_END = 0x2D0C;
const GS_PATCH2_START = 0x7E8C;      // 副パディング (129 バイト)
const GS_PATCH2_END = 0x7F0C;

// クリスタル: ゲームデータ 2778 バイト (0x0ADA)
const CRYSTAL_PRIMARY_START = 0x2009;
const CRYSTAL_PRIMARY_END = 0x2AE2;  // 0x2009 + 0x0ADA - 1
const CRYSTAL_PRIMARY_CHECKSUM = 0x2D0D;
const CRYSTAL_SECONDARY_START = 0x7209;
const CRYSTAL_SECONDARY_END = 0x7CE2; // 0x7209 + 0x0ADA - 1
const CRYSTAL_SECONDARY_CHECKSUM = 0x7F0D;
const CRYSTAL_PATCH1_START = 0x2AE3; // 主パディング (554 バイト)
const CRYSTAL_PATCH1_END = 0x2D0C;
const CRYSTAL_PATCH2_START = 0x7CE3; // 副パディング (554 バイト)
const CRYSTAL_PATCH2_END = 0x7F0C;

// VC セーブ末尾 16 バイトのフッター。3DS VC が正規に作ったセーブから採取した実測値。
//
//            +0x00        +0x04        +0x08        +0x0C
//   金・銀   33 01 00 00  00 00 00 00  41 AB 5A AA  1F 00 00 00
//   クリスタル 1B 34 12 07  00 00 00 00  76 10 5B AA  1F 00 00 00
//
// +0x04 と +0x0C は両ゲームで同一。+0x08 は単調増加するカウンタらしい値
// (差 0x6535)。各フィールドの意味は未確定のため、既知の正常値をそのまま使う。
// 推測値を入れてはならない。

// 日本語版クリスタルの正常動作する VC sav.dat から採取。
const CRYSTAL_VC_FOOTER = new Uint8Array([
  0x1B, 0x34, 0x12, 0x07, 0x00, 0x00, 0x00, 0x00,
  0x76, 0x10, 0x5B, 0xAA, 0x1F, 0x00, 0x00, 0x00
]);

// 日本語版シルバーの正常動作する VC sav.dat から採取 (2026-09-21)。
// 金と銀は同一エンジンのため金にも使用するが、金の実機検証は未実施。
const GS_VC_FOOTER = new Uint8Array([
  0x33, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x41, 0xAB, 0x5A, 0xAA, 0x1F, 0x00, 0x00, 0x00
]);

const fileInput = document.getElementById("file");
const drop = document.getElementById("drop");
const status = document.getElementById("status");
const result = document.getElementById("result");
const game = document.getElementById("game");
const sizeEl = document.getElementById("size");
const checksum = document.getElementById("checksum");
const download = document.getElementById("download");

let outputBytes = null;

function le16(bytes, p) {
  return bytes[p] | (bytes[p + 1] << 8);
}

function sum16(bytes, start, endInclusive) {
  let s = 0;
  for (let i = start; i <= endInclusive; i++) s = (s + bytes[i]) & 0xFFFF;
  return s;
}

function isJapaneseGS(bytes) {
  if (bytes.length < GS_INPUT_SIZE) return false;
  const primary = sum16(bytes, PRIMARY_START, PRIMARY_END);
  const primaryStored = le16(bytes, PRIMARY_CHECKSUM);
  const secondary = sum16(bytes, SECONDARY_START, SECONDARY_END);
  const secondaryStored = le16(bytes, SECONDARY_CHECKSUM);
  return primary === primaryStored && secondary === secondaryStored;
}

function isJapaneseCrystal(bytes) {
  if (bytes.length < CRYSTAL_INPUT_SIZE) return false;
  const primary = sum16(bytes, CRYSTAL_PRIMARY_START, CRYSTAL_PRIMARY_END);
  const primaryStored = le16(bytes, CRYSTAL_PRIMARY_CHECKSUM);
  const secondary = sum16(bytes, CRYSTAL_SECONDARY_START, CRYSTAL_SECONDARY_END);
  const secondaryStored = le16(bytes, CRYSTAL_SECONDARY_CHECKSUM);
  return primary === primaryStored && secondary === secondaryStored;
}

function showError(message) {
  status.textContent = message;
  status.className = "status error";
  result.classList.add("hidden");
}

async function convert(file) {
  status.textContent = "セーブデータを解析しています…";
  status.className = "status";
  result.classList.add("hidden");

  const buffer = await file.arrayBuffer();
  const input = new Uint8Array(buffer);
  let vc;
  let gameName;
  let outputSize;

  if (isJapaneseCrystal(input)) {
    // Japanese Crystal uses a 0x10000-byte save area. Additional emulator
    // data (for example in a 0x20000-byte .sav) is intentionally ignored.
    vc = new Uint8Array(CRYSTAL_VC_SIZE);
    vc.set(input.subarray(0, CRYSTAL_INPUT_SIZE));
    vc.set(CRYSTAL_VC_FOOTER, CRYSTAL_INPUT_SIZE);

    // ゲームデータ (2778 バイト) の外側のパディングをクリアする。
    // 実機カートリッジではここにゴミ値が残り、ポケムーバーが認識しない。
    // ゲームデータは 1 バイトも失われない。
    vc.fill(0x00, CRYSTAL_PATCH1_START, CRYSTAL_PATCH1_END + 1);
    vc.fill(0x00, CRYSTAL_PATCH2_START, CRYSTAL_PATCH2_END + 1);

    if (sum16(vc, CRYSTAL_PRIMARY_START, CRYSTAL_PRIMARY_END) !== le16(vc, CRYSTAL_PRIMARY_CHECKSUM) ||
        sum16(vc, CRYSTAL_SECONDARY_START, CRYSTAL_SECONDARY_END) !== le16(vc, CRYSTAL_SECONDARY_CHECKSUM)) {
      throw new Error("クリスタル変換後のチェックサム検証に失敗しました。ファイルは出力しませんでした。");
    }

    gameName = "日本語版 ポケットモンスター クリスタル";
    outputSize = CRYSTAL_VC_SIZE;
  } else if (isJapaneseGS(input)) {
    // 先頭 0x8000 バイトだけを使う。これより大きい入力 (エミュレータのRTC付加分など)
    // の余剰バイトが末尾 16 バイトへ流れ込まないようにする。
    vc = new Uint8Array(GS_VC_SIZE);
    vc.set(input.subarray(0, GS_INPUT_SIZE));
    vc.set(GS_VC_FOOTER, GS_INPUT_SIZE);

    // ゲームデータ (3203 バイト) の外側のパディングを主・副とも クリアする。
    // 副側 (0x7E8C-0x7F0C) は以前クリアされておらず、実機セーブのゴミ値が
    // そのまま残っていた。クリスタルで同じ状態がポケムーバー認識失敗を
    // 引き起こすことが対照実験で確認されている。
    vc.fill(0x00, GS_PATCH1_START, GS_PATCH1_END + 1);
    vc.fill(0x00, GS_PATCH2_START, GS_PATCH2_END + 1);

    if (sum16(vc, PRIMARY_START, PRIMARY_END) !== le16(vc, PRIMARY_CHECKSUM) ||
        sum16(vc, SECONDARY_START, SECONDARY_END) !== le16(vc, SECONDARY_CHECKSUM)) {
      throw new Error("金・銀変換後のチェックサム検証に失敗しました。ファイルは出力しませんでした。");
    }

    gameName = "日本語版 ポケットモンスター 金・銀";
    outputSize = GS_VC_SIZE;
  } else {
    if (input.length < GS_INPUT_SIZE) {
      throw new Error("32 KiB未満のファイルです。日本語版 金・銀・クリスタルの通常セーブではない可能性があります。");
    }
    throw new Error("日本語版ポケットモンスター金・銀・クリスタルのセーブとしてチェックサムを確認できませんでした。別言語版、破損セーブなどは現在非対応です。");
  }

  outputBytes = vc;
  game.textContent = gameName;
  sizeEl.textContent = `${input.length.toLocaleString()} bytes → ${outputSize.toLocaleString()} bytes`;
  checksum.textContent = "正常";
  status.textContent = "変換に成功しました。";
  status.className = "status";
  result.classList.remove("hidden");
}

fileInput.addEventListener("change", () => {
  if (fileInput.files.length) convert(fileInput.files[0]).catch(e => showError(e.message));
});

["dragenter", "dragover"].forEach(type => {
  drop.addEventListener(type, e => {
    e.preventDefault();
    drop.classList.add("drag");
  });
});
["dragleave", "drop"].forEach(type => {
  drop.addEventListener(type, e => {
    e.preventDefault();
    drop.classList.remove("drag");
  });
});
drop.addEventListener("drop", e => {
  const file = e.dataTransfer.files[0];
  if (file) convert(file).catch(err => showError(err.message));
});

download.addEventListener("click", () => {
  if (!outputBytes) return;
  const blob = new Blob([outputBytes], {type: "application/octet-stream"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "sav.dat";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

// フッターにバージョンを表示する。公開中のサイトがどの版かを確認できるようにするため。
(function showVersion() {
  const footer = document.querySelector("footer");
  if (!footer) return;
  const span = document.createElement("span");
  span.className = "app-version";
  span.textContent = " · v" + APP_VERSION + " (" + APP_VERSION_DATE + ")";
  const firstLink = footer.querySelector("a");
  if (firstLink && firstLink.parentNode === footer) {
    footer.insertBefore(span, firstLink.nextSibling);
  } else {
    footer.appendChild(span);
  }
})();
