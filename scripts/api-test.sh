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

echo "== 7e. User management: CRUD + suspend =="
get_csrf
read_req GET "/api/index.php?route=admin/users"
printf '%s' "$B" | grep -q '"users"' && ok "users list returned" || bad "users list missing: $B"

read_req POST "/api/index.php?route=admin/users/create" "{\"name\":\"Test Editor\",\"email\":\"editor@wamarkng.com\",\"role\":\"editor\"}"
expect "user create ok" "200" "$S"
EDITOR_EMAIL=$(printf '%s' "$B" | php -r '$d=json_decode(stream_get_contents(STDIN),true); echo $d["user"]["email"] ?? "";')
EDITOR_PW=$(printf '%s' "$B" | php -r '$d=json_decode(stream_get_contents(STDIN),true); echo $d["password"] ?? "";')
[ -n "$EDITOR_PW" ] && ok "one-time password returned" || bad "no one-time password"

read_req POST "/api/index.php?route=admin/users/create" "{\"name\":\"Dup\",\"email\":\"editor@wamarkng.com\"}"
expect "duplicate email rejected (409)" "409" "$S"
read_req POST "/api/index.php?route=admin/users/create" "{\"name\":\"Bad\",\"email\":\"not-an-email\"}"
expect "invalid email rejected (422)" "422" "$S"

read_req POST "/api/index.php?route=admin/users/update" "{\"id\":2,\"name\":\"Test Editor Renamed\"}"
expect "user rename ok" "200" "$S"
printf '%s' "$B" | grep -q 'Renamed' && ok "rename reflected" || bad "rename missing: $B"
read_req POST "/api/index.php?route=admin/users/update" "{\"id\":2,\"role\":\"boss\"}"
expect "invalid role rejected (422)" "422" "$S"

read_req POST "/api/index.php?route=admin/users/update" "{\"id\":2,\"status\":\"suspended\"}"
expect "suspend ok" "200" "$S"
printf '%s' "$B" | grep -q '"status":"suspended"' && ok "status suspended" || bad "suspend not reflected: $B"

# Fresh session: suspended user cannot log in.
SAVE_JAR="$JAR"; JAR="$(mktemp)"; get_csrf
read_req POST "/api/index.php?route=auth/password" "{\"email\":\"$EDITOR_EMAIL\",\"password\":\"$EDITOR_PW\"}"
expect "suspended login rejected (403)" "403" "$S"
printf '%s' "$B" | grep -q '"error":"suspended"' && ok "suspended error shape" || bad "suspended shape: $B"
rm -f "$JAR"; JAR="$SAVE_JAR"; get_csrf

read_req POST "/api/index.php?route=admin/users/update" "{\"id\":2,\"status\":\"active\"}"
expect "re-activate ok" "200" "$S"
read_req POST "/api/index.php?route=admin/users/update" "{\"id\":2,\"password\":\"EditorNewPass1\"}"
expect "admin password reset ok" "200" "$S"
printf '%s' "$B" | grep -q '"must_change":true' && ok "reset forces must_change" || bad "must_change not set: $B"

# Editor logs in with the reset password, changes it, then is denied admin routes.
SAVE_JAR="$JAR"; JAR="$(mktemp)"; get_csrf
read_req POST "/api/index.php?route=auth/password" "{\"email\":\"$EDITOR_EMAIL\",\"password\":\"EditorNewPass1\"}"
expect "editor login with reset password" "200" "$S"
read_req POST "/api/index.php?route=auth/change-password" "{\"new_password\":\"EditorsOwn2Pass\"}"
expect "editor first-login password change" "200" "$S"
read_req GET "/api/index.php?route=admin/users"
expect "editor denied user list (403)" "403" "$S"
read_req POST "/api/index.php?route=admin/users/create" "{\"name\":\"Nope\",\"email\":\"nope@wamarkng.com\"}"
expect "editor denied create (403)" "403" "$S"
read_req POST "/api/index.php?route=auth/logout"
expect "editor logout ok" "200" "$S"
rm -f "$JAR"; JAR="$SAVE_JAR"; get_csrf

# Self-protection + delete.
read_req POST "/api/index.php?route=admin/users/delete" "{\"id\":1}"
expect "self delete rejected (422)" "422" "$S"
printf '%s' "$B" | grep -q 'self_delete' && ok "self_delete error shape" || bad "self_delete shape: $B"
read_req POST "/api/index.php?route=admin/users/delete" "{\"id\":2}"
expect "user delete ok" "200" "$S"
read_req GET "/api/index.php?route=admin/users"
printf '%s' "$B" | grep -q 'editor@wamarkng.com' && bad "deleted user still listed" || ok "deleted user gone"

