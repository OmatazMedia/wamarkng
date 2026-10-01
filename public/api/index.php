<?php

/**
 * Built by Omataz Media — Web Development & Design
 * Website   : https://www.omatazmedia.com.ng
 * Email     : hello@omatazmedia.com.ng
 * Phone     : +234 9024599289, +234 7037373304
 * WhatsApp  : https://wa.me/message/M3QUHNVONY6NK1
 * Social    : @omatazmedia — Facebook · Instagram · X · YouTube
 * GitHub    : https://github.com/omatazmedia
 * Contact   : Johnson Toluwani
 *
 * WAMARK API router — every request funnels through here
 * (.htaccess rewrites /api/* to index.php; internals stay unreachable).
 */

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$route  = $_GET['route'] ?? '';
$route  = trim((string) $route, "/");

// REST-style overrides: POST + _method=PUT/DELETE for hosts without PUT.
$in = [];
if ($method === 'POST') {
    $in = Util::input();
    $override = strtoupper((string) ($in['_method'] ?? ''));
    if (in_array($override, ['PUT', 'PATCH', 'DELETE'], true)) {
        $method = $override;
    }
}

/**
 * Require a valid CSRF token (header or body field).
 */
function require_csrf(array $in): void
{
    $token = (string) ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? ($in['csrf'] ?? ''));
    if (!Auth::csrfValid($token)) {
        json_out(['ok' => false, 'error' => 'bad_csrf'], 403);
    }
}

function require_admin(): array
{
    $uid = Auth::userId();
    if ($uid === null) {
        json_out(['ok' => false, 'error' => 'unauthorized'], 401);
    }
    if (Auth::mustChangePassword()) {
        json_out(['ok' => false, 'error' => 'must_change_password'], 403);
    }
    $user = Auth::userById($uid);
    if ($user === null) {
        json_out(['ok' => false, 'error' => 'unauthorized'], 401);
    }
    return $user;
}

