/* NER's topSecret: Poke tools と 同じ しくみの 1ページの アプリ（☰メニュー＋下のバー。A案、2026-11-17）
   ツール: テキストボックス メーカー（tb）・出現ずかん（ner、Poke tools から 移した）・ROM・説明書（links）
   ツールを ひらいても ページは かわらない（#tb・#ner・#links で 直接 ひらける） */
const KEY = 'ner-topsecret-v1';
let S = {};
try { S = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { S = {}; }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S, (k, v) => k === '_c' || k === '_s' ? undefined : v)); } catch (e) {} };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const toastEl = document.getElementById('toast'); let toastTm = 0;
function toast(msg, ms = 3200) { toastEl.textContent = msg; toastEl.hidden = false; clearTimeout(toastTm); toastTm = setTimeout(() => toastEl.hidden = true, ms); }

// 出現ずかん: Poke tools で 読みこんで いた セーブの 情報を 引きつぐ（同じ サイトなので 同じ 端末の 保存を 読める）
if (!S.ner || !S.ner.sv) {
  try { const p = JSON.parse(localStorage.getItem('ev-counter-v2')); if (p && p.ner && p.ner.sv) { S.ner = Object.assign({}, p.ner); save(); } } catch (e) {}
}

/*NERJS*/


/* ---------- Dropbox（テキストボックス メーカーの 画像を「動画用素材」に 保存） ----------
   Dropbox の アプリ（App key）で つなぐ（OAuth の PKCE。秘密の 鍵は いらない）。
   鍵（トークン）は この 端末の 保存（ner-topsecret-v1 の dbx）に だけ 置く。作りかたは src/README_dropbox.md */
