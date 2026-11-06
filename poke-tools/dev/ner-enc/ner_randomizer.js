// NERversion のランダマイザ (src/random_mon_generation.c の Randomizer_PickSpecies) を JS に移したもの。
// 使い方: const sp = nerRandomizeWild(origSpecies, mapGroup, mapNum, seed, SPECIES)
//   seed: セーブの VAR_RANDOMIZER_SEED (0x40A1)。0 ならトレーナーID (SaveBlock2.playerTrainerId の 4 バイト, little endian, u32)
//   SPECIES: ner_species.json の species 配列 (index = 種族ID)
(function (root) {
  const u32 = x => x >>> 0;
  const mul = (a, b) => Math.imul(a, b) >>> 0;
  function mix(x) {
    x = u32(x);
    x = u32(x ^ (x >>> 16)); x = mul(x, 0x85EBCA6B);
    x = u32(x ^ (x >>> 13)); x = mul(x, 0xC2B2AE35);
    x = u32(x ^ (x >>> 16));
    return x;
  }
  // SFC32 (src/random.c, STREAM1 = 1)
  function seedRng(seed) {
    const st = { a: 0, b: 0, c: u32(seed), ctr: 1 };
    for (let i = 0; i < 16; i++) next(st, 1);
    return st;
  }
  function next(st, stream = 1) {
    const result = u32(st.a + st.b + st.ctr);
    st.ctr = u32(st.ctr + stream);
    st.a = u32(st.b ^ (st.b >>> 9));
    st.b = mul(st.c, 9);
    st.c = u32(result + u32((st.c << 21) | (st.c >>> 11)));
    return result;
  }
  const LENIENCY = [50, 100, 200, 1000], TRIES = 400;
  function pickSpecies(original, salt, seed, SP) {
    const n = SP.length; // NUM_SPECIES
    if (original === 0 || original >= n || !SP[original].e) return original;
    const st = seedRng(mix(u32(seed) ^ mix(u32(mul(salt, 0x9E3779B9) + original))));
    const bst = SP[original].b;
    for (const len of LENIENCY) {
      const lo = bst > len ? bst - len : 0, hi = bst + len;
      for (let i = 0; i < TRIES; i++) {
        const cand = (next(st) % (n - 1)) + 1;
        const c = SP[cand];
        if (!c.c) continue;                 // 有効・基本の姿・全国図鑑番号あり
        if (c.b < lo || c.b > hi) continue; // 合計種族値の幅
        if (!c.t) return cand;              // フォルム表なし (乱数を使わない)
        if (c.f.length === 0) continue;
        return c.f[next(st) % c.f.length];
      }
    }
    return original;
  }
  function nerRandomizeWild(original, mapGroup, mapNum, seed, SP) {
    return pickSpecies(original, ((mapGroup << 8) | mapNum) >>> 0, seed, SP);
  }
  root.nerRandomizeWild = nerRandomizeWild;
  root.nerRandomizeTrainer = (original, seed, SP) => pickSpecies(original, 0xFFFF0000, seed, SP);
  if (typeof module !== 'undefined') module.exports = { nerRandomizeWild, nerRandomizeTrainer: root.nerRandomizeTrainer };
})(typeof window !== 'undefined' ? window : globalThis);
