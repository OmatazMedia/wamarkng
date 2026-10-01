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
 * Small shared utilities (JSON body parsing, CSRF, validation, rate keys).
 */

declare(strict_types=1);

final class Util
{
    /** Decode the JSON request body (or form-encoded fallback). */
    public static function input(): array
    {
        $raw = file_get_contents('php://input') ?: '';
        $data = json_decode($raw, true);
        if (is_array($data)) {
            return $data;
        }
        return $_POST ?: [];
    }

    /** Read one field, trimmed, coerced to string. */
    public static function str(array $in, string $key, int $max = 500): string
    {
        $v = $in[$key] ?? '';
        return is_scalar($v) ? mb_substr(trim((string) $v), 0, $max) : '';
    }

    public static function emailValid(string $email): bool
    {
        return (bool) filter_var($email, FILTER_VALIDATE_EMAIL) && strlen($email) <= 254;
    }

    /** Per-identity rate-limit key (IP + optional handle). */
    public static function clientKey(string $handle = ''): string
    {
        $ip = $_SERVER['HTTP_CF_CONNECTING_IP']
            ?? $_SERVER['HTTP_X_FORWARDED_FOR']
            ?? $_SERVER['REMOTE_ADDR']
            ?? '0.0.0.0';
        $ip = trim(explode(',', (string) $ip)[0]);
        return $ip . ($handle !== '' ? '|' . strtolower($handle) : '');
    }

    public static function now(): int
    {
        return time();
    }

    /** Human "3h 12m" style duration for lockout messages. */
    public static function humanSeconds(int $s): string
    {
        $h = intdiv($s, 3600);
        $m = intdiv($s % 3600, 60);
        if ($h > 0) {
            return $m > 0 ? "{$h}h {$m}m" : "{$h}h";
        }
        return $m > 0 ? "{$m}m" : 'less than a minute';
    }

    /** Cut a string for log lines. */
    public static function brief(string $s, int $n = 60): string
    {
        return mb_substr(preg_replace('/\s+/', ' ', trim($s)) ?? '', 0, $n);
    }
}
