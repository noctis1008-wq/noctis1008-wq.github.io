// テキストボックス メーカー（ウェブ版）の 中身。
// textbox.gba（テキストボックス用の ROM）と 同じ 描きかたを JavaScript で する。
// ROM の 中の 字・枠・色・▼の 絵を 使い、ROM の src/tb.c と 1ドットも ちがわない 絵を 作る（test/web_check.js で 確かめる）。
// ROM の データは ブラウザの 中だけで 読む（どこにも 送らない）。
(function (root) {
  'use strict';
  const BOX_NAMES = ['e-field', 'rs-field', 'e-battle', 'rs-battle'];
  const BOX_WIDTH = [22, 22, 26, 26];
  const FONT_E = 0, FONT_RS = 1, FONT_SAME = 255;
  const CHARMAP = {" ":0,"!":171,"-":174,".":184,"/":186,"0":161,"1":162,"2":163,"3":164,"4":165,"5":166,"6":167,"7":168,"8":169,"9":170,":":240,"?":172,"A":187,"B":188,"C":189,"D":190,"E":191,"F":192,"G":193,"H":194,"I":195,"J":196,"K":197,"L":198,"M":199,"N":200,"O":201,"P":202,"Q":203,"R":204,"S":205,"T":206,"U":207,"V":208,"W":209,"X":210,"Y":211,"Z":212,"a":213,"b":214,"c":215,"d":216,"e":217,"f":218,"g":219,"h":220,"i":221,"j":222,"k":223,"l":224,"m":225,"n":226,"o":227,"p":228,"q":229,"r":230,"s":231,"t":232,"u":233,"v":234,"w":235,"x":236,"y":237,"z":238,"Ä":241,"Ö":242,"×":185,"Ü":243,"ä":244,"ö":245,"ü":246,"…":176,"▶":239,"♀":182,"♂":181,"　":0,"。":173,"「":179,"」":180,"『":177,"』":178,"ぁ":47,"あ":1,"ぃ":48,"い":2,"ぅ":49,"う":3,"ぇ":50,"え":4,"ぉ":51,"お":5,"か":6,"が":55,"き":7,"ぎ":56,"く":8,"ぐ":57,"け":9,"げ":58,"こ":10,"ご":59,"さ":11,"ざ":60,"し":12,"じ":61,"す":13,"ず":62,"せ":14,"ぜ":63,"そ":15,"ぞ":64,"た":16,"だ":65,"ち":17,"ぢ":66,"っ":80,"つ":18,"づ":67,"て":19,"で":68,"と":20,"ど":69,"な":21,"に":22,"ぬ":23,"ね":24,"の":25,"は":26,"ば":70,"ぱ":75,"ひ":27,"び":71,"ぴ":76,"ふ":28,"ぶ":72,"ぷ":77,"へ":29,"べ":73,"ぺ":78,"ほ":30,"ぼ":74,"ぽ":79,"ま":31,"み":32,"む":33,"め":34,"も":35,"ゃ":52,"や":36,"ゅ":53,"ゆ":37,"ょ":54,"よ":38,"ら":39,"り":40,"る":41,"れ":42,"ろ":43,"わ":44,"を":45,"ん":46,"ァ":127,"ア":81,"ィ":128,"イ":82,"ゥ":129,"ウ":83,"ェ":130,"エ":84,"ォ":131,"オ":85,"カ":86,"ガ":135,"キ":87,"ギ":136,"ク":88,"グ":137,"ケ":89,"ゲ":138,"コ":90,"ゴ":139,"サ":91,"ザ":140,"シ":92,"ジ":141,"ス":93,"ズ":142,"セ":94,"ゼ":143,"ソ":95,"ゾ":144,"タ":96,"ダ":145,"チ":97,"ヂ":146,"ッ":160,"ツ":98,"ヅ":147,"テ":99,"デ":148,"ト":100,"ド":149,"ナ":101,"ニ":102,"ヌ":103,"ネ":104,"ノ":105,"ハ":106,"バ":150,"パ":155,"ヒ":107,"ビ":151,"ピ":156,"フ":108,"ブ":152,"プ":157,"ヘ":109,"ベ":153,"ペ":158,"ホ":110,"ボ":154,"ポ":159,"マ":111,"ミ":112,"ム":113,"メ":114,"モ":115,"ャ":132,"ヤ":116,"ュ":133,"ユ":117,"ョ":134,"ヨ":118,"ラ":119,"リ":120,"ル":121,"レ":122,"ロ":123,"ワ":124,"ヲ":125,"ン":126,"・":175,"ー":174,"円":183,"！":171,"－":174,"．":184,"／":186,"０":161,"１":162,"２":163,"３":164,"４":165,"５":166,"６":167,"７":168,"８":169,"９":170,"：":240,"？":172,"Ａ":187,"Ｂ":188,"Ｃ":189,"Ｄ":190,"Ｅ":191,"Ｆ":192,"Ｇ":193,"Ｈ":194,"Ｉ":195,"Ｊ":196,"Ｋ":197,"Ｌ":198,"Ｍ":199,"Ｎ":200,"Ｏ":201,"Ｐ":202,"Ｑ":203,"Ｒ":204,"Ｓ":205,"Ｔ":206,"Ｕ":207,"Ｖ":208,"Ｗ":209,"Ｘ":210,"Ｙ":211,"Ｚ":212,"ａ":213,"ｂ":214,"ｃ":215,"ｄ":216,"ｅ":217,"ｆ":218,"ｇ":219,"ｈ":220,"ｉ":221,"ｊ":222,"ｋ":223,"ｌ":224,"ｍ":225,"ｎ":226,"ｏ":227,"ｐ":228,"ｑ":229,"ｒ":230,"ｓ":231,"ｔ":232,"ｕ":233,"ｖ":234,"ｗ":235,"ｘ":236,"ｙ":237,"ｚ":238,"｡":173,"｢":179,"｣":180,"･":175};

  // ---------- ROM から データを 取りだす ----------
  // データの ならび（この 順で 1つの Uint8Array に して 保存する）
  const PARTS = [
    ['eFont', 0x2000], ['eMsgGfx', 0x1C0], ['eMsgPal', 0x20], ['eArrow', 0xC0], ['eArrowAlt', 0xC0],
    ['battleGfx', 0x2000], ['battlePal', 0x40], ['battleMap', 0x1000],
    ['rsFont', 0x4000], ['rsArrow', 0x100], ['rsMsgPal', 0x20],
  ];
  const E_ADDR = { eFont: 0x2A0F14, eMsgGfx: 0x4E85E0, eMsgPal: 0x4E87A0, eArrow: 0x29BFB8, eArrowAlt: 0x29C078 };
  const E_LZ = { battleGfx: 0xC00000, battlePal: 0xC004EC, battleMap: 0xC00530 };
  const RS_ADDR = { rsFont: 0x1B6CBC, rsArrow: 0x1BB23C, rsMsgPal: 0x1B3A1C };  // 日本版サファイア
  const SHA1_E = 'd7cf8f156ba9c455d164e1ea780a6bf1945465c2';
  const SHA1_S = '3233342c2f3087e6ffe6c1791cd5867db07df842';

  function lz77(rom, off) {
    if (rom[off] !== 0x10) throw new Error('LZ');
    const size = rom[off + 1] | rom[off + 2] << 8 | rom[off + 3] << 16;
    const out = new Uint8Array(size); let o = 0, i = off + 4;
    while (o < size) {
      const flags = rom[i++];
      for (let b = 0; b < 8 && o < size; b++) {
        if (flags & (0x80 >> b)) {
          const n = (rom[i] >> 4) + 3, disp = ((rom[i] & 15) << 8 | rom[i + 1]) + 1; i += 2;
          for (let k = 0; k < n && o < size; k++) { out[o] = out[o - disp]; o++; }
        } else out[o++] = rom[i++];
      }
    }
    return out;
  }
  function code4(rom) { return String.fromCharCode(rom[0xAC], rom[0xAD], rom[0xAE], rom[0xAF]); }
  function u32(rom, o) { return (rom[o] | rom[o + 1] << 8 | rom[o + 2] << 16 | rom[o + 3] << 24) >>> 0; }

  // roms: [{bytes: Uint8Array, sha1: '...'}]。textbox.gba 1つ、または 日本版エメラルドと 日本版サファイアの 2つ。
  function extract(roms) {
    let e = null, s = null, tb = null;
    for (const r of roms) {
      const b = r.bytes;
      if (b.length >= 0xF40020 && String.fromCharCode(...b.subarray(0xF40000, 0xF40008)) === 'TBOXDATA' && code4(b) === 'BPEJ') tb = b;
      else if (r.sha1 === SHA1_E) e = b;
      else if (r.sha1 === SHA1_S) s = b;
    }
    const src = {};
    if (tb) {
      e = tb;
      src.rsFont = u32(tb, 0xF4000C) - 0x08000000;
      src.rsArrow = u32(tb, 0xF40010) - 0x08000000;
      src.rsMsgPal = u32(tb, 0xF40014) - 0x08000000;
    } else if (e && s) {
      Object.assign(src, RS_ADDR);
    } else {
      throw new Error('textbox.gba（テキストボックス用の ROM）か、未改変の 日本版エメラルドと 日本版サファイアの 2つを えらんで ください');
    }
    const parts = {};
    for (const k in E_ADDR) parts[k] = e.subarray(E_ADDR[k], E_ADDR[k] + PARTS.find(p => p[0] === k)[1]);
    for (const k in E_LZ) parts[k] = lz77(e, E_LZ[k]);
    const rsRom = tb || s;
    for (const k of ['rsFont', 'rsArrow', 'rsMsgPal']) parts[k] = rsRom.subarray(src[k], src[k] + PARTS.find(p => p[0] === k)[1]);
    return pack(parts);
  }
  function pack(parts) {
    const total = PARTS.reduce((a, p) => a + p[1], 0);
    const out = new Uint8Array(total); let o = 0;
    for (const [k, n] of PARTS) { out.set(parts[k].subarray(0, n), o); o += n; }
    return out;
  }
  function unpack(blob) {
    const d = {}; let o = 0;
    for (const [k, n] of PARTS) { d[k] = blob.subarray(o, o + n); o += n; }
    d.eMsgPal16 = new Uint16Array(16); d.rsMsgPal16 = new Uint16Array(16); d.battlePal16 = new Uint16Array(32);
    for (let i = 0; i < 16; i++) { d.eMsgPal16[i] = d.eMsgPal[2 * i] | d.eMsgPal[2 * i + 1] << 8; d.rsMsgPal16[i] = d.rsMsgPal[2 * i] | d.rsMsgPal[2 * i + 1] << 8; }
    for (let i = 0; i < 32; i++) d.battlePal16[i] = d.battlePal[2 * i] | d.battlePal[2 * i + 1] << 8;
    return d;
  }

  // ---------- 描く（ROM の src/tb.c と 同じ）----------
  const W = 0xFFFF, H = 0x400, V = 0x800;
  function row(l, m, r) { return [...l, ...Array(22).fill(m), ...r]; }
  const FIELD_LAYOUT = [
    [ // エメラルド
      row([0, 1, 2, 3], 4, [5, 2, 6, 0]),
      row([0, 7, 0xd, 0xb], W, [0xb | H, 0xd, 0xa, 0]),
      row([0, 7, 8, 9], W, [9, 8, 0xa, 0]),
      row([0, 7, 8, 9], W, [9, 8, 0xa, 0]),
      row([0, 7 | V, 0xd | V, 0xb | V], W, [0xb | H | V, 0xd | V, 0xa | V, 0]),
      row([0, 1 | V, 2 | V, 3 | V], 4 | V, [5 | V, 2 | V, 6 | V, 0]),
    ],
    [ // ルビサファ
      row([0, 1, 2, 3], 4, [5, 2, 6, 0]),
      row([0, 7, 0xd, 0xb], W, [0xb | H, 0xd | H, 0xa, 0]),
      row([0, 7, 8, 0xc], W, [0xc | H, 8 | H, 0xa, 0]),
      row([0, 7, 8, 0xc], W, [0xc | H, 8 | H, 0xa, 0]),
      row([0, 7 | V, 0xd | V, 0xb | V], W, [0xb | H | V, 0xd | H | V, 0xa | V, 0]),
      row([0, 1 | V, 2 | V, 3 | V], 4 | V, [5 | V, 2 | V, 6 | V, 0]),
    ],
  ];
  const BOXES = [
    { battle: 0, rs: 0, winX: 4, winW: 22 }, { battle: 0, rs: 1, winX: 4, winW: 22 },
    { battle: 1, rs: 0, winX: 2, winW: 26 }, { battle: 1, rs: 1, winX: 2, winW: 26 },
  ];
  const TILE_WINDOW = 0x100, TILE_FRAME = 0x200, TILE_BLANK = 0x3FF, TEXT_PAL = 14;
  const C_BG = 1, C_FG = 2, C_SHADOW = 3, C_RED = 4;

  function fontOf(box, font) { return font === FONT_SAME ? BOXES[box].rs : font; }
  // ▼の 1こまの 長さ（1/100 びょう）。ルビサファ 6フレーム、エメラルド 9フレーム
  function arrowDelay(box, font) { return fontOf(box, font) ? 10 : 15; }

  function render(d, box, font, arrow, codes) {
    const bx = BOXES[box];
    const rsFont = fontOf(box, font);
    const yoff = rsFont ? 0 : 2;
    const winW = bx.winW, ww = winW * 8, wh = 32;
    const win = new Uint8Array(ww * wh).fill(C_BG);  // 文字の 窓（色の 番号）
    const put = (x, y, c) => { if (x >= 0 && y >= 0 && x < ww && y < wh) win[y * ww + x] = c; };
    function glyph(code, x0, y0) {
      for (let y = 0; y < 16; y++)
        for (let x = 0; x < 8; x++) {
          let v;
          if (rsFont) {
            const o = ((code >> 4) << 10) + ((code & 15) << 5) + (y >= 8 ? 512 : 0) + ((y & 7) << 2) + (x >> 1);
            v = (d.rsFont[o] >> ((x & 1) * 4)) & 15;
            v = v === 15 ? C_FG : v === 14 ? C_SHADOW : 0;
          } else {
            const o = (code >> 4) * 0x200 + ((code & 15) << 4) + (y >= 8 ? 0x100 : 0) + ((y & 7) << 1);
            const w = d.eFont[o] | d.eFont[o + 1] << 8;
            v = (w >> (14 - 2 * x)) & 3;
            v = v === 1 ? C_FG : v === 2 ? C_SHADOW : 0;
          }
          if (v) put(x0 + x, y0 + y, v);
        }
    }
    const bmpPx = (bmp, x, y) => { const b = bmp[((y >> 3) << 5) + ((y & 7) << 2) + (x >> 1)]; return (x & 1) ? b >> 4 : b & 15; };
    function drawArrow(phase, x0, top) {
      let bmp, edge, fill, src = 0;
      if (rsFont) { bmp = d.rsArrow.subarray(phase * 64); edge = 1; fill = 2; }
      else if (bx.battle) { bmp = d.eArrowAlt; edge = 1; fill = 2; src = [0, 1, 2, 1][phase]; }
      else { bmp = d.eArrow; edge = 2; fill = 4; src = [0, 1, 2, 1][phase]; }
      for (let y = 0; y < 16; y++)
        for (let x = 0; x < 8; x++) {
          const v = bmpPx(bmp, x, src + y);
          if (v === edge) put(x0 + x, top + y, C_FG); else if (v === fill) put(x0 + x, top + y, C_RED);
        }
    }
    // 色
    const pal = Array.from({ length: 16 }, () => new Uint16Array(16));
    const textPal = pal[TEXT_PAL];
    const map = [];  // 行 14〜19
    if (!bx.battle) {
      const boxPal = bx.rs ? d.rsMsgPal16 : d.eMsgPal16;
      pal[15].set(boxPal);
      textPal[C_BG] = bx.rs ? d.rsMsgPal16[15] : d.eMsgPal16[1];
      if (rsFont) { textPal[C_FG] = d.rsMsgPal16[1]; textPal[C_SHADOW] = d.rsMsgPal16[8]; textPal[C_RED] = d.rsMsgPal16[2]; }
      else { textPal[C_FG] = d.eMsgPal16[2]; textPal[C_SHADOW] = d.eMsgPal16[3]; textPal[C_RED] = d.eMsgPal16[4]; }
      const layout = FIELD_LAYOUT[bx.rs];
      for (let y = 0; y < 6; y++) {
        map.push([]);
        for (let x = 0; x < 30; x++) {
          const e = layout[y][x];
          map[y].push(e === W ? (TILE_WINDOW + (y - 1) * winW + (x - bx.winX)) | (TEXT_PAL << 12)
            : e === 0 ? TILE_BLANK : (TILE_FRAME + (e & 0x3FF)) | (e & 0xC00) | (15 << 12));
        }
      }
    } else {
      pal[0].set(d.battlePal16.subarray(0, 16)); pal[1].set(d.battlePal16.subarray(16, 32));
      textPal[C_BG] = d.battlePal16[15]; textPal[C_FG] = d.battlePal16[1];
      textPal[C_SHADOW] = d.battlePal16[rsFont ? 8 : 6]; textPal[C_RED] = d.battlePal16[2];
      for (let y = 14; y < 20; y++) {
        map.push([]);
        for (let x = 0; x < 30; x++) {
          let v = d.battleMap[(y * 32 + x) * 2] | d.battleMap[(y * 32 + x) * 2 + 1] << 8;
          if (y >= 15 && y < 19 && x >= bx.winX && x < bx.winX + winW) v = (TILE_WINDOW + (y - 15) * winW + (x - bx.winX)) | (TEXT_PAL << 12);
          map[y - 14].push(v);
        }
      }
    }
    // 文字
    let line = 0, cx = 0;
    for (const c of codes) {
      if (c === 0xFF) break;
      if (c === 0xFE) { line++; cx = 0; continue; }
      if (c >= 0xF7) continue;
      glyph(c, cx, line * 16 + yoff); cx += 8;
    }
    if (arrow >= 1 && arrow <= 4) drawArrow(arrow - 1, cx, line * 16 + yoff);
    // タイルの 1点（色の 番号）
    function tilePx(t, x, y) {
      if (t >= TILE_WINDOW && t < TILE_WINDOW + winW * 4) {
        const k = t - TILE_WINDOW; return win[((k / winW | 0) * 8 + y) * ww + (k % winW) * 8 + x];
      }
      let src, base;
      if (t >= TILE_FRAME && t < TILE_FRAME + 14) { src = d.eMsgGfx; base = (t - TILE_FRAME) * 32; }
      else if (bx.battle && t < 256) { src = d.battleGfx; base = t * 32; }
      else return 0;
      const b = src[base + y * 4 + (x >> 1)], v = (x & 1) ? b >> 4 : b & 15;
      return bx.battle && src === d.battleGfx && v === 9 ? 0 : v;  // 赤い 枠の 外の 暗い 灰色（9番）は 透明（ROM と 同じ）
    }
    const x0 = bx.battle ? 0 : 1, cols = bx.battle ? 30 : 28;
    const w = cols * 8, h = 48, rgba = new Uint8Array(w * h * 4);
    for (let ty = 0; ty < 6; ty++)
      for (let tx = 0; tx < cols; tx++) {
        const e = map[ty][x0 + tx], t = e & 0x3FF, hf = e & 0x400, vf = e & 0x800, p = e >> 12;
        for (let y = 0; y < 8; y++)
          for (let x = 0; x < 8; x++) {
            const ci = tilePx(t, hf ? 7 - x : x, vf ? 7 - y : y);
            if (!ci) continue;
            const c = pal[p][ci], o = ((ty * 8 + y) * w + tx * 8 + x) * 4;
            const r = c & 31, g = (c >> 5) & 31, b = (c >> 10) & 31;
            rgba[o] = r << 3 | r >> 2; rgba[o + 1] = g << 3 | g >> 2; rgba[o + 2] = b << 3 | b >> 2; rgba[o + 3] = 255;
          }
      }
    return { w, h, rgba };
  }

  // ---------- 文字 ----------
  // 1行を ゲームの 文字コードに。だめな 字が あれば {bad}
  function encodeLine(s) {
    const codes = [];
    for (const ch of s) {
      if (!(ch in CHARMAP)) return { bad: ch };
      codes.push(CHARMAP[ch]);
    }
    return { codes };
  }
  // 1まいぶんの 行（2行まで）→ { codes, arrow } か { error }
  function encodePage(lines, box, arrowFromText) {
    const out = []; let arrow = false;
    lines = lines.slice();
    if (arrowFromText && lines.length && lines[lines.length - 1].endsWith('▼')) { arrow = true; lines[lines.length - 1] = lines[lines.length - 1].slice(0, -1); }
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      if (l.includes('▼')) return { error: arrowFromText ? '▼ は 行の さいごに だけ 書けます' : '▼ は「▼を出す」で 出します（文には 書かないで ください）' };
      const n = [...l].length;
      if (n > BOX_WIDTH[box]) return { error: `${i + 1}行めが ${n}文字です。この 窓は 1行 ${BOX_WIDTH[box]}文字まで です` };
      const r = encodeLine(l);
      if (r.bad) return { error: `「${r.bad}」は ゲームの 字に ない ので 使えません` };
      if (i) out.push(0xFE);
      out.push(...r.codes);
    }
    out.push(0xFF);
    return { codes: out, arrow };
  }

  // テキストファイル → [{ name, box, font, lines, frame }] か { error }
  function parseBatch(text, defBox, defFont) {
    const lines = text.replace(/^﻿/, '').split('\n').map(l => l.replace(/[\s　]+$/u, ''));
    lines.push('');
    const pages = []; let cur = [], opts = {}, start = 0, count = 0;
    const isBlank = l => !l.replace(/[\s　]/gu, '');
    for (let n = 0; n < lines.length; n++) {
      const l = lines[n];
      if (l.startsWith('#')) continue;
      if (isBlank(l)) {
        if (cur.length || Object.keys(opts).length) {
          const style = opts.style || BOX_NAMES[defBox];
          const boxes = style === 'all' ? [0, 1, 2, 3] : [BOX_NAMES.indexOf(style)];
          if (boxes[0] < 0) return { error: `${start}行め: 窓「${style}」は ありません（${BOX_NAMES.join('・')}・all）` };
          let font = defFont;
          if (opts.font) { if (opts.font === 'rs') font = FONT_RS; else if (opts.font === 'e') font = FONT_E; else return { error: `${start}行め: 文字「${opts.font}」は ありません（rs・e）` }; }
          const frame = Math.min(3, Math.max(0, parseInt(opts['arrow-frame'] || '0', 10) || 0));
          const np = Math.max(1, Math.ceil(cur.length / 2));
          for (let p = 0; p < np; p++) {
            count++;
            let name = opts.name ? (np > 1 ? `${opts.name}_${p + 1}` : opts.name) : String(count).padStart(3, '0');
            for (const b of boxes)
              pages.push({ name: style === 'all' ? `${name}_${BOX_NAMES[b]}` : name, box: b, font, lines: cur.slice(p * 2, p * 2 + 2), frame, line: start });
          }
        }
        cur = []; opts = {}; start = 0;
        continue;
      }
      if (!start) start = n + 1;
      if (l.startsWith('@') && !cur.length) {
        for (const kv of l.slice(1).split(/\s+/)) { const i = kv.indexOf('='); if (i > 0) opts[kv.slice(0, i)] = kv.slice(i + 1); }
        continue;
      }
      cur.push(l);
    }
    return { pages };
  }

  // ---------- GIF（透明 1色・くりかえし）----------
  function writeGIF(frames, delayCs, scale) {
    const pal = [0], key = new Map();
    for (const f of frames)
      for (let i = 0; i < f.w * f.h; i++) {
        if (!f.rgba[i * 4 + 3]) continue;
        const c = f.rgba[i * 4] << 16 | f.rgba[i * 4 + 1] << 8 | f.rgba[i * 4 + 2];
        if (!key.has(c)) { key.set(c, pal.length); pal.push(c); }
      }
    let bits = 1; while ((1 << bits) < pal.length) bits++;
    const w = frames[0].w * scale, h = frames[0].h * scale;
    const out = [];
    const bytes = (...a) => { for (const v of a) out.push(v & 0xFF); };
    for (const c of 'GIF89a') out.push(c.charCodeAt(0));
    bytes(w, w >> 8, h, h >> 8, 0x80 | 0x70 | (bits - 1), 0, 0);
    for (let k = 0; k < (1 << bits); k++) { const c = pal[k] || 0; bytes(c >> 16, c >> 8, c); }
    if (frames.length > 1) { bytes(0x21, 0xFF, 0x0B); for (const c of 'NETSCAPE2.0') out.push(c.charCodeAt(0)); bytes(3, 1, 0, 0, 0); }
    const idx = new Uint8Array(w * h);
    for (const f of frames) {
      bytes(0x21, 0xF9, 4, (2 << 2) | 1, delayCs, delayCs >> 8, 0, 0);
      bytes(0x2C, 0, 0, 0, 0, w, w >> 8, h, h >> 8, 0);
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const o = ((y / scale | 0) * f.w + (x / scale | 0)) * 4;
          idx[y * w + x] = f.rgba[o + 3] ? key.get(f.rgba[o] << 16 | f.rgba[o + 1] << 8 | f.rgba[o + 2]) : 0;
        }
      lzw(idx, Math.max(2, bits), out);
    }
    out.push(0x3B);
    return new Uint8Array(out);
  }
  function lzw(idx, minSize, out) {
    out.push(minSize);
    const clear = 1 << minSize; let size = minSize + 1, maxCode = clear + 1;
    let dict = new Map(), bitBuf = 0, nBits = 0, block = [];
    const flushByte = b => { block.push(b); if (block.length === 255) { out.push(255, ...block); block = []; } };
    const code = (c, s) => { bitBuf |= c << nBits; nBits += s; while (nBits >= 8) { flushByte(bitBuf & 0xFF); bitBuf >>>= 8; nBits -= 8; } };
    code(clear, size);
    let cur = -1;
    for (let i = 0; i < idx.length; i++) {
      const v = idx[i];
      if (cur < 0) { cur = v; continue; }
      const k = cur << 8 | v, nx = dict.get(k);
      if (nx !== undefined) { cur = nx; continue; }
      code(cur, size);
      ++maxCode; dict.set(k, maxCode);
      if (maxCode >= (1 << size)) size++;
      if (maxCode === 4095) { code(clear, size); dict = new Map(); size = minSize + 1; maxCode = clear + 1; }
      cur = v;
    }
    code(cur, size); code(clear + 1, size);
    if (nBits) flushByte(bitBuf & 0xFF);
    if (block.length) out.push(block.length, ...block);
    out.push(0);
  }

  // ---------- PNG（圧縮なし）・ZIP（圧縮なし）----------
  const CRC = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  function crc32(buf, c = 0xFFFFFFFF) { for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xFF] ^ (c >>> 8); return c; }
  function writePNG(img, scale) {
    const w = img.w * scale, h = img.h * scale, stride = 1 + w * 4, raw = new Uint8Array(h * stride);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) raw.set(img.rgba.subarray(((y / scale | 0) * img.w + (x / scale | 0)) * 4, ((y / scale | 0) * img.w + (x / scale | 0)) * 4 + 4), y * stride + 1 + x * 4);
    const z = [0x78, 0x01]; let a = 1, b = 0;
    for (let i = 0; i < raw.length; i++) { a = (a + raw[i]) % 65521; b = (b + a) % 65521; }
    for (let p = 0; p < raw.length; p += 65535) {
      const n = Math.min(65535, raw.length - p);
      z.push(p + n >= raw.length ? 1 : 0, n & 0xFF, n >> 8, ~n & 0xFF, (~n >> 8) & 0xFF);
      for (let i = 0; i < n; i++) z.push(raw[p + i]);
    }
    z.push(b >> 8, b & 0xFF, a >> 8, a & 0xFF);
    const chunks = [];
    const chunk = (type, data) => {
      const t = [...type].map(c => c.charCodeAt(0)), len = data.length;
      const crc = (crc32(data, crc32(t)) ^ 0xFFFFFFFF) >>> 0;
      chunks.push([len >>> 24, len >> 16 & 255, len >> 8 & 255, len & 255], t, data, [crc >>> 24, crc >> 16 & 255, crc >> 8 & 255, crc & 255]);
    };
    chunk('IHDR', [w >>> 24, w >> 16 & 255, w >> 8 & 255, w & 255, h >>> 24, h >> 16 & 255, h >> 8 & 255, h & 255, 8, 6, 0, 0, 0]);
    chunk('IDAT', z); chunk('IEND', []);
    const total = 8 + chunks.reduce((s, c) => s + c.length, 0), out = new Uint8Array(total);
    out.set([137, 80, 78, 71, 13, 10, 26, 10]); let o = 8;
    for (const c of chunks) { out.set(c, o); o += c.length; }
    return out;
  }
  function writeZIP(files) {
    const enc = new TextEncoder(), parts = [], central = []; let off = 0;
    const le = (v, n) => Array.from({ length: n }, (_, i) => (v >>> (8 * i)) & 0xFF);
    for (const f of files) {
      const name = enc.encode(f.name), crc = (crc32(f.data) ^ 0xFFFFFFFF) >>> 0;
      const head = [...le(0x04034b50, 4), 20, 0, 0, 8, 0, 0, 0, 0, 0, 0, ...le(crc, 4), ...le(f.data.length, 4), ...le(f.data.length, 4), ...le(name.length, 2), 0, 0];
      parts.push(new Uint8Array(head), name, f.data);
      central.push(new Uint8Array([...le(0x02014b50, 4), 20, 0, 20, 0, 0, 8, 0, 0, 0, 0, 0, 0, ...le(crc, 4), ...le(f.data.length, 4), ...le(f.data.length, 4), ...le(name.length, 2), 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ...le(off, 4)]), name);
      off += head.length + name.length + f.data.length;
    }
    const cenSize = central.reduce((s, c) => s + c.length, 0);
    const end = new Uint8Array([...le(0x06054b50, 4), 0, 0, 0, 0, ...le(files.length, 2), ...le(files.length, 2), ...le(cenSize, 4), ...le(off, 4), 0, 0]);
    const all = [...parts, ...central, end], out = new Uint8Array(all.reduce((s, c) => s + c.length, 0)); let o = 0;
    for (const c of all) { out.set(c, o); o += c.length; }
    return out;
  }

  const api = { BOX_NAMES, BOX_WIDTH, FONT_E, FONT_RS, FONT_SAME, extract, unpack, render, encodePage, parseBatch, fontOf, arrowDelay, writeGIF, writePNG, writeZIP };
  if (typeof module !== 'undefined') module.exports = api; else root.TB = api;
})(this);
