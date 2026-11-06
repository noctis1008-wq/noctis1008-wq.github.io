// node test.js → ゲーム (エミュレータ) で出した答えと JS の計算が全部一致するか確かめる
const { nerRandomizeWild } = require('./ner_randomizer.js');
const SP = require('./ner_species.json').species;
const V = require('./test_vector_seed777.json'); // [mapGroup, mapNum, 元の種族, ゲームでの答え] seed=777
let bad = 0;
for (const [g, n, o, e] of V) if (nerRandomizeWild(o, g, n, 777, SP) !== e) bad++;
console.log(bad === 0 ? `OK ${V.length} 件すべて一致` : `NG ${bad} 件ちがう`);
process.exit(bad ? 1 : 0);
