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
 * SQLite (PDO) storage: schema, seeded site settings and starter gallery.
 */

declare(strict_types=1);

final class DB
{
    private static ?PDO $pdo = null;

    public static function pdo(): PDO
    {
        if (self::$pdo instanceof PDO) {
            return self::$pdo;
        }
        if (!is_dir(Config::DB_DIR)) {
            @mkdir(Config::DB_DIR, 0775, true);
        }
        $pdo = new PDO('sqlite:' . Config::DB_FILE, null, null, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        $pdo->exec('PRAGMA journal_mode = WAL');
        $pdo->exec('PRAGMA foreign_keys = ON');
        $pdo->exec('PRAGMA busy_timeout = 5000');
        return self::$pdo = $pdo;
    }

    /** Create the schema (idempotent) and seed starter content. */
    public static function migrate(): void
    {
        $pdo = self::pdo();
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS settings (
                key   TEXT PRIMARY KEY,
                value TEXT NOT NULL DEFAULT ''
            );
        ");
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS users (
                id               INTEGER PRIMARY KEY AUTOINCREMENT,
                email            TEXT NOT NULL UNIQUE,
                name             TEXT NOT NULL DEFAULT '',
                password_hash    TEXT NOT NULL,
                must_change      INTEGER NOT NULL DEFAULT 0,
                failed_count     INTEGER NOT NULL DEFAULT 0,
                locked_until     INTEGER NOT NULL DEFAULT 0,
                created_at       INTEGER NOT NULL,
                last_login_at    INTEGER
            );
        ");
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS login_fails (
                ident TEXT NOT NULL,
                stamp INTEGER NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_fails_ident ON login_fails (ident, stamp);
        ");
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS contact_messages (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                name       TEXT NOT NULL,
                email      TEXT NOT NULL,
                phone      TEXT NOT NULL DEFAULT '',
                subject    TEXT NOT NULL DEFAULT '',
                message    TEXT NOT NULL,
                ip         TEXT NOT NULL DEFAULT '',
                created_at INTEGER NOT NULL,
                read_at    INTEGER
            );
            CREATE INDEX IF NOT EXISTS idx_msg_created ON contact_messages (created_at DESC);
        ");
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS gallery (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                title      TEXT NOT NULL DEFAULT '',
                category   TEXT NOT NULL DEFAULT 'General',
                media_type TEXT NOT NULL DEFAULT 'image',
                src        TEXT NOT NULL,
                poster     TEXT NOT NULL DEFAULT '',
                caption    TEXT NOT NULL DEFAULT '',
                sort       INTEGER NOT NULL DEFAULT 0,
                active     INTEGER NOT NULL DEFAULT 1,
                created_at INTEGER NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_gallery_sort ON gallery (active, sort DESC);
        ");

        self::seed($pdo);

        // Idempotent column migrations for databases created before these
        // columns existed (existing installs keep their data).
        self::addColumn($pdo, 'gallery', 'caption', "TEXT NOT NULL DEFAULT ''");
        self::addColumn($pdo, 'contact_messages', 'read_at', 'INTEGER');
        // Multi-user support (pre-existing installs migrate in place; the
        // wizard-created first admin keeps role=admin, status=active).
        self::addColumn($pdo, 'users', 'role', "TEXT NOT NULL DEFAULT 'admin'");
        self::addColumn($pdo, 'users', 'status', "TEXT NOT NULL DEFAULT 'active'");
        self::addColumn($pdo, 'users', 'created_by', 'INTEGER');
    }

    private static function addColumn(PDO $pdo, string $table, string $column, string $ddl): void
    {
        $cols = $pdo->query("PRAGMA table_info({$table})")->fetchAll();
        foreach ($cols as $c) {
            if (($c['name'] ?? '') === $column) {
                return;
            }
        }
        $pdo->exec("ALTER TABLE {$table} ADD COLUMN {$column} {$ddl}");
    }

    private static function seed(PDO $pdo): void
    {
        foreach (Config::DEFAULT_SITE as $k => $v) {
            $st = $pdo->prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
            $st->execute([$k, $v]);
        }
        $count = (int) $pdo->query('SELECT COUNT(*) FROM gallery')->fetchColumn();
        if ($count === 0) {
            $ins = $pdo->prepare(
                'INSERT INTO gallery (title, category, media_type, src, sort, active, created_at)
                 VALUES (?, ?, ?, ?, ?, 1, ?)'
            );
            $seed = [
                ['Pipeline Maintenance',                   'Oil & Gas',      '/images/project-3.webp'],
                ['Flow Station Maintenance',               'Oil & Gas',      '/images/project-0011-1.webp'],
                ['Security Equipment Installation',        'Security',       '/images/project-0052.webp'],
                ['CCTV Surveillance Rollout',              'Surveillance',   '/images/project-0056.webp'],
                ['Technical Surveillance Countermeasures', 'Surveillance',   '/images/project-at-12-07-55_f4d81555.webp'],
                ['Oil & Gas Measurement',                  'Oil & Gas',      '/images/project-0005.webp'],
                ['Access Control System',                  'Security',       '/images/cctv.webp'],
                ['Plant Installation',                     'Oil & Gas',      '/images/oilgas.webp'],
                ['Vehicle Tracking Deployment',            'Security',       '/images/vehicle-tracking.webp'],
            ];
            $sort = count($seed);
            foreach ($seed as [$title, $cat, $src]) {
                $ins->execute([$title, $cat, 'image', $src, $sort--, time()]);
            }
        }
    }
}