switch (true) {

    /* ------------------------------------------------ service status */
    case $route === '' && $method === 'GET':
        json_out([
            'ok'        => true,
            'service'   => 'wamark-api',
            'installed' => Config::isInstalled(),
            'version'   => '1.0.0',
        ]);

    /* ------------------------------------------------ csrf + captcha */
    case $route === 'csrf' && $method === 'GET':
        $a = random_int(2, 9);
        $b = random_int(2, 9);
        $_SESSION['captcha_sum'] = $a + $b;
        json_out([
            'ok'      => true,
            'csrf'    => Auth::csrf(),
            'captcha' => ['a' => $a, 'b' => $b],
        ]);

    /* ------------------------------------------------ public settings */
    case $route === 'settings' && $method === 'GET':
        json_out(['ok' => true, 'settings' => Settings::public()]);

    /* ------------------------------------------------ contact form */
    case $route === 'contact' && $method === 'POST':
        require_installed();
        require_csrf($in);

        // Honeypot: real users never fill this hidden field.
        if (Util::str($in, '_hp', 100) !== '') {
            json_out(['ok' => true, 'sent' => true]); // silently swallow bots
        }

        // Human proof: sum of the numbers issued with the CSRF token.
        $expected = (int) ($_SESSION['captcha_sum'] ?? -1);
        unset($_SESSION['captcha_sum']);
        if ((int) ($in['captcha_answer'] ?? -1) !== $expected) {
            json_out(['ok' => false, 'error' => 'captcha_failed', 'message' => 'Human verification failed. Please try the new question.'], 422);
        }

        $name    = Util::str($in, 'name', 120);
        $email   = mb_strtolower(Util::str($in, 'email', 254));
        $phone   = Util::str($in, 'phone', 40);
        $subject = Util::str($in, 'subject', 150);
        $message = Util::str($in, 'message', 5000);

        if (mb_strlen($name) < 2) {
            json_out(['ok' => false, 'error' => 'invalid_name'], 422);
        }
        if (!Util::emailValid($email)) {
            json_out(['ok' => false, 'error' => 'invalid_email'], 422);
        }
        if (mb_strlen($message) < 10) {
            json_out(['ok' => false, 'error' => 'invalid_message', 'message' => 'Message must be at least 10 characters.'], 422);
        }

        // Rate limit: 3 messages per IP per hour.
        $st = DB::pdo()->prepare(
            'SELECT COUNT(*) FROM contact_messages WHERE ip = ? AND created_at > ?'
        );
        $st->execute([Util::clientKey(), time() - 3600]);
        if ((int) $st->fetchColumn() >= Config::CONTACT_RATE_LIMIT) {
            json_out(['ok' => false, 'error' => 'rate_limited', 'message' => 'Too many messages from this connection. Please try again later.'], 429);
        }

        $ip = explode('|', Util::clientKey())[0];
        DB::pdo()->prepare(
            'INSERT INTO contact_messages (name, email, phone, subject, message, ip, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        )->execute([$name, $email, $phone, $subject, $message, $ip, time()]);

        $mail = Mailer::sendContact([
            'name' => $name, 'email' => $email, 'phone' => $phone,
            'subject' => $subject, 'message' => $message, 'ip' => $ip,
        ]);

        json_out([
            'ok'      => true,
            'sent'    => $mail['sent'] ?? false,
            'note'    => $mail['note'] ?? null,
            'message' => 'Thank you! Your message has been sent to our team.',
        ]);

    /* ------------------------------------------------ auth: check email */
    case $route === 'auth/check' && $method === 'POST':
        require_installed();
        require_csrf($in);
        $email = mb_strtolower(Util::str($in, 'email', 254));
        if (!Util::emailValid($email)) {
            json_out(['ok' => false, 'error' => 'invalid_email'], 422);
        }
        $state = Auth::failState($email);
        json_out([
            'ok'       => true,
            'exists'   => Auth::userByEmail($email) !== null,
            'locked'   => $state['locked'],
            'retry_in' => $state['retry_in'],
            'fails'    => $state['fails'],
            'message'  => $state['locked']
                ? 'Too many failed attempts. Try again in ' . Util::humanSeconds($state['retry_in']) . '.'
                : null,
        ]);

    /* ------------------------------------------------ auth: verify password */
    case $route === 'auth/password' && $method === 'POST':
        require_installed();
        require_csrf($in);
        $email    = mb_strtolower(Util::str($in, 'email', 254));
        $password = (string) ($in['password'] ?? '');
        if (!is_string($password) || $password === '') {
            json_out(['ok' => false, 'error' => 'invalid_password'], 422);
        }

        $state = Auth::failState($email);
        if ($state['locked']) {
            json_out([
                'ok'       => false,
                'error'    => 'locked',
                'retry_in' => $state['retry_in'],
                'message'  => 'This email is locked after too many failed attempts. Try again in ' . Util::humanSeconds($state['retry_in']) . '.',
            ], 423);
        }

        $user  = Auth::userByEmail($email);
        $valid = $user !== null && password_verify($password, (string) $user['password_hash']);

        if (!$valid) {
            $fails = Auth::recordFail($email);
            if ($user !== null && $fails >= Config::MAX_LOGIN_FAILS) {
                Auth::lockUser((int) $user['id'], time() + Config::LOCKOUT_SECONDS);
                $state = Auth::failState($email);
                json_out([
                    'ok'       => false,
                    'error'    => 'locked',
                    'retry_in' => $state['retry_in'],
                    'message'  => 'Account locked for ' . Util::humanSeconds($state['retry_in']) . ' after 4 failed attempts.',
                ], 423);
            }
            json_out([
                'ok'       => false,
                'error'    => 'bad_credentials',
                'fails'    => $fails,
                'attempts_left' => max(Config::MAX_LOGIN_FAILS - $fails, 0),
                'message'  => 'Incorrect password. ' . max(Config::MAX_LOGIN_FAILS - $fails, 0) . ' attempt(s) left before this email is locked for 4 hours.',
            ], 401);
        }

        Auth::clearFails($email);
        Auth::login((int) $user['id'], $email, (bool) $user['must_change']);
        json_out([
            'ok'   => true,
            'user' => [
                'email'       => $email,
                'name'        => (string) $user['name'],
                'must_change' => (bool) $user['must_change'],
            ],
        ]);

    /* ------------------------------------------------ auth: session info */
    case $route === 'auth/me' && $method === 'GET':
        $uid = Auth::userId();
        if ($uid === null) {
            json_out(['ok' => false, 'error' => 'unauthorized'], 401);
        }
        $user = Auth::userById($uid);
        if ($user === null) {
            json_out(['ok' => false, 'error' => 'unauthorized'], 401);
        }
        json_out([
            'ok'   => true,
            'user' => [
                'email'       => (string) $user['email'],
                'name'        => (string) $user['name'],
                'must_change' => (bool) $user['must_change'],
                'last_login'  => $user['last_login_at'] ? (int) $user['last_login_at'] : null,
            ],
        ]);

    /* ------------------------------------------------ auth: change password */
    case $route === 'auth/change-password' && $method === 'POST':
        require_installed();
        require_csrf($in);
        $uid = Auth::userId();
        if ($uid === null) {
            json_out(['ok' => false, 'error' => 'unauthorized'], 401);
        }
        $user = Auth::userById($uid);
        if ($user === null) {
            json_out(['ok' => false, 'error' => 'unauthorized'], 401);
        }

        $new = (string) ($in['new_password'] ?? '');
        if (strlen($new) < 10 || !preg_match('/[A-Za-z]/', $new) || !preg_match('/\d/', $new)) {
            json_out(['ok' => false, 'error' => 'weak_password', 'message' => 'Use at least 10 characters including letters and numbers.'], 422);
        }

        $mustChange = (bool) $user['must_change'];
        if (!$mustChange) {
            $current = (string) ($in['current_password'] ?? '');
            if (!password_verify($current, (string) $user['password_hash'])) {
                json_out(['ok' => false, 'error' => 'bad_current_password'], 401);
            }
        }

        $st = DB::pdo()->prepare(
            'UPDATE users SET password_hash = ?, must_change = 0 WHERE id = ?'
        );
        $st->execute([password_hash($new, PASSWORD_DEFAULT), $uid]);
        Auth::login($uid, (string) $user['email'], false); // rotate session id
        json_out(['ok' => true, 'message' => 'Password updated.']);

    /* ------------------------------------------------ auth: logout */
    case $route === 'auth/logout' && $method === 'POST':
        Auth::logout();
        json_out(['ok' => true]);

    /* ------------------------------------------------ public gallery */
    case $route === 'gallery' && $method === 'GET':
        require_installed();
        json_out(['ok' => true, 'items' => Gallery::listPublic()]);

    /* ------------------------------------------------ admin: dashboard data */
    case $route === 'admin/summary' && $method === 'GET':
        require_admin();
        $messages = (int) DB::pdo()->query('SELECT COUNT(*) FROM contact_messages')->fetchColumn();
        $gallery  = (int) DB::pdo()->query('SELECT COUNT(*) FROM gallery')->fetchColumn();
        json_out([
            'ok'   => true,
            'data' => [
                'messages' => $messages,
                'gallery'  => $gallery,
                'domain'   => Config::domain(),
                'mail_from' => Config::mailFrom(),
            ],
        ]);

    case $route === 'admin/messages' && $method === 'GET':
        require_admin();
        $rows = DB::pdo()->query(
            'SELECT id, name, email, phone, subject, message, ip, created_at, read_at
             FROM contact_messages ORDER BY created_at DESC LIMIT 200'
        )->fetchAll();
        json_out(['ok' => true, 'messages' => $rows]);

    case $route === 'admin/messages/read' && $method === 'POST':
        require_admin();
        require_csrf($in);
        $id = (int) ($in['id'] ?? 0);
        if ($id <= 0) {
            json_out(['ok' => false, 'error' => 'invalid_id'], 422);
        }
        DB::pdo()->prepare('UPDATE contact_messages SET read_at = ? WHERE id = ?')
            ->execute([time(), $id]);
        json_out(['ok' => true]);

    case $route === 'admin/messages/delete' && $method === 'POST':
        require_admin();
        require_csrf($in);
        $id = (int) ($in['id'] ?? 0);
        if ($id <= 0) {
            json_out(['ok' => false, 'error' => 'invalid_id'], 422);
        }
        DB::pdo()->prepare('DELETE FROM contact_messages WHERE id = ?')->execute([$id]);
        json_out(['ok' => true]);

    /* ------------------------------------------------ admin: site settings */
    case $route === 'admin/settings' && $method === 'GET':
        require_admin();
        json_out([
            'ok'        => true,
            'settings'  => Settings::public(),
            'mail_from' => Config::mailFrom(),
            'domain'    => Config::domain(),
        ]);

    case $route === 'admin/settings' && $method === 'POST':
        require_admin();
        require_csrf($in);
        $caps = [
            'site_name'       => 120,
            'site_tagline'    => 200,
            'contact_email'   => 254,
            'contact_phones'  => 200,
            'contact_address' => 300,
        ];
        foreach ($caps as $key => $max) {
            if (!array_key_exists($key, $in)) {
                continue;
            }
            $v = Util::str($in, $key, $max);
            if ($key === 'contact_email' && $v !== '' && !Util::emailValid($v)) {
                json_out(['ok' => false, 'error' => 'invalid_email', 'message' => 'The contact email is not a valid address.'], 422);
            }
            Settings::set($key, $v);
        }
        json_out(['ok' => true, 'settings' => Settings::public()]);

    /* ------------------------------------------------ admin: gallery list */
    case $route === 'admin/gallery' && $method === 'GET':
        require_admin();
        json_out(['ok' => true, 'items' => Gallery::listAll()]);

    /* ------------------------------------------------ admin: gallery CRUD */
    case $route === 'gallery' && $method === 'POST':
        require_installed();
        require_admin();
        require_csrf($in);
        $file = $_FILES['file'] ?? null;
        $res = Gallery::create($in, is_array($file) ? $file : null);
        if (!$res['ok']) {
            json_out($res, 422);
        }
        json_out($res);

    case $route === 'gallery/update' && $method === 'POST':
        require_admin();
        require_csrf($in);
        $id = (int) ($in['id'] ?? 0);
        if ($id <= 0) {
            json_out(['ok' => false, 'error' => 'invalid_id'], 422);
        }
        $res = Gallery::update($id, $in);
        json_out($res, $res['ok'] ? 200 : 422);

    case $route === 'gallery/delete' && $method === 'POST':
        require_admin();
        require_csrf($in);
        $id = (int) ($in['id'] ?? 0);
        if ($id <= 0) {
            json_out(['ok' => false, 'error' => 'invalid_id'], 422);
        }
        json_out(Gallery::delete($id));

    /* ------------------------------------------------ 404 */
    default:
        json_out(['ok' => false, 'error' => 'not_found'], 404);
}