echo "== 7f. Blog: public feed + admin CRUD =="
get_csrf
read_req GET "/api/index.php?route=blog"
printf '%s' "$B" | grep -q '"posts":\[\]' && ok "empty public blog feed" || bad "public feed shape: $B"

T1='WAMARK completes CCTV rollout'
B1='The Lekki warehouse rollout is complete.\n\nNight vision verified.'
read_req POST "/api/index.php?route=admin/blog/create" "{\"title\":\"$T1\",\"category\":\"Projects\",\"excerpt\":\"32-camera deployment finished.\",\"body\":\"$B1\",\"status\":\"published\"}"
expect "post create+publish ok" "200" "$S"
SLUG=$(printf '%s' "$B" | php -r '$d=json_decode(stream_get_contents(STDIN),true); echo $d["slug"] ?? "";')
[ -n "$SLUG" ] && ok "slug generated" || bad "no slug"

read_req GET "/api/index.php?route=blog"
printf '%s' "$B" | grep -q 'CCTV rollout' && ok "published post in public feed" || bad "post missing from feed"
read_req GET "/api/index.php?route=blog/post&slug=$SLUG"
expect "post readable by slug" "200" "$S"
read_req GET "/api/index.php?route=blog/post&slug=does-not-exist"
expect "unknown slug 404" "404" "$S"

T2='Draft post'
read_req POST "/api/index.php?route=admin/blog/create" "{\"title\":\"$T2\",\"body\":\"Hidden content.\"}"
DRAFT_ID=$(printf '%s' "$B" | php -r '$d=json_decode(stream_get_contents(STDIN),true); echo $d["id"] ?? 0;')
[ "$DRAFT_ID" -gt 0 ] 2>/dev/null && ok "draft created (id $DRAFT_ID)" || bad "draft create failed"
read_req GET "/api/index.php?route=blog"
printf '%s' "$B" | grep -q 'Draft post' && bad "draft leaked to public feed" || ok "drafts hidden from public feed"

read_req POST "/api/index.php?route=admin/blog/update" "{\"id\":$DRAFT_ID,\"status\":\"published\"}"
expect "draft publish ok" "200" "$S"
read_req GET "/api/index.php?route=blog"
printf '%s' "$B" | grep -q 'Draft post' && ok "published draft now public" || bad "published draft missing"
read_req POST "/api/index.php?route=admin/blog/update" "{\"id\":$DRAFT_ID,\"status\":\"draft\"}"
expect "unpublish ok" "200" "$S"

read_req POST "/api/index.php?route=admin/blog/create" "{\"title\":\"x\"}"
expect "title too short rejected (422)" "422" "$S"
read_req POST "/api/index.php?route=admin/blog/delete" "{\"id\":$DRAFT_ID}"
expect "post delete ok" "200" "$S"

echo "== 7g. Homepage feature-card images (public feed + admin control) =="
get_csrf
read_req GET "/api/index.php?route=feature"
printf '%s' "$B" | grep -q '"/images/cctv.webp"' && ok "public feature feed serves built-in defaults" || bad "feature feed shape: $B"
printf '%s' "$B" | grep -q '"03"' && ok "all three feature cards served" || bad "feature keys missing: $B"

read_req GET "/api/index.php?route=admin/feature"
expect "admin feature read ok" "200" "$S"
printf '%s' "$B" | grep -q '"defaults"' && ok "admin payload includes built-in defaults" || bad "defaults missing: $B"

# Override card 01: a local path and a direct image URL survive, poison is dropped.
read_req POST "/api/index.php?route=admin/feature/update" "{\"no\":\"01\",\"images\":[\"/images/new-cctv.webp\",\"https://example.com/drone.jpg\",\"../etc/passwd\",\"javascript:alert(1)\"]}"
expect "feature update ok" "200" "$S"
printf '%s' "$B" | grep -q '"/images/new-cctv.webp"' && ok "local image accepted" || bad "local image missing: $B"
printf '%s' "$B" | grep -q '"https://example.com/drone.jpg"' && ok "remote image URL accepted" || bad "remote URL missing: $B"
printf '%s' "$B" | grep -q 'passwd' && bad "path traversal leaked through" || ok "path traversal filtered"
printf '%s' "$B" | grep -q 'javascript' && bad "javascript: URL leaked through" || ok "javascript: URL filtered"

