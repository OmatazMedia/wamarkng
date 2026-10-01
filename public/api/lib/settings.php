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
 * Key/value site settings on top of the settings table.
 */

declare(strict_types=1);

final class Settings
{
    /** @var array<string,string>|null */
    private static ?array $cache = null;

    private static function load(): void
    {
        if (self::$cache !== null) {
            return;
        }
        $rows = DB::pdo()->query('SELECT key, value FROM settings')->fetchAll();
        $map = [];
        foreach ($rows as $r) {
            $map[(string) $r['key']] = (string) $r['value'];
        }
        self::$cache = $map;
    }

    public static function get(string $key, string $default = ''): string
    {
        self::load();
        return self::$cache[$key] ?? $default;
    }

    public static function set(string $key, string $value): void
    {
        $st = DB::pdo()->prepare(
            'INSERT INTO settings (key, value) VALUES (?, ?)
             ON CONFLICT(key) DO UPDATE SET value = excluded.value'
        );
        $st->execute([$key, $value]);
        self::$cache = null;
    }

    /** Whitelisted public settings for the front-end. */
    public static function public(): array
    {
        $out = [];
        foreach (array_keys(Config::DEFAULT_SITE) as $k) {
            $out[$k] = self::get($k);
        }
        return $out;
    }
}
