// NERversion の .sav (128KB, フラッシュ) から出現ずかんに必要な値を読む。
// 使い方: const info = nerReadSave(arrayBuffer)
//   → { seed, otid, randomizerWild, randomizerTrainer, badges, caught:Set(全国図鑑番号), seen:Set(全国図鑑番号), counter }
// 形は pokeemerald-expansion (このハックのセーブの形) に合わせてある。オフセットは
// arm-none-eabi-gcc で offsetof を出して確かめた値 (2026-11-06, NERversion Ver.27)。
(function (root) {
  const SECTOR = 0x1000, DATA = 0xF80, SIG = 0x08012025;
  const SB1 = { vars: 5036, flags: 4736, dexSeen: 13736, dexCaught: 13865, size: 15584 };
  const DEX_BYTES = 129;
  const VAR_RANDOMIZER_SEED = 0x40A1, FLAG_WILD = 0x20, FLAG_TRAINER = 0x21, FLAG_BADGE01 = 0x867;
  function nerReadSave(buf) {
    const d = new DataView(buf instanceof ArrayBuffer ? buf : buf.buffer);
    if (d.byteLength < 0x1C000) throw new Error('セーブデータの大きさがちがいます');
    let best = null;
    for (let slot = 0; slot < 2; slot++) {
      const secs = {}; let counter = -1;
      for (let i = 0; i < 14; i++) {
        const o = slot * 0xE000 + i * SECTOR;
        if (d.getUint32(o + 0xFF8, true) !== SIG) continue;
        const id = d.getUint16(o + 0xFF4, true);
        secs[id] = o; counter = Math.max(counter, d.getUint32(o + 0xFFC, true));
      }
      if (Object.keys(secs).length === 14 && (!best || counter > best.counter)) best = { secs, counter };
    }
    if (!best) throw new Error('ポケモン エメラルドの セーブデータとして 読めませんでした');
    const bytes = new Uint8Array(d.buffer, d.byteOffset, d.byteLength);
    const sb2 = bytes.subarray(best.secs[0], best.secs[0] + DATA);
    const sb1 = new Uint8Array(DATA * 4);
    for (let k = 0; k < 4; k++) sb1.set(bytes.subarray(best.secs[k + 1], best.secs[k + 1] + DATA), k * DATA);
    const v1 = new DataView(sb1.buffer);
    const flag = n => (sb1[SB1.flags + (n >> 3)] >> (n & 7)) & 1;
    const otid = new DataView(sb2.buffer, sb2.byteOffset).getUint32(10, true);
    const varSeed = v1.getUint16(SB1.vars + (VAR_RANDOMIZER_SEED - 0x4000) * 2, true);
    const bitsToSet = off => { const s = new Set(); for (let i = 0; i < DEX_BYTES * 8; i++) if ((sb1[off + (i >> 3)] >> (i & 7)) & 1) s.add(i + 1); return s; };
    let badges = 0; for (let i = 0; i < 8; i++) badges += flag(FLAG_BADGE01 + i);
    return {
      counter: best.counter, otid, varSeed,
      seed: varSeed !== 0 ? varSeed : otid,   // Randomizer_GetSeed と同じ
      randomizerWild: !!flag(FLAG_WILD), randomizerTrainer: !!flag(FLAG_TRAINER), badges,
      caught: bitsToSet(SB1.dexCaught), seen: bitsToSet(SB1.dexSeen),
    };
  }
  root.nerReadSave = nerReadSave;
  if (typeof module !== 'undefined') module.exports = { nerReadSave };
})(typeof window !== 'undefined' ? window : globalThis);
