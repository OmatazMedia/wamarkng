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
 * WAMARK Nigeria Limited — API configuration.
 * SQLite-backed on purpose: zero credentials, zero external services.
 * Drop the static export on cPanel and this works with stock PHP.
 */

declare(strict_types=1);

final class Config
{
    /** Paths are relative to this api/ folder so sub-folder installs work. */
    public const DB_DIR         = __DIR__ . '/data/db';
    public const DB_FILE        = __DIR__ . '/data/db/wamark.sqlite3';
    public const UPLOAD_DIR     = __DIR__ . '/data/uploads';
    public const INSTALL_LOCK   = __DIR__ . '/data/installed.lock';
    public const INSTALL_KEY    = __DIR__ . '/install/key.bin';

    /** Default site identity — editable later from the dashboard. */
    public const DEFAULT_SITE = [
        'site_name'       => 'WAMARK Nigeria Limited',
        'site_tagline'    => 'Security, Surveillance & Oil & Gas Services',
        'contact_email'   => 'info@wamarkng.com',
        'contact_phones'  => '+234 803 7650 357, +234 818 6318 527',
        'contact_address' => 'Plot 1909, Cadastral Zone E27, Apo Resettlement, Abuja-FCT, Nigeria.',
    ];

    public const SESSION_NAME      = 'wamark_sid';
    public const MAX_LOGIN_FAILS   = 4;                 // 4 wrong tries …
    public const LOCKOUT_SECONDS   = 4 * 3600;          // … then 4-hour lockout
    public const CONTACT_RATE_LIMIT = 3;                // messages per IP per hour
    public const UPLOAD_MAX_BYTES  = 8 * 1024 * 1024;   // 8 MB per upload

    /** Allowed media extensions for gallery uploads. */
    public const IMAGE_EXTS = ['webp', 'jpg', 'jpeg', 'png', 'gif', 'avif'];
    public const VIDEO_EXTS = ['mp4', 'webm', 'mov', 'm4v'];

    /** Host domain (port stripped) — used for no-reply@ addresses. */
    public static function domain(): string
    {
        $host = $_SERVER['HTTP_HOST'] ?? ($_SERVER['SERVER_NAME'] ?? 'localhost');
        $host = strtolower(trim((string) $host));
        $host = preg_replace('/:\d+$/', '', $host) ?: 'localhost';
        return $host === 'localhost' ? 'localhost' : $host;
    }

    /**
     * Domain used inside generated EMAIL addresses. Unlike mail headers,
     * emails must pass FILTER_VALIDATE_EMAIL — hosts like localhost or
     * 127.0.0.1 (no dot) are rejected by PHP, so fall back to a safe name.
     */
    public static function mailDomain(): string
    {
        $d = self::domain();
        if ($d === '' || !str_contains($d, '.') || filter_var($d, FILTER_VALIDATE_IP)) {
            return 'wamark.local'; // localhost & IP hosts cannot form valid emails
        }
        return $d;
    }

    /** Outgoing mail identity — nothing for the site owner to configure. */
    public static function mailFrom(): string
    {
        return 'no-reply@' . self::mailDomain();
    }

    public static function isInstalled(): bool
    {
        return is_file(self::INSTALL_LOCK);
    }
}