const DBX = (() => {
  const FOLDER = '/動画用素材';
  const APP_KEY = '';  // ここに App key を 書けば、画面で 入れなくて よい（App key は 公開されても よい 値）
  const REDIRECT = location.origin + location.pathname;
  const key = () => ((S.dbx && S.dbx.key) || APP_KEY).trim();
  const tok = () => S.dbx && S.dbx.tok;
  const b64url = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const rand = n => b64url(crypto.getRandomValues(new Uint8Array(n)));
  // Dropbox-API-Arg の ヘッダーには ASCII しか 書けないので、日本語は \uXXXX に する
  const argHeader = o => JSON.stringify(o).replace(/[\u007f-￿]/g, c => '\\u' + ('000' + c.charCodeAt(0).toString(16)).slice(-4));
  async function connect() {
    if (!key()) throw new Error('くわしい 設定で Dropbox の App key を 入れて ください');
    const verifier = rand(48), state = rand(16);
    const challenge = b64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
    try { sessionStorage.setItem('tbDbx', JSON.stringify({ verifier, state })); } catch (e) {}
    const q = new URLSearchParams({ client_id: key(), response_type: 'code', code_challenge: challenge, code_challenge_method: 'S256',
      redirect_uri: REDIRECT, token_access_type: 'offline', state });
    location.href = 'https://www.dropbox.com/oauth2/authorize?' + q;
  }
  async function tokenReq(params) {
    const r = await fetch('https://api.dropboxapi.com/oauth2/token', { method: 'POST', body: new URLSearchParams(Object.assign({ client_id: key() }, params)) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.access_token) throw new Error('Dropbox に つなげませんでした（' + (j.error_description || j.error || r.status) + '）');
    S.dbx = S.dbx || {};
    S.dbx.tok = { a: j.access_token, r: j.refresh_token || (S.dbx.tok && S.dbx.tok.r), exp: Date.now() + (j.expires_in || 14400) * 1000 };
    save();
  }
  // Dropbox の 画面から もどって きた とき（?code=…）
  async function handleReturn() {
    const q = new URLSearchParams(location.search);
    if (!q.has('code') && !q.has('error')) return null;
    let pend = {}; try { pend = JSON.parse(sessionStorage.getItem('tbDbx') || '{}'); sessionStorage.removeItem('tbDbx'); } catch (e) {}
    try { history.replaceState(null, '', location.pathname + '#tb'); } catch (e) {}
    if (q.has('error')) return 'Dropbox に つなぐのを やめました';
    if (!pend.verifier || q.get('state') !== pend.state) return 'Dropbox に つなげませんでした（もう一度 ためして ください）';
    await tokenReq({ code: q.get('code'), grant_type: 'authorization_code', code_verifier: pend.verifier, redirect_uri: REDIRECT });
    return 'Dropbox に つながりました';
  }
  async function access() {
    const t = tok(); if (!t) return null;
    if (t.exp > Date.now() + 60000) return t.a;
    if (!t.r) return null;
    await tokenReq({ grant_type: 'refresh_token', refresh_token: t.r });
    return tok().a;
  }
  async function upload(name, bytes) {
    const a = await access(); if (!a) throw new Error('need-connect');
    const r = await fetch('https://content.dropboxapi.com/2/files/upload', { method: 'POST',
      headers: { Authorization: 'Bearer ' + a, 'Content-Type': 'application/octet-stream', 'Dropbox-API-Arg': argHeader({ path: FOLDER + '/' + name, mode: 'add', autorename: true, mute: true }) },
      body: new Blob([bytes]) });
    if (r.status === 401) { S.dbx.tok = null; save(); throw new Error('need-connect'); }
    const txt = await r.text().catch(() => ''); let j = {}; try { j = JSON.parse(txt); } catch (e) {}
    // 400 は 中身が ふつうの 文なので、それも 出す（原因が わかる ように）
    if (!r.ok) throw new Error('Dropbox に 保存 できませんでした（' + r.status + ' ' + (j.error_summary || txt).slice(0, 160) + '）');
    return j.name || name;
  }
  function off() { if (S.dbx) { S.dbx.tok = null; save(); } }
  return { FOLDER, key, connected: () => !!tok(), connect, handleReturn, upload, off };
})();

/* ---------- テキストボックス メーカー ---------- */
const TBX = (() => {
  const $ = id => document.getElementById(id);
  let data = null, cur = 0, frames = [], fidx = 0, timer = 0, saveCap = null;
  let P = { info: [], pages: [], w: 22 };

  // 保存: claude.ai の 中では downloads、スマホは 共有メニュー、ほかは ふつうの ダウンロード
  try { if (window.claude && window.claude.use) window.claude.use('downloads').then(d => { saveCap = d; }).catch(() => {}); } catch (e) {}
  async function saveFile(name, bytes) {
    if (saveCap) {
      try { await saveCap.save({ filename: name, data: new Blob([bytes]) }); return '保存しました: ' + name; }
      catch (e) { if (e && e.code === 'declined') return '保存を やめました'; }
    }
    try {
      const type = name.endsWith('.png') ? 'image/png' : name.endsWith('.gif') ? 'image/gif' : 'application/zip';
      const file = new File([bytes], name, { type });
      if (matchMedia('(pointer:coarse)').matches && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file] });
        return '保存しました: ' + name;
      }
    } catch (e) { if (e && e.name === 'AbortError') return '保存を やめました'; }
    try {
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([bytes])); a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      return '保存しました: ' + name;
    } catch (e) { return '保存 できませんでした'; }
  }

  // ROM の データ（字・枠の 絵）を この 端末に おぼえる（前の /textbox-maker/ と 同じ 場所）
  function idb(mode, fn) {
    return new Promise((res, rej) => {
      try {
        const r = indexedDB.open('textbox-maker', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('data');
        r.onsuccess = () => { const tx = r.result.transaction('data', mode); const q = fn(tx.objectStore('data')); tx.oncomplete = () => res(q && q.result); tx.onerror = () => rej(tx.error); };
        r.onerror = () => rej(r.error);
      } catch (e) { rej(e); }
    });
  }
  async function sha1(buf) { const h = await crypto.subtle.digest('SHA-1', buf); return [...new Uint8Array(h)].map(b => b.toString(16).padStart(2, '0')).join(''); }
  $('tbRom').addEventListener('change', async ev => {
    const m = $('tbSetupMsg'); m.className = 'tb-msg'; m.textContent = '読んで います…';
    try {
      const roms = [];
      for (const f of ev.target.files) { const b = new Uint8Array(await f.arrayBuffer()); roms.push({ bytes: b, sha1: await sha1(b) }); }
      const blob = TB.extract(roms);
      try { await idb('readwrite', s => s.put(blob, 'blob')); } catch (e) {}
      start(blob);
    } catch (e) { m.className = 'tb-msg err'; m.textContent = e.message || String(e); }
    ev.target.value = '';
  });
  $('tbReset').addEventListener('click', async () => {
    try { await idb('readwrite', s => s.delete('blob')); } catch (e) {}
    data = null; clearInterval(timer); $('tbApp').hidden = true; $('tbSetup').hidden = false;
  });
  function start(blob) { data = TB.unpack(blob); $('tbSetup').hidden = true; $('tbApp').hidden = false; refresh(); fit(); }

  function seg(id, onChange) {
    const g = $(id);
    g.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      for (const x of g.children) x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
      onChange();
    });
    return () => g.querySelector('[aria-pressed=true]').dataset.v;
  }
  const boxV = seg('tbBox', refresh), fontV = seg('tbFont', refresh), fmt = seg('tbFmt', () => {});
  const box = () => +boxV(), font = () => +fontV();

  // 文 → ページ（2行ずつ。空の 行でも 区切る）
  function paginate(text) {
    const lines = text.replace(/\r/g, '').split('\n');
    const w = TB.BOX_WIDTH[box()];
    const info = lines.map(l => {
      const chars = [...l], bad = new Set();
      chars.forEach((c, i) => { if (c === '▼' || !TB.encodePage([c], box(), false).codes) bad.add(i); });
      return { text: l, n: chars.length, chars, bad, over: chars.length > w };
    });
    const pages = []; let grp = [];
    const flush = () => { for (let i = 0; i < grp.length; i += 2) pages.push(grp.slice(i, i + 2)); grp = []; };
    info.forEach((l, i) => { if (!l.text.replace(/[\s　]/gu, '')) flush(); else grp.push(i); });
    flush();
    return { info, pages, w };
  }
  function pageOfLine(li) {
    const k = P.pages.findIndex(p => p.includes(li)); if (k >= 0) return k;
    const after = P.pages.findIndex(p => p[0] > li); return after >= 0 ? after : Math.max(0, P.pages.length - 1);
  }
  const pageCodes = k => TB.encodePage(P.pages[k].map(i => P.info[i].text), box(), false);
  const hasArrow = k => k < P.pages.length - 1 || $('tbLastArrow').checked;

  // 入力欄の しるし（だめな 字・長すぎる 行・いまの ページ）
  function decorate() {
    const curSet = new Set(P.pages[cur] || []);
    $('tbMir').innerHTML = P.info.map((l, i) => {
      const body = l.chars.map((c, j) => l.bad.has(j) || j >= P.w ? `<mark>${esc(c)}</mark>` : esc(c)).join('');
      return curSet.has(i) ? `<span class="pg">${body || ' '}</span>` : body + '\n';
    }).join('');
    $('tbGut').innerHTML = P.info.map(l => !l.n ? '<span class="blank">0</span>' : `<span class="${l.over || l.bad.size ? 'bad' : ''}">${l.n}/${P.w}</span>`).join('\n');
    const t = $('tbText'); t.style.height = (P.info.length * 28 + 16 + (t.offsetHeight - t.clientHeight)) + 'px';
  }
  function refresh() {
    if (!data) return;
    P = paginate($('tbText').value);
    if (document.activeElement === $('tbText')) cur = pageOfLine(caretLine());
    cur = Math.min(cur, Math.max(0, P.pages.length - 1));
    show();
  }
  function show() {
    clearInterval(timer); frames = []; fidx = 0;
    decorate();
    const n = P.pages.length;
    $('tbPno').textContent = n ? `${cur + 1} / ${n}` : '0 / 0';
    $('tbPrev').disabled = cur <= 0; $('tbNext').disabled = cur >= n - 1;
    const bads = P.info.map((l, i) => l.over ? `${i + 1}行めが ${l.n}文字（${P.w}文字まで）` : l.bad.size ? `${i + 1}行めの「${[...l.bad].map(j => l.chars[j]).join('')}」は 使えません` : '').filter(Boolean);
    let err = '';
    if (!n) err = '文を 入力して ください';
    else {
      const r = pageCodes(cur);
      if (r.error) { const ln = P.pages[cur].map(i => i + 1); err = bads.find(b => ln.some(x => b.startsWith(x + '行め'))) || r.error; }
      else frames = hasArrow(cur) ? [1, 2, 3, 4].map(a => TB.render(data, box(), font(), a, r.codes)) : [TB.render(data, box(), font(), 0, r.codes)];
    }
    $('tbPmsg').textContent = err || (bads.length ? `ほかの ページ: ${bads[0]}` : '');
    $('tbSaveOne').disabled = $('tbDbxOne').disabled = !frames.length; $('tbSaveAll').disabled = $('tbDbxAll').disabled = !n || bads.length > 0;
    draw();
    if (frames.length > 1 && !$('vTb').hidden) timer = setInterval(() => { fidx = (fidx + 1) % frames.length; draw(); }, TB.arrowDelay(box(), font()) * 10);
  }
  function draw() {
    const c = $('tbView'), ctx = c.getContext('2d');
    if (!frames.length) { ctx.clearRect(0, 0, c.width, c.height); c.style.opacity = .2; return; }
    const f = frames[fidx]; c.style.opacity = 1;
    if (c.width !== f.w) { c.width = f.w; c.height = f.h; fit(); }
    ctx.putImageData(new ImageData(new Uint8ClampedArray(f.rgba), f.w, f.h), 0, 0);
  }
  // ドットが にじまない ように、画面の 画素の 整数倍で 大きく する（小さすぎる ときは 幅いっぱい）
  function fit() {
    const c = $('tbView'), st = c.parentElement, dpr = window.devicePixelRatio || 1;
    const room = Math.min(st.clientWidth - 16, 720);
    if (room <= 0) return;
    let k = Math.max(1, Math.floor(room * dpr / c.width)) / dpr;
    if (c.width * k < room * 0.8) k = room / c.width;
    c.style.width = (c.width * k) + 'px'; c.style.height = (c.height * k) + 'px';
  }
  new ResizeObserver(fit).observe($('tbView').parentElement);

  function caretLine() { const t = $('tbText'); return t.value.slice(0, t.selectionStart).split('\n').length - 1; }
  function followCaret() {
    if (!data || document.activeElement !== $('tbText')) return;
    const k = pageOfLine(caretLine());
    if (k !== cur) { cur = k; show(); }
  }
  $('tbText').addEventListener('input', refresh);
  $('tbText').addEventListener('scroll', () => { $('tbMir').style.transform = `translate(${-$('tbText').scrollLeft}px,0)`; });
  for (const ev of ['keyup', 'click', 'focus']) $('tbText').addEventListener(ev, followCaret);
  document.addEventListener('selectionchange', followCaret);
  $('tbPrev').addEventListener('click', () => { if (cur > 0) { cur--; show(); } });
  $('tbNext').addEventListener('click', () => { if (cur < P.pages.length - 1) { cur++; show(); } });
  for (const id of ['tbLastArrow', 'tbAframe']) $(id).addEventListener('change', show);

  const scale = () => +$('tbScale').value;
  function pageFile(k, codes) {
    const g = fmt() === 'gif', ar = hasArrow(k), sc = scale();
    if (g && ar) return TB.writeGIF([1, 2, 3, 4].map(a => TB.render(data, box(), font(), a, codes)), TB.arrowDelay(box(), font()), sc);
    const im = TB.render(data, box(), font(), ar ? +$('tbAframe').value + 1 : 0, codes);
    return g ? TB.writeGIF([im], 0, sc) : TB.writePNG(im, sc);
  }
  const base = () => TB.BOX_NAMES[box()];
  $('tbSaveOne').addEventListener('click', async () => {
    const r = pageCodes(cur); if (r.error) return;
    $('tbMsg').className = 'tb-msg';
    $('tbMsg').textContent = await saveFile(`${base()}_${String(cur + 1).padStart(2, '0')}.${fmt()}`, pageFile(cur, r.codes));
  });
  $('tbSaveAll').addEventListener('click', async () => {
    const files = [], ext = fmt();
    for (let k = 0; k < P.pages.length; k++) {
      const r = pageCodes(k);
      if (r.error) { $('tbMsg').className = 'tb-msg err'; $('tbMsg').textContent = `${k + 1}ページめ: ${r.error}`; return; }
      files.push({ name: `${base()}_${String(k + 1).padStart(2, '0')}.${ext}`, data: pageFile(k, r.codes) });
    }
    $('tbMsg').className = 'tb-msg';
    $('tbMsg').textContent = `${files.length} まい 作りました。` + await saveFile(`${base()}_${ext}.zip`, TB.writeZIP(files));
  });
  $('tbBatch').addEventListener('change', async ev => {
    const f = ev.target.files[0]; ev.target.value = '';
    if (!f || !data) return;
    const m = $('tbBatchMsg'); m.className = 'tb-msg'; m.textContent = '作って います…';
    const r = TB.parseBatch(await f.text(), box(), font());
    if (r.error) { m.className = 'tb-msg err'; m.textContent = r.error; return; }
    const out = [], sc = scale(), g = fmt() === 'gif';
    for (const p of r.pages) {
      const pg = TB.encodePage(p.lines, p.box, true);
      if (pg.error) { m.className = 'tb-msg err'; m.textContent = `${p.line}行め: ${pg.error}`; return; }
      let bytes;
      if (g && pg.arrow) bytes = TB.writeGIF([1, 2, 3, 4].map(a => TB.render(data, p.box, p.font, a, pg.codes)), TB.arrowDelay(p.box, p.font), sc);
      else { const im = TB.render(data, p.box, p.font, pg.arrow ? p.frame + 1 : 0, pg.codes); bytes = g ? TB.writeGIF([im], 0, sc) : TB.writePNG(im, sc); }
      out.push({ name: `${p.name}.${g ? 'gif' : 'png'}`, data: bytes });
    }
    if (!out.length) { m.className = 'tb-msg err'; m.textContent = '文が ありません'; return; }
    m.textContent = `${out.length} まい 作りました。` + await saveFile(f.name.replace(/\.[^.]*$/, '') + (g ? '_gif' : '_png') + '.zip', TB.writeZIP(out));
  });

  // 文を けす（まちがえて 押さない ように 2回 押す。Poke tools と 同じ）
  $('tbClear').addEventListener('click', () => {
    const b = $('tbClear');
    if (b.dataset.armed) {
      delete b.dataset.armed; clearTimeout(b._tm); b.classList.remove('warn'); b.textContent = '文を けす';
      $('tbText').value = ''; cur = 0; keep(); refresh(); $('tbText').focus(); return;
    }
    b.dataset.armed = '1'; b.classList.add('warn'); b.textContent = 'もう1回で けす';
    b._tm = setTimeout(() => { delete b.dataset.armed; b.classList.remove('warn'); b.textContent = '文を けす'; }, 3000);
  });

  // 入力・えらんだ ものを この 端末に おぼえる（Dropbox の 画面から もどって きても 消えない）
  const pressed = (id, v) => { for (const x of $(id).children) x.setAttribute('aria-pressed', x.dataset.v === String(v) ? 'true' : 'false'); };
  function keep() {
    S.tb = { text: $('tbText').value, box: box(), font: font(), fmt: fmt(), scale: $('tbScale').value, last: $('tbLastArrow').checked, af: $('tbAframe').value };
    save();
  }
  function restore() {
    const t = S.tb; if (!t) return;
    if (typeof t.text === 'string') $('tbText').value = t.text;
    if (t.box != null) pressed('tbBox', t.box);
    if (t.font != null) pressed('tbFont', t.font);
    if (t.fmt) pressed('tbFmt', t.fmt);
    if (t.scale) $('tbScale').value = t.scale;
    $('tbLastArrow').checked = !!t.last;
    if (t.af) $('tbAframe').value = t.af;
  }
  restore();
  for (const id of ['tbText', 'tbScale', 'tbLastArrow', 'tbAframe']) $(id).addEventListener('change', keep);
  $('tbText').addEventListener('input', keep);
  for (const id of ['tbBox', 'tbFont', 'tbFmt']) $(id).addEventListener('click', keep);

  // Dropbox の「動画用素材」に 保存
  const stamp = () => { const d = new Date(), p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`; };
  function dbxStatus() {
    $('tbDbxSt').textContent = DBX.connected() ? `つながって います（${DBX.FOLDER.slice(1)} フォルダ）` : DBX.key() ? 'まだ つながって いません（押すと つなぎます）' : 'くわしい 設定で App key を 入れて ください';
    $('tbDbxKey').value = (S.dbx && S.dbx.key) || '';
    $('tbDbxOff').disabled = !DBX.connected();
  }
  async function toDropbox(pages) {
    const m = $('tbMsg'); m.className = 'tb-msg';
    if (!DBX.connected()) {
      if (!DBX.key()) { m.className = 'tb-msg err'; m.textContent = 'くわしい 設定で Dropbox の App key を 入れて ください'; $('tbDbxKey').closest('details').open = true; return; }
      m.textContent = 'Dropbox の 画面に 移ります。「許可」を 押して もどったら、もう一度 押して ください';
      keep(); try { await DBX.connect(); } catch (e) { m.className = 'tb-msg err'; m.textContent = e.message; } return;
    }
    const ext = fmt(), st = stamp(), many = pages.length > 1;
    for (const k of pages) { const r = pageCodes(k); if (r.error) { m.className = 'tb-msg err'; m.textContent = `${k + 1}ページめ: ${r.error}`; return; } }
    try {
      let n = 0;
      for (const k of pages) {
        m.textContent = `Dropbox に 保存して います…（${n + 1} / ${pages.length}）`;
        await DBX.upload(`${base()}_${st}${many || P.pages.length > 1 ? '_' + String(k + 1).padStart(2, '0') : ''}.${ext}`, pageFile(k, pageCodes(k).codes));
        n++;
      }
      m.textContent = `Dropbox の「${DBX.FOLDER.slice(1)}」に ${n} まい 保存しました`;
    } catch (e) {
      if (e.message === 'need-connect') { dbxStatus(); m.className = 'tb-msg err'; m.textContent = 'Dropbox に つなぎなおして ください（もう一度 押すと つなぎます）'; }
      else { m.className = 'tb-msg err'; m.textContent = e.message || String(e); }
    }
  }
  $('tbDbxOne').addEventListener('click', () => { if (P.pages.length) toDropbox([cur]); });
  $('tbDbxAll').addEventListener('click', () => { if (P.pages.length) toDropbox(P.pages.map((_, k) => k)); });
  $('tbDbxKey').addEventListener('change', e => { S.dbx = S.dbx || {}; const v = e.target.value.trim(); if (v !== S.dbx.key) { S.dbx.key = v; S.dbx.tok = null; } save(); dbxStatus(); });
  $('tbDbxOff').addEventListener('click', () => { DBX.off(); dbxStatus(); toast('Dropbox との つながりを 切りました'); });
  dbxStatus();
  DBX.handleReturn().then(msg => { if (msg) { toast(msg, 4000); dbxStatus(); } }).catch(e => { toast(e.message || String(e), 5000); dbxStatus(); });

  let booted = false;
  return {
    // 画面に 出た とき・かくれた とき
    shown() {
      document.getElementById('vTb').style.setProperty('--apph', (document.querySelector('.appbar')?.offsetHeight || 0) + 'px');
      if (!booted) {
        booted = true;
        idb('readonly', s => s.get('blob')).then(b => { if (b) start(new Uint8Array(b)); else $('tbSetup').hidden = false; })
          .catch(() => { $('tbSetup').hidden = false; });
      } else if (data) { fit(); show(); }
    },
    hidden() { clearInterval(timer); },
  };
})();

/* ---------- ROM・説明書（ここに 1行 足せば ふえる） ---------- */
// group: 見出し、tags: 小さい しるし（"!" で はじめると 注意の 色）
const LINKS = [
  { group: 'ROM', title: 'EmeraldForVideo', desc: '動画用の エメラルド（Dropbox の GBA フォルダ）', url: 'https://www.dropbox.com/preview/GBA/EmeraldForVideo.gba', ic: 'film', tags: ['!Dropbox に ログイン', '公開しない'] },
  { group: '説明書', title: 'Pokemerald NERversion 説明書', desc: '足した 機能と ボタンの 早見表', url: 'https://github.com/noctis1008-wq/topSecret/blob/randomizer/docs/ner_manual.md', ic: 'book', tags: ['!GitHub に ログイン'] },
];
const LK_IC = {
  film: '<rect class="f" x="3" y="5" width="18" height="14" rx="2"/><path d="M3 9h18M3 15h18M8 5v4M16 5v4M8 15v4M16 15v4" class="in"/>',
  book: '<path class="f" d="M5 4h10a4 4 0 0 1 4 4v12H9a4 4 0 0 1-4-4z"/><path d="M5 16a4 4 0 0 1 4-4h10" class="in"/>',
};
function renderLinks() {
  const groups = [...new Set(LINKS.map(l => l.group))];
  document.getElementById('lkList').innerHTML = groups.map(g => `<p class="lk-h">${esc(g)}</p><div class="lk-list">${LINKS.filter(l => l.group === g).map(l => `
    <a class="lk" href="${esc(l.url)}"><span class="ni" style="--c:var(--lkc)" aria-hidden="true"><svg viewBox="0 0 24 24">${LK_IC[l.ic] || ''}</svg></span>
    <span><span class="lk-t">${esc(l.title)}</span><span class="lk-d">${esc(l.desc || '')}</span>${(l.tags || []).length ? `<span class="lk-tags">${l.tags.map(t => t[0] === '!' ? `<span class="lk-tag warn">${esc(t.slice(1))}</span>` : `<span class="lk-tag">${esc(t)}</span>`).join('')}</span>` : ''}</span>
    <span class="lk-go" aria-hidden="true">↗</span></a>`).join('')}</div>`).join('');
}

/* ---------- ☰メニュー・下のバー（Poke tools と 同じ） ---------- */
const VIEWS = { tb: { t: 'テキストボックス メーカー', el: 'vTb', s: 'テキストボックス', c: '--tbc' }, ner: { t: '出現ずかん', el: 'vNer', s: '出現ずかん', c: '--nex' }, links: { t: 'ROM・説明書', el: 'vLinks', s: 'ROM・説明書', c: '--lkc' } };
const VIEW_KEYS = Object.keys(VIEWS);
const TOOL_IC = {
  tb: '<path class="f" d="M3.5 6h17v10.5H9l-5.5 4z"/><path d="M7.5 10h9M7.5 13h5.5" class="in"/>',
  ner: '<path class="f" d="M3.5 6.5l5.5-2.2 6 2.2 5.5-2.2v13.2L15 19.7l-6-2.2-5.5 2.2z"/><path d="M9 4.3v13.2M15 6.5v13.2"/>',
  links: '<path class="f" d="M3.5 6.5h6l2 2h9v10.5h-17z"/><path d="M3.5 10.5h17" class="in"/>',
};
const toolNi = k => `<span class="ni" style="--c:var(${VIEWS[k].c})" aria-hidden="true"><svg viewBox="0 0 24 24" aria-hidden="true">${TOOL_IC[k]}</svg></span>`;
const drawer = document.getElementById('drawer'), menuBtn = document.getElementById('menuBtn');
document.getElementById('navTools').innerHTML = VIEW_KEYS.map((k, i) => `<button class="navitem${i === VIEW_KEYS.length - 1 ? ' navlast' : ''}" type="button" data-view="${k}">${toolNi(k)}<span class="nt">${VIEWS[k].t}</span></button>`).join('');
document.getElementById('tabBarIn').innerHTML = VIEW_KEYS.map(k => `<button class="tab" type="button" data-tab="${k}" style="--c:var(${VIEWS[k].c})" aria-label="${VIEWS[k].t}">${toolNi(k)}<span class="tl">${VIEWS[k].s}</span></button>`).join('');
function setView(v) {
  if (!VIEWS[v]) v = 'tb';
  const prev = document.body.dataset.view;
  if (prev === 'tb' && v !== 'tb') TBX.hidden();
  S.view = v; save();
  Object.entries(VIEWS).forEach(([k, x]) => document.getElementById(x.el).hidden = k !== v);
  document.body.dataset.view = v;
  document.getElementById('appTitle').textContent = VIEWS[v].t;
  document.querySelectorAll('[data-view],[data-tab]').forEach(b => { if ((b.dataset.view || b.dataset.tab) === v) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
  if (location.hash !== '#' + v) try { history.replaceState(null, '', '#' + v); } catch (e) {}
  if (v === 'tb') TBX.shown();
  if (v === 'ner') renderNer();
  if (v === 'links') renderLinks();
  window.scrollTo(0, 0);
}
function openMenu() { drawer.hidden = false; menuBtn.setAttribute('aria-expanded', 'true'); document.body.classList.add('modal'); drawer.querySelector('[aria-current="page"]')?.focus(); }
function closeMenu() { if (drawer.hidden) return; drawer.hidden = true; menuBtn.setAttribute('aria-expanded', 'false'); document.body.classList.remove('modal'); menuBtn.focus(); }
menuBtn.addEventListener('click', () => drawer.hidden ? openMenu() : closeMenu());
drawer.addEventListener('click', e => {
  if (e.target.closest('.scrim')) { closeMenu(); return; }
  const b = e.target.closest('[data-view]'); if (!b) return;
  closeMenu(); setView(b.dataset.view);
});
document.getElementById('tabBar').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b && b.dataset.tab !== document.body.dataset.view) setView(b.dataset.tab); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
addEventListener('hashchange', () => { const h = location.hash.slice(1); if (VIEWS[h] && h !== document.body.dataset.view) setView(h); });
setView(VIEWS[location.hash.slice(1)] ? location.hash.slice(1) : (S.view || 'tb'));
