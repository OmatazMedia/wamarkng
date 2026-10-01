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
 * Installation wizard — runs once, self-locks.
 *
 * 1. Checks the host (PHP, PDO SQLite, writable folders, mail()).
 * 2. Creates the schema and seeds site settings + starter gallery.
 * 3. AUTO-GENERATES the admin email + password once, shows them here,
 *    and forces a change on first login (must_change = 1).
 */

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

if (Config::isInstalled()) {
    json_out([
        'ok'      => true,
        'already' => true,
        'message' => 'WAMARK is already installed. This wizard is locked — delete api/data/installed.lock only if you intend to reinstall from scratch.',
    ]);
}

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

/* ------------------------------------------------ environment check ---- */
if ($method === 'GET') {
    $checks = [
        'php_version'  => version_compare(PHP_VERSION, '8.0.0', '>='),
        'pdo_sqlite'   => extension_loaded('pdo_sqlite'),
        'data_writable' => is_writable(__DIR__ . '/data')
            || (is_dir(__DIR__ . '/data') ? is_writable(__DIR__ . '/data') : @mkdir(__DIR__ . '/data', 0775, true)),
        'install_key'  => is_writable(__DIR__ . '/install'),
        'mail'         => function_exists('mail'),
    ];
    json_out([
        'ok'      => true,
        'ready'   => !in_array(false, $checks, true),
        'checks'  => $checks,
        'details' => [
            'php'        => PHP_VERSION,
            'db_exists'  => is_file(Config::DB_FILE),
            'installed'  => false,
        ],
    ]);
}

/* ------------------------------------------------ run installation ---- */
if ($method === 'POST') {
    if (!function_exists('mail')) {
        json_out(['ok' => false, 'error' => 'mail_unavailable', 'message' => 'PHP mail() is disabled on this host — contact forms cannot send.'], 500);
    }
    if (!extension_loaded('pdo_sqlite')) {
        json_out(['ok' => false, 'error' => 'pdo_sqlite_missing', 'message' => 'Enable pdo_sqlite in the hosting PHP settings.'], 500);
    }

    foreach ([Config::DB_DIR, Config::UPLOAD_DIR, dirname(Config::INSTALL_KEY)] as $dir) {
        if (!is_dir($dir) && !@mkdir($dir, 0775, true)) {
            json_out(['ok' => false, 'error' => 'storage_unavailable', 'message' => "Cannot create folder: {$dir}. Check folder permissions (755/775)."], 500);
        }
    }

    // 1. Schema + seed content.
    DB::migrate();

    // 2. Auto-generated admin credentials — shown once, changed at first login.
    $email = 'admin.' . strtolower(bin2hex(random_bytes(4))) . '@' . Config::mailDomain();

    $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    $password = '';
    for ($i = 0; $i < 16; $i++) {
        $password .= $alphabet[random_int(0, strlen($alphabet) - 1)];
    }
    $password = 'Wm' . substr((string) bin2hex(random_bytes(4)), 0, 2) . $password; // ~20 chars, mixed

    $st = DB::pdo()->prepare(
        'INSERT INTO users (email, name, password_hash, must_change, created_at)
         VALUES (?, ?, ?, 1, ?)'
    );
    $st->execute([$email, 'Administrator', password_hash($password, PASSWORD_DEFAULT), time()]);

    // 3. One-time key (defense: wizard can never run again after lock).
    @file_put_contents(Config::INSTALL_KEY, bin2hex(random_bytes(32)));
    @file_put_contents(Config::INSTALL_LOCK, 'installed ' . gmdate('c'));
    @chmod(Config::INSTALL_LOCK, 0444);

    json_out([
        'ok'       => true,
        'admin'    => ['email' => $email, 'password' => $password],
        'login'    => '/login/',
        'message'  => 'Installation complete. Save the admin password now — it is shown only once and must be changed at first login.',
    ]);
}

json_out(['ok' => false, 'error' => 'method_not_allowed'], 405);
