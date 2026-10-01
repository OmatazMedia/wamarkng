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
    // A user suspended mid-session loses access immediately.
    if (Auth::statusOf($user) === 'suspended') {
        Auth::logout();
        json_out(['ok' => false, 'error' => 'suspended', 'message' => 'This account has been suspended.'], 403);
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

        $user = Auth::userByEmail($email);
        if ($user !== null && Auth::statusOf($user) === 'suspended') {
            json_out([
                'ok'      => false,
                'error'   => 'suspended',
                'message' => 'This account has been suspended. Contact an administrator.',
            ], 403);
        }
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
                'role'        => Auth::roleOf($user),
                'status'      => Auth::statusOf($user),
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
        $users    = (int) DB::pdo()->query('SELECT COUNT(*) FROM users')->fetchColumn();
        json_out([
            'ok'   => true,
            'data' => [
                'messages' => $messages,
                'gallery'  => $gallery,
                'users'    => $users,
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

    /* ------------------------------------------------ admin: user management */
    case $route === 'admin/users' && $method === 'GET':
        $actor = require_admin();
        if (Auth::roleOf($actor) !== 'admin') {
            json_out(['ok' => false, 'error' => 'forbidden', 'message' => 'Only administrators can manage users.'], 403);
        }
        $rows = DB::pdo()->query(
            'SELECT id, email, name, role, status, must_change, created_at, last_login_at, created_by
             FROM users ORDER BY id ASC LIMIT 500'
        )->fetchAll();
        json_out(['ok' => true, 'users' => $rows, 'me' => Auth::userId()]);

    case $route === 'admin/users/create' && $method === 'POST':
        $actor = require_admin();
        require_csrf($in);
        if (Auth::roleOf($actor) !== 'admin') {
            json_out(['ok' => false, 'error' => 'forbidden', 'message' => 'Only administrators can create users.'], 403);
        }
        $email = mb_strtolower(Util::str($in, 'email', 254));
        $name  = Util::str($in, 'name', 120);
        $role  = in_array(($in['role'] ?? ''), Config::USER_ROLES, true) ? (string) $in['role'] : 'editor';
        if (!Util::emailValid($email)) {
            json_out(['ok' => false, 'error' => 'invalid_email', 'message' => 'Enter a valid email address.'], 422);
        }
        if (mb_strlen($name) < 2) {
            json_out(['ok' => false, 'error' => 'invalid_name', 'message' => "Enter the user's full name."], 422);
        }
        if (Auth::userByEmail($email) !== null) {
            json_out(['ok' => false, 'error' => 'email_taken', 'message' => 'A user with that email already exists.'], 409);
        }
        $password = Auth::generatePassword();
        $st = DB::pdo()->prepare(
            'INSERT INTO users (email, name, password_hash, must_change, role, status, created_at, created_by)
             VALUES (?, ?, ?, 1, ?, \'active\', ?, ?)'
        );
        $st->execute([$email, $name, password_hash($password, PASSWORD_DEFAULT), $role, time(), (int) $actor['id']]);
        $id = (int) DB::pdo()->lastInsertId();
        json_out([
            'ok'       => true,
            'id'       => $id,
            'user'     => ['id' => $id, 'email' => $email, 'name' => $name, 'role' => $role, 'status' => 'active'],
            'password' => $password, // shown once; must_change forces a replacement at first login
            'message'  => 'User created. Copy the password now — it is shown only once and must be changed at first login.',
        ]);

    case $route === 'admin/users/update' && $method === 'POST':
        $actor = require_admin();
        require_csrf($in);
        if (Auth::roleOf($actor) !== 'admin') {
            json_out(['ok' => false, 'error' => 'forbidden', 'message' => 'Only administrators can edit users.'], 403);
        }
        $id = (int) ($in['id'] ?? 0);
        $target = $id > 0 ? Auth::userById($id) : null;
        if ($target === null) {
            json_out(['ok' => false, 'error' => 'not_found'], 404);
        }
        if (array_key_exists('name', $in)) {
            $name = Util::str($in, 'name', 120);
            if (mb_strlen($name) < 2) {
                json_out(['ok' => false, 'error' => 'invalid_name', 'message' => 'Name is too short.'], 422);
            }
            DB::pdo()->prepare('UPDATE users SET name = ? WHERE id = ?')->execute([$name, $id]);
        }
        if (array_key_exists('role', $in)) {
            $role = (string) $in['role'];
            if (!in_array($role, Config::USER_ROLES, true)) {
                json_out(['ok' => false, 'error' => 'invalid_role', 'message' => 'Role must be admin or editor.'], 422);
            }
            if ($id === (int) $actor['id'] && $role !== 'admin') {
                json_out(['ok' => false, 'error' => 'self_demote', 'message' => 'You cannot change your own role.'], 422);
            }
            DB::pdo()->prepare('UPDATE users SET role = ? WHERE id = ?')->execute([$role, $id]);
        }
        if (array_key_exists('status', $in)) {
            $status = (string) $in['status'];
            if (!in_array($status, Config::USER_STATUSES, true)) {
                json_out(['ok' => false, 'error' => 'invalid_status', 'message' => 'Status must be active or suspended.'], 422);
            }
            if ($id === (int) $actor['id'] && $status !== 'active') {
                json_out(['ok' => false, 'error' => 'self_suspend', 'message' => 'You cannot suspend your own account.'], 422);
            }
            DB::pdo()->prepare('UPDATE users SET status = ?, locked_until = 0 WHERE id = ?')->execute([$status, $id]);
        }
        if (array_key_exists('password', $in) && (string) $in['password'] !== '') {
            $new = (string) $in['password'];
            if (strlen($new) < 10 || !preg_match('/[A-Za-z]/', $new) || !preg_match('/\d/', $new)) {
                json_out(['ok' => false, 'error' => 'weak_password', 'message' => 'Use at least 10 characters including letters and numbers.'], 422);
            }
            DB::pdo()->prepare('UPDATE users SET password_hash = ?, must_change = 1 WHERE id = ?')
                ->execute([password_hash($new, PASSWORD_DEFAULT), $id]);
        }
        $fresh = Auth::userById($id);
        json_out([
            'ok'   => true,
            'user' => [
                'id'          => $id,
                'email'       => (string) $fresh['email'],
                'name'        => (string) $fresh['name'],
                'role'        => Auth::roleOf($fresh),
                'status'      => Auth::statusOf($fresh),
                'must_change' => (bool) $fresh['must_change'],
            ],
        ]);

    case $route === 'admin/users/delete' && $method === 'POST':
        $actor = require_admin();
        require_csrf($in);
        if (Auth::roleOf($actor) !== 'admin') {
            json_out(['ok' => false, 'error' => 'forbidden', 'message' => 'Only administrators can delete users.'], 403);
        }
        $id = (int) ($in['id'] ?? 0);
        if ($id === (int) $actor['id']) {
            json_out(['ok' => false, 'error' => 'self_delete', 'message' => 'You cannot delete your own account.'], 422);
        }
        $target = $id > 0 ? Auth::userById($id) : null;
        if ($target === null) {
            json_out(['ok' => false, 'error' => 'not_found'], 404);
        }
        $st = DB::pdo()->prepare('SELECT COUNT(*) FROM users WHERE id != ?');
        $st->execute([$id]);
        if ((int) $st->fetchColumn() === 0) {
            json_out(['ok' => false, 'error' => 'last_admin', 'message' => 'Cannot delete the only remaining user.'], 422);
        }
        DB::pdo()->prepare('DELETE FROM users WHERE id = ?')->execute([$id]);
        json_out(['ok' => true]);

    /* ------------------------------------------------ 404 */
    default:
        json_out(['ok' => false, 'error' => 'not_found'], 404);
}
