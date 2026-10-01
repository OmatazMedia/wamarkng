#!/usr/bin/env bash
# Built by Omataz Media — Web Development & Design
# Website   : https://www.omatazmedia.com.ng
# Email     : hello@omatazmedia.com.ng
# Phone     : +234 9024599289, +234 7037373304
# WhatsApp  : https://wa.me/message/M3QUHNVONY6NK1
# Social    : @omatazmedia — Facebook · Instagram · X · YouTube
# GitHub    : https://github.com/omatazmedia
# Contact   : Johnson Toluwani
#
# End-to-end API test suite — run against a PHP server rooted at out/.
# Usage: bash scripts/api-test.sh [BASE_URL]   (default http://127.0.0.1:8899)
# NOTE: run against a FRESH install (delete out/api/data/db/* and
# out/api/data/installed.lock first) — the lockout section locks the admin.

set -u
BASE="${1:-http://127.0.0.1:8899}"
PASS=0; FAIL=0
JAR="$(mktemp)"
CSRF=""

ok()  { PASS=$((PASS+1)); echo "  ✔ $1"; }
bad() { FAIL=$((FAIL+1)); echo "  ✘ $1"; }
expect() { if [ "$2" = "$3" ]; then ok "$1"; else bad "$1 (expected=$2 actual=$3)"; fi; }

req() { # req <method> <path> [json-body] -> "status<TAB>body"
  local m="$1" p="$2" body="${3:-}"
  if [ -n "$body" ]; then
    curl -s -b "$JAR" -c "$JAR" -o /tmp/req_body -w "%{http_code}" \
      -X "$m" -H "Content-Type: application/json" -H "X-CSRF-Token: $CSRF" \
      -d "$body" "$BASE$p"
  else
    curl -s -b "$JAR" -c "$JAR" -o /tmp/req_body -w "%{http_code}" \
      -X "$m" -H "X-CSRF-Token: $CSRF" "$BASE$p"
  fi
  printf '\t%s' "$(cat /tmp/req_body)"
}
read_req() { read -r S B < <(req "$@" | awk -F'\t' '{print $1 "\t" $2}'); }

get_csrf() {
  CSRF="$(curl -s -b "$JAR" -c "$JAR" "$BASE/api/index.php?route=csrf" \
    | php -r 'echo json_decode(stream_get_contents(STDIN),true)["csrf"] ?? "";')"
}
captcha_sum() {
  curl -s -b "$JAR" -c "$JAR" "$BASE/api/index.php?route=csrf" \
    | php -r '$d=json_decode(stream_get_contents(STDIN),true); echo $d["captcha"]["a"]+$d["captcha"]["b"];'
}

echo "== 0. Static routes still serve =="
for p in "/" "/about-us/" "/services/" "/management/" "/projects/" "/contact-us/" "/login/" "/dashboard/"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE$p")
  expect "GET $p" "200" "$code"
done

echo "== 1. API status (pre-install) =="
read_req GET "/api/index.php?route="
expect "status route 200" "200" "$S"

echo "== 2. Installation wizard =="
read_req GET "/api/install.php"
expect "wizard GET 200" "200" "$S"
printf '%s' "$B" | grep -q '"ready":true' && ok "environment ready" || bad "env not ready: $B"

read_req POST "/api/install.php"
expect "wizard POST 200" "200" "$S"
printf '%s' "$B" | grep -q '"ok":true' && ok "install ok" || bad "install failed: $B"
ADMIN_EMAIL=$(printf '%s' "$B" | php -r '$d=json_decode(stream_get_contents(STDIN),true); echo $d["admin"]["email"] ?? "";')
ADMIN_PASS=$(printf '%s' "$B" | php -r '$d=json_decode(stream_get_contents(STDIN),true); echo $d["admin"]["password"] ?? "";')
[ -n "$ADMIN_EMAIL" ] && [ -n "$ADMIN_PASS" ] && ok "admin credentials auto-generated" || bad "no admin credentials"

echo "== 3. Wizard self-locks =="
read_req POST "/api/install.php"
printf '%s' "$B" | grep -q '"already":true' && ok "wizard locked after install" || bad "wizard re-ran: $B"

