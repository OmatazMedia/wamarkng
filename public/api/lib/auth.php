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
 * Authentication: email-first login, 4-strike per-email lockout (4h),
 * brute-force throttling and CSRF for the contact form.
 */

declare(strict_types=1);

final class Auth
{
    public static function session_start(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }
        session_name(Config::SESSION_NAME);
        session_set_cookie_params([
            'lifetime' => 0,
            'path'     => '/',
            'httponly' => true,
            'samesite' => 'Lax',
            'secure'   => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
                          || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https'),
        ]);
        session_start();
        if (empty($_SESSION['csrf'])) {
            $_SESSION['csrf'] = bin2hex(random_bytes(32));
        }
    }

    public static function csrf(): string
    {
        self::session_start();
        return (string) ($_SESSION['csrf'] ?? '');
    }

    public static function csrfValid(string $token): bool
    {
        self::session_start();
        return is_string($_SESSION['csrf'] ?? null)
            && $token !== ''
            && hash_equals((string) $_SESSION['csrf'], $token);
    }

    public static function userId(): ?int
    {
        self::session_start();
        $id = $_SESSION['uid'] ?? null;
        return is_int($id) ? $id : null;
    }

    public static function logout(): void
    {
        self::session_start();
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            setcookie(session_name(), '', time() - 42000, '/');
        }
        session_destroy();
    }

    /**
     * Check whether an email identity is currently locked.
     * @return array{locked:bool, retry_in:int, fails:int}
     */
    public static function failState(string $ident): array
    {
        $st = DB::pdo()->prepare(
            'SELECT COUNT(*) FROM login_fails WHERE ident = ? AND stamp > ?'
        );
        $st->execute([mb_strtolower($ident), self::now() - Config::LOCKOUT_SECONDS]);
        $fails = (int) $st->fetchColumn();

        $lock = self::userLock($ident);
        $locked = $fails >= Config::MAX_LOGIN_FAILS || $lock > self::now();
        $retryIn = max($lock - self::now(), 0);
        if ($locked && $retryIn === 0) {
            // Window-based lock: oldest fail + lockout.
            $st = DB::pdo()->prepare(
                'SELECT MIN(stamp) FROM login_fails WHERE ident = ? AND stamp > ?'
            );
            $st->execute([mb_strtolower($ident), self::now() - Config::LOCKOUT_SECONDS]);
            $first = (int) $st->fetchColumn();
            if ($first > 0) {
                $retryIn = max($first + Config::LOCKOUT_SECONDS - self::now(), 0);
            }
        }
        return ['locked' => $locked, 'retry_in' => $retryIn, 'fails' => $fails];
    }

    /** Clear failed attempts for an identity after success. */
    public static function clearFails(string $ident): void
    {
        $st = DB::pdo()->prepare('DELETE FROM login_fails WHERE ident = ?');
        $st->execute([mb_strtolower($ident)]);
    }

    /** Record a failed attempt; locks the identity on the 4th strike. */
    public static function recordFail(string $ident): int
    {
        $key = mb_strtolower($ident);
        $st = DB::pdo()->prepare('INSERT INTO login_fails (ident, stamp) VALUES (?, ?)');
        $st->execute([$key, self::now()]);
        // Drop strikes older than the lockout window (housekeeping).
        DB::pdo()->prepare('DELETE FROM login_fails WHERE stamp < ?')
            ->execute([self::now() - Config::LOCKOUT_SECONDS]);
        return self::failState($key)['fails'];
    }

    /** Find an active user by email. */
    public static function userByEmail(string $email): ?array
    {
        $st = DB::pdo()->prepare('SELECT * FROM users WHERE email = ?');
        $st->execute([mb_strtolower($email)]);
        $row = $st->fetch();
        return $row === false ? null : $row;
    }

    public static function userById(int $id): ?array
    {
        $st = DB::pdo()->prepare('SELECT * FROM users WHERE id = ?');
        $st->execute([$id]);
        $row = $st->fetch();
        return $row === false ? null : $row;
    }

    public static function login(int $userId, string $email, bool $mustChange): void
    {
        self::session_start();
        session_regenerate_id(true); // prevent session fixation
        $_SESSION['uid'] = $userId;
        $_SESSION['email'] = mb_strtolower($email);
        $_SESSION['must_change'] = $mustChange;
        $st = DB::pdo()->prepare('UPDATE users SET last_login_at = ? WHERE id = ?');
        $st->execute([self::now(), $userId]);
    }

    public static function mustChangePassword(): bool
    {
        self::session_start();
        return !empty($_SESSION['must_change']);
    }

    /** Per-user hard lock timestamp (0 = none). */
    private static function userLock(string $ident): int
    {
        $st = DB::pdo()->prepare('SELECT locked_until FROM users WHERE email = ?');
        $st->execute([mb_strtolower($ident)]);
        $v = $st->fetchColumn();
        return $v === false ? 0 : (int) $v;
    }

    public static function lockUser(int $userId, int $until): void
    {
        $st = DB::pdo()->prepare(
            'UPDATE users SET locked_until = ?, failed_count = failed_count + 1 WHERE id = ?'
        );
        $st->execute([$until, $userId]);
    }

    public static function now(): int
    {
        return time();
    }
}
