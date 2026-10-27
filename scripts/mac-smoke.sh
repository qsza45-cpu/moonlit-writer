#!/bin/bash
# 실제 macOS에서 배포 ZIP을 풀어 실행해 보는 점검. 사용: scripts/mac-smoke.sh <zip> <결과폴더>
set -u
ZIP="$1"; OUT="$2"; mkdir -p "$OUT"
LOG="$OUT/smoke-$(uname -m).txt"; : > "$LOG"
fail=0
say(){ echo "$*" | tee -a "$LOG"; }
check(){ if eval "$2" >>"$LOG" 2>&1; then say "PASS  $1"; else say "FAIL  $1"; fail=1; fi; }

say "== $(sw_vers -productName) $(sw_vers -productVersion) / $(uname -m)"
WORK="$(mktemp -d)"
check "ZIP 압축 해제" "ditto -x -k '$ZIP' '$WORK'"
APP="$WORK/Moonlit Writer.app"; BIN="$APP/Contents/MacOS/Moonlit Writer"
check "앱 번들 구조(Info.plist·실행 파일)" "test -f '$APP/Contents/Info.plist' && test -x '$BIN'"
check "Electron Framework 심볼릭 링크 유지" "test -L '$APP/Contents/Frameworks/Electron Framework.framework/Versions/Current'"
say "main archs: $(lipo -archs "$BIN")"
for n in "$APP"/Contents/Resources/app/node_modules/uiohook-napi/prebuilds/darwin-*/uiohook-napi.node; do say "$(basename "$(dirname "$n")"): $(lipo -archs "$n")"; done
check "코드 서명 무결성(codesign --verify --deep --strict)" "codesign --verify --deep --strict --verbose=2 '$APP'"
say "-- 서명 정보"; codesign -dv "$APP" >>"$LOG" 2>&1
say "-- Gatekeeper 평가(애드혹 서명이라 거부가 정상)"; spctl --assess --type execute -vv "$APP" >>"$LOG" 2>&1; say "spctl exit=$?"
check "앱 안에 배포 ZIP 등 불필요 파일 없음" "! ls '$APP/Contents/Resources/app' | grep -qi '\.zip$' && test ! -d '$APP/Contents/Resources/app/node_modules/electron'"
say "-- 앱 안 파일: $(cd "$APP/Contents/Resources/app" && find . -maxdepth 2 | sort | tr '\n' ' ')"

DATA="$HOME/Library/Application Support/Moonlit Writer"
launch(){ "$BIN" --moonlit-qa >"$OUT/app-$(uname -m)-$1.log" 2>&1 & PID=$!; sleep 15; }
launch 1
check "첫 실행 후 15초 동안 프로세스 유지" "kill -0 $PID"
screencapture -x "$OUT/screen-$(uname -m).png" 2>>"$LOG" || say "screencapture 실패(권한 없음 가능)"
check "기록 파일 저장(typing-history.json)" "test -f '$DATA/typing-history.json'"
say "창 개수(System Events, 참고용): $(osascript -e "tell application \"System Events\" to count windows of (first process whose unix id is $PID)" 2>&1)"
kill -TERM $PID; sleep 3
check "정상 종료" "! kill -0 $PID"
launch 2
check "재실행 후 프로세스 유지" "kill -0 $PID"
kill -TERM $PID; sleep 3

say "-- 앞 창 감지 도우미(foreground-mac.js) 앱 전환 추적"
osascript -l JavaScript "$APP/Contents/Resources/app/foreground-mac.js" >"$OUT/foreground.txt" 2>&1 & FG=$!
open -a TextEdit; sleep 3; open -a Finder; sleep 3; kill $FG 2>/dev/null
say "$(sort -u "$OUT/foreground.txt" | head -20)"
check "도우미가 앱 전환을 따라감(TextEdit→Finder)" "grep -q 'TextEdit\\|텍스트 편집기' '$OUT/foreground.txt' && grep -q 'Finder' '$OUT/foreground.txt'"
osascript -e 'quit app "TextEdit"' 2>/dev/null
say "== 결과: $([ $fail = 0 ] && echo 통과 || echo 실패 있음)"
exit $fail