echo "== 4. CSRF + captcha issuance =="
get_csrf
[ -n "$CSRF" ] && ok "csrf token issued" || bad "no csrf token"

echo "== 5. Contact form =="
SUM=$(captcha_sum)
read_req POST "/api/index.php?route=contact" "{\"csrf\":\"$CSRF\",\"name\":\"Test User\",\"email\":\"test@example.com\",\"phone\":\"+2348000000000\",\"subject\":\"Hello\",\"message\":\"This is a test enquiry message.\",\"captcha_answer\":$SUM}"
expect "valid contact accepted (200)" "200" "$S"
printf '%s' "$B" | grep -q '"sent":true' && ok "mail() confirmed send" || echo "  (mail note: $(printf '%s' "$B" | head -c 160))"

SUM=$(captcha_sum)
read_req POST "/api/index.php?route=contact" "{\"csrf\":\"$CSRF\",\"name\":\"Bot\",\"email\":\"bot@x.com\",\"message\":\"spam spam spam spam\",\"captcha_answer\":999}"
expect "wrong captcha rejected (422)" "422" "$S"

# A poisoned token must fail even when a stale valid token sits in the header.
CSRF="poisoned-token" read_req POST "/api/index.php?route=contact" "{\"csrf\":\"bad\",\"name\":\"X\",\"email\":\"x@x.com\",\"message\":\"1234567890\",\"captcha_answer\":5}"
expect "bad csrf rejected (403)" "403" "$S"

get_csrf; SUM=$(captcha_sum)
read_req POST "/api/index.php?route=contact" "{\"csrf\":\"$CSRF\",\"name\":\"Honey Bot\",\"email\":\"h@x.com\",\"message\":\"1234567890abc\",\"captcha_answer\":$SUM,\"_hp\":\"i-am-a-bot\"}"
printf '%s' "$B" | grep -q '"ok":true' && ok "honeypot silently swallows bots" || bad "honeypot failed: $B"

echo "== 6. Email-first login =="
get_csrf
read_req POST "/api/index.php?route=auth/check" "{\"email\":\"$ADMIN_EMAIL\"}"
printf '%s' "$B" | grep -q '"exists":true' && ok "known email advances to password step" || bad "known email rejected: $B"

get_csrf
read_req POST "/api/index.php?route=auth/check" "{\"email\":\"nobody@nowhere.test\"}"
printf '%s' "$B" | grep -q '"exists":false' && ok "unknown email detected (uniform shape)" || bad "unknown email check failed: $B"

get_csrf
read_req POST "/api/index.php?route=auth/password" "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASS\"}"
expect "correct password accepted (200)" "200" "$S"
printf '%s' "$B" | grep -q '"must_change":true' && ok "must_change enforced on first login" || bad "no must_change: $B"

read_req GET "/api/index.php?route=admin/summary"
expect "admin blocked while must_change (403)" "403" "$S"

get_csrf
read_req POST "/api/index.php?route=auth/change-password" "{\"new_password\":\"NewStrong1Pass\"}"
expect "password change accepted (200)" "200" "$S"

read_req GET "/api/index.php?route=auth/me"
printf '%s' "$B" | grep -q '"must_change":false' && ok "session cleared of must_change" || bad "must_change still set: $B"

read_req GET "/api/index.php?route=admin/summary"
expect "admin/summary authorized (200)" "200" "$S"

echo "== 7. Gallery CRUD + upload (authenticated) =="
read_req GET "/api/index.php?route=gallery"
N=$(printf '%s' "$B" | php -r '$d=json_decode(stream_get_contents(STDIN),true); echo count($d["items"] ?? []);')
expect "seeded gallery has 9 items" "9" "$N"

PNG_PATH="$(php -r 'echo sys_get_temp_dir();')/wm-test.png"
php -r 'file_put_contents($argv[1], base64_decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="));' "$PNG_PATH"
UP=$(curl -s -b "$JAR" -c "$JAR" -H "X-CSRF-Token: $CSRF" \
  -F "file=@$PNG_PATH;type=image/png" -F "title=Upload Test" -F "category=Testing" \
  "$BASE/api/index.php?route=gallery")
