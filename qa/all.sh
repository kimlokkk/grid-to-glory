#!/bin/bash
# Apex Career regression: one command. Usage: bash qa/all.sh [--quick]   (quick skips full-season e2e and monkey)
cd "$(dirname "$0")/.."
bash build.sh >/dev/null || { echo "BUILD FAILED"; exit 1; }
FAIL=0; pass() { echo "  PASS  $1"; }; fail() { echo "  FAIL  $1"; FAIL=$((FAIL+1)); }
# 1. syntax of built script
node -e "var h=require('fs').readFileSync('index.html','utf8');var m=h.match(/<script>([\s\S]*)<\/script>/);new Function(m[1])" 2>/dev/null && pass "syntax" || fail "syntax"
# 2. global function names unique across build (only the known intentional overrides allowed)
F=$(grep -o "cat src/data.js.*; echo '</script>'" build.sh | sed "s/cat //;s/; echo.*//")
DUP=$(grep -ho "^function [A-Za-z0-9_]*" $F | sed 's/function //' | sort | uniq -d | tr '\n' ' ')
KNOWN="apexGame avatarSVG brakeGame carSVG chicaneGame chooseComp clutchStart drawTrain lastRadioHTML mgIntro pitCard pitGame pitRelease pitTorque qualiGame radioHTML readGame timingGame vHub vMenu vNew "
[ "$DUP" == "$KNOWN" ] && pass "no new duplicate functions" || fail "duplicate functions changed: $DUP"
run() { # name script timeout okpattern
  local out; out=$(timeout "$3" node "qa/$2.js" $5 2>&1); local rc=$?
  if [ $rc -eq 0 ] && echo "$out" | grep -qE "$4" && ! echo "$out" | grep -qE "ERRS \[\"|ERRORS [1-9]|TypeError|ReferenceError"; then pass "$1"; else fail "$1"; echo "$out" | tail -8 | sed 's/^/        /'; fi; }
run "old saves load (lvl 1+2)"  oldsave 170 'ERRS \[\]'
run "version stamp + changelog" ver 90 'ERRS \[\]'
run "reserve year (E3b)"        e3b 170 'ERRS \[\]'
run "reserve year reload"       e3b_reload 170 'ERRS \[\]'
run "facilities/engines (E4c)"  e4c 170 'ERRS \[\]'
run "final race + review"       fnl 170 'ERRS \[\]'
run "circuit history"           th 170 'ERRS \[\]'
run "race lock (quit/reload)"   live 170 'ERRS \[\]'
run "XP nudge + new-career confirm" nudge 90 'ERRS \[\]'
if [ "$1" != "--quick" ]; then
  run "full season e2e"          e2e 290 'ERRS \[\]'
  run "monkey (90s)"             monkey 130 'ERRORS 0' "600 7 90"
fi
echo; [ $FAIL -eq 0 ] && echo "ALL PASS" || echo "$FAIL FAILED"; exit $FAIL
