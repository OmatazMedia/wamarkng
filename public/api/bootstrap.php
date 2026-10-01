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
 * WAMARK API bootstrap — shared by the router (index.php) and installer.
 */

declare(strict_types=1);

ini_set('display_errors', '0');   // never leak paths/stack traces to visitors
ini_set('log_errors', '1');
error_reporting(E_ALL);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/lib/util.php';
require_once __DIR__ . '/lib/db.php';
require_once __DIR__ . '/lib/settings.php';
require_once __DIR__ . '/lib/auth.php';
require_once __DIR__ . '/lib/mailer.php';
require_once __DIR__ . '/lib/gallery.php';
require_once __DIR__ . '/lib/blog.php';

/**
 * Standard JSON response + exit.
 */
function json_out(array $payload, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    header('Cache-Control: no-store');
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

/** Fail-closed guard: every API entry point needs a completed install. */
function require_installed(): void
{
    if (!Config::isInstalled()) {
        json_out([
            'ok'       => false,
            'error'    => 'not_installed',
            'install'  => '/api/install.php',
            'message'  => 'Run the installation wizard first.',
        ], 503);
    }
}

// Harden the session cookie before anything opens a session.
Auth::session_start();