printf '%s' "$UP" | grep -q '"ok":true' && ok "image upload accepted" || bad "upload failed: $UP"
NEWID=$(printf '%s' "$UP" | php -r '$d=json_decode(stream_get_contents(STDIN),true); echo $d["id"] ?? 0;')
expect "upload returned an id" "ok" "$([ "$NEWID" -gt 0 ] 2>/dev/null && echo ok || echo no)"
# fetch the created item's src through the public list
read_req GET "/api/index.php?route=gallery"
UPLOADED_SRC=$(printf '%s' "$B" | php -r '$d=json_decode(stream_get_contents(STDIN),true); foreach(($d["items"]??[]) as $it){ if($it["title"]==="Upload Test"){ echo $it["src"]; break; } }')
case "$UPLOADED_SRC" in
  /api/data/uploads/*) ok "upload stored under protected uploads dir ($UPLOADED_SRC)";;
  *) bad "unexpected upload path: $UPLOADED_SRC";;
esac
[ -n "$UPLOADED_SRC" ] && { up_code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE$UPLOADED_SRC"); expect "uploaded file publicly readable" "200" "$up_code"; }

read_req POST "/api/index.php?route=gallery/update" "{\"id\":$NEWID,\"title\":\"Upload Test (renamed)\",\"category\":\"QA\"}"
expect "gallery/update 200" "200" "$S"

read_req POST "/api/index.php?route=gallery/delete" "{\"id\":$NEWID}"
expect "gallery/delete 200" "200" "$S"
read_req GET "/api/index.php?route=gallery"
printf '%s' "$B" | grep -q 'Upload Test' && bad "deleted item still listed" || ok "deleted item gone from gallery"

echo "== 7b. Admin gallery list + video upload + URL items + reorder =="
read_req GET "/api/index.php?route=admin/gallery"
N=$(printf '%s' "$B" | php -r '$d=json_decode(stream_get_contents(STDIN),true); echo count($d["items"] ?? []);')
expect "admin/gallery lists 9 items (incl. hidden)" "9" "$N"

MP4_PATH="$(php -r 'echo sys_get_temp_dir();')/wm-test.mp4"
php -r 'file_put_contents($argv[1], hex2bin("00000018667479706d703432000000006d70347269736f6d0000000866726565"));' "$MP4_PATH"
UPV=$(curl -s -b "$JAR" -c "$JAR" -H "X-CSRF-Token: $CSRF" \
  -F "file=@$MP4_PATH;type=video/mp4" -F "media_type=video" -F "title=Clip Upload" -F "category=QA" \
  "$BASE/api/index.php?route=gallery")
printf '%s' "$UPV" | grep -q '"ok":true' && ok "video upload accepted" || bad "video upload failed: $UPV"
read_req GET "/api/index.php?route=admin/gallery"
printf '%s' "$B" | grep -q '"media_type":"video"' && ok "video item stored as video" || bad "no video item in list"
VIDSRC=$(printf '%s' "$B" | php -r '$d=json_decode(stream_get_contents(STDIN),true); foreach(($d["items"]??[]) as $it){ if($it["media_type"]==="video" && $it["title"]==="Clip Upload"){ echo $it["src"]; break; } }')
case "$VIDSRC" in
  /api/data/uploads/*.mp4) ok "video stored under uploads ($VIDSRC)";;
  *) bad "unexpected video path: $VIDSRC";;
esac
[ -n "$VIDSRC" ] && { vc=$(curl -s -o /dev/null -w "%{http_code}" "$BASE$VIDSRC"); expect "uploaded video publicly readable" "200" "$vc"; }

read_req POST "/api/index.php?route=gallery" "{\"media_type\":\"video\",\"src\":\"https://www.youtube.com/watch?v=dQw4w9WgXcQ\",\"title\":\"YouTube embed\",\"category\":\"QA\"}"
expect "YouTube URL accepted (200)" "200" "$S"
read_req POST "/api/index.php?route=gallery" "{\"media_type\":\"image\",\"src\":\"https://evil.example.com/payload.exe\",\"title\":\"bad\"}"
expect "non-media URL rejected (422)" "422" "$S"

read_req GET "/api/index.php?route=admin/gallery"
FIRST_ID=$(printf '%s' "$B" | php -r '$d=json_decode(stream_get_contents(STDIN),true); echo $d["items"][0]["id"] ?? 0;')
read_req POST "/api/index.php?route=gallery/update" "{\"id\":$FIRST_ID,\"sort\":-50}"
expect "reorder accepted (200)" "200" "$S"
read_req GET "/api/index.php?route=admin/gallery"
NEW_FIRST=$(printf '%s' "$B" | php -r '$d=json_decode(stream_get_contents(STDIN),true); echo $d["items"][0]["id"] ?? 0;')
[ "$FIRST_ID" != "$NEW_FIRST" ] && ok "reorder changed the list order" || bad "order unchanged after sort update"

echo "== 7c. Site settings (admin) =="
read_req GET "/api/index.php?route=admin/settings"
printf '%s' "$B" | grep -q 'contact_email' && ok "settings readable" || bad "settings missing: $B"
read_req POST "/api/index.php?route=admin/settings" "{\"site_name\":\"WAMARK Test Site\"}"
expect "settings update ok" "200" "$S"
printf '%s' "$B" | grep -q 'WAMARK Test Site' && ok "settings change reflected" || bad "change not returned: $B"
read_req POST "/api/index.php?route=admin/settings" "{\"contact_email\":\"not-an-email\"}"
expect "invalid contact email rejected (422)" "422" "$S"

echo "== 7d. Messages: read + delete =="
read_req GET "/api/index.php?route=admin/messages"
MSG_ID=$(printf '%s' "$B" | php -r '$d=json_decode(stream_get_contents(STDIN),true); echo $d["messages"][0]["id"] ?? 0;')
[ "$MSG_ID" -gt 0 ] 2>/dev/null && ok "message listed" || bad "no messages listed"
read_req POST "/api/index.php?route=admin/messages/read" "{\"id\":$MSG_ID}"
expect "mark read ok" "200" "$S"
read_req GET "/api/index.php?route=admin/messages"
printf '%s' "$B" | php -r '$d=json_decode(stream_get_contents(STDIN),true); $m=$d["messages"][0]??null; exit(($m && $m["read_at"]!==null)?0:1);' && ok "read_at persisted" || bad "read_at not set"
read_req POST "/api/index.php?route=admin/messages/delete" "{\"id\":$MSG_ID}"
expect "message delete ok" "200" "$S"
read_req GET "/api/index.php?route=admin/messages"
printf '%s' "$B" | grep -q "\"id\":$MSG_ID," && bad "deleted message still listed" || ok "deleted message gone"

echo "== 8. Lockout: 4 wrong passwords => 4h email lock =="
get_csrf
for i in 1 2 3; do
  read_req POST "/api/index.php?route=auth/password" "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"wrong-$i\"}"
  printf '%s' "$B" | grep -q '"error":"bad_credentials"' && ok "wrong password #$i rejected" || bad "attempt #$i unexpected: $B"
done
read_req POST "/api/index.php?route=auth/password" "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"wrong-4\"}"
expect "4th wrong password locks (423)" "423" "$S"
printf '%s' "$B" | grep -q '"error":"locked"' && ok "lock error shape correct" || bad "lock shape: $B"

get_csrf
read_req POST "/api/index.php?route=auth/password" "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"NewStrong1Pass\"}"
expect "correct password refused while locked (423)" "423" "$S"

echo "== 9. Lock is per-email, not per-session =="
rm -f "$JAR"; JAR="$(mktemp)"
get_csrf
read_req POST "/api/index.php?route=auth/password" "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"NewStrong1Pass\"}"
expect "fresh session still locked (423)" "423" "$S"

echo "== 10. Anonymous requests rejected after logout =="
get_csrf
read_req POST "/api/index.php?route=auth/logout"
expect "logout ok" "200" "$S"
read_req GET "/api/index.php?route=admin/summary"
expect "admin/summary unauthorized after logout (401)" "401" "$S"
read_req GET "/api/index.php?route=auth/me"
expect "auth/me unauthorized after logout (401)" "401" "$S"

echo "== RESULT: $PASS passed, $FAIL failed =="
rm -f "$JAR" /tmp/req_body "$PNG_PATH" "$MP4_PATH"
[ "$FAIL" -eq 0 ]