read_req GET "/api/index.php?route=feature"
printf '%s' "$B" | grep -q '"/images/new-cctv.webp"' && ok "override live on the public feed (no rebuild)" || bad "override not live: $B"
printf '%s' "$B" | grep -q '"/images/cctv.webp"' && bad "stale default still served" || ok "default replaced on the public feed"

# An empty set clears the override and restores the built-in defaults.
read_req POST "/api/index.php?route=admin/feature/update" "{\"no\":\"01\",\"images\":[]}"
expect "feature reset ok" "200" "$S"
read_req GET "/api/index.php?route=feature"
printf '%s' "$B" | grep -q '"/images/cctv.webp"' && ok "defaults restored after reset" || bad "defaults not restored: $B"

# The list is capped at six images.
read_req POST "/api/index.php?route=admin/feature/update" "{\"no\":\"02\",\"images\":[\"/images/a.webp\",\"/images/b.webp\",\"/images/c.webp\",\"/images/d.webp\",\"/images/e.webp\",\"/images/f.webp\",\"/images/g.webp\"]}"
COUNT=$(printf '%s' "$B" | php -r '$d=json_decode(stream_get_contents(STDIN),true); echo count($d["images"] ?? []);')
[ "$COUNT" = "6" ] && ok "image list capped at 6" || bad "cap wrong (got $COUNT)"
read_req POST "/api/index.php?route=admin/feature/update" "{\"no\":\"02\",\"images\":[]}"
expect "card 02 reset ok" "200" "$S"

# Unknown cards are rejected outright.
read_req POST "/api/index.php?route=admin/feature/update" "{\"no\":\"99\",\"images\":[\"/images/x.webp\"]}"
expect "unknown feature rejected (422)" "422" "$S"

# Anonymous writers are turned away.
SAVE_JAR="$JAR"; JAR="$(mktemp)"; get_csrf
read_req POST "/api/index.php?route=admin/feature/update" "{\"no\":\"01\",\"images\":[\"/images/x.webp\"]}"
expect "anonymous feature update rejected (401)" "401" "$S"
rm -f "$JAR"; JAR="$SAVE_JAR"; get_csrf

# Feature images are content-tier (like blog/gallery/settings), so
# editors manage them too — only user management is admin-only.
read_req POST "/api/index.php?route=admin/users/create" "{\"name\":\"Feat Editor\",\"email\":\"feat-editor@wamarkng.com\",\"role\":\"editor\"}"
FEAT_ED_ID=$(printf '%s' "$B" | php -r '$d=json_decode(stream_get_contents(STDIN),true); echo $d["user"]["id"] ?? 0;')
FEAT_ED_EMAIL=$(printf '%s' "$B" | php -r '$d=json_decode(stream_get_contents(STDIN),true); echo $d["user"]["email"] ?? "";')
FEAT_ED_PW=$(printf '%s' "$B" | php -r '$d=json_decode(stream_get_contents(STDIN),true); echo $d["password"] ?? "";')
SAVE_JAR="$JAR"; JAR="$(mktemp)"; get_csrf
read_req POST "/api/index.php?route=auth/password" "{\"email\":\"$FEAT_ED_EMAIL\",\"password\":\"$FEAT_ED_PW\"}"
read_req POST "/api/index.php?route=auth/change-password" "{\"new_password\":\"FeatEditor2Pass\"}"
read_req GET "/api/index.php?route=admin/feature"
expect "editor can read feature images" "200" "$S"
read_req POST "/api/index.php?route=admin/feature/update" "{\"no\":\"02\",\"images\":[\"/images/editor-pick.webp\"]}"
expect "editor can update feature images" "200" "$S"
read_req GET "/api/index.php?route=feature"
printf '%s' "$B" | grep -q '"/images/editor-pick.webp"' && ok "editor change live on the public feed" || bad "editor change not live: $B"
read_req POST "/api/index.php?route=admin/feature/update" "{\"no\":\"02\",\"images\":[]}"
expect "editor reset ok" "200" "$S"
read_req POST "/api/index.php?route=auth/logout"
rm -f "$JAR"; JAR="$SAVE_JAR"; get_csrf
read_req POST "/api/index.php?route=admin/users/delete" "{\"id\":$FEAT_ED_ID}"
expect "temp editor deleted" "200" "$S"

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
