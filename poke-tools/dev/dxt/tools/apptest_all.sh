#!/bin/bash
# アプリの流れのテストをまとめて動かす（テスト用のサーバー2つを立て、終わったら止める）
# 使い方: tools/apptest_all.sh "作品 図鑑 正解表 動画名" ...   例: tools/apptest_all.sh "oras nat oras oras" "sv 31 sv sw_rec"
# REPO=リポジトリの場所、GEN=作業場所（dxt.js・harness.html・truth/・wv/ がある所）。結果は /tmp/at_動画名.txt
REPO=${REPO:-/home/claude/noctis1008-wq.github.io}; GEN=${GEN:-/home/claude/gen}
(cd $REPO && exec python3 -m http.server 8765 --bind 127.0.0.1) >/dev/null 2>&1 & S1=$!
(cd $GEN && exec python3 -m http.server 8766 --bind 127.0.0.1) >/dev/null 2>&1 & S2=$!
until curl -s -o /dev/null http://127.0.0.1:8765/ && curl -s -o /dev/null http://127.0.0.1:8766/; do sleep 0.5; done
cd $GEN
for a in "$@"; do set -- $a; timeout 2400 python3 tools/apptest.py $1 $2 truth/$3.json wv/$4.webm > /tmp/at_$4.txt 2>&1; echo "done $4"; done
kill $S1 $S2 2>/dev/null
