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
 * Blog — posts edited in the dashboard and served live through the API.
 * The static export ships reader pages that fetch /api/?route=blog… so
 * publishing never requires rebuilding the site.
 */

declare(strict_types=1);

final class Blog
{
    public const MAX_SLUG = 160;
    public const MAX_TITLE = 180;
    public const MAX_CATEGORY = 60;
    public const MAX_EXCERPT = 400;
    public const MAX_BODY = 60000;

    /** Public shape (never leaks drafts). */
    public static function shape(array $r): array
    {
        return [
            'id'           => (int) $r['id'],
            'slug'         => (string) $r['slug'],
            'title'        => (string) $r['title'],
            'category'     => (string) $r['category'],
            'excerpt'      => (string) $r['excerpt'],
            'body'         => (string) $r['body'],
            'cover'        => (string) $r['cover'],
            'author'       => (string) $r['author'],
            'published_at' => $r['published_at'] !== null ? (int) $r['published_at'] : null,
            'updated_at'   => (int) $r['updated_at'],
        ];
    }

    /** Admin shape (adds status + timestamps for the manager list). */
    public static function adminShape(array $r): array
    {
        return self::shape($r) + [
            'status'     => (string) $r['status'],
            'created_at' => (int) $r['created_at'],
        ];
    }

    public static function listPublic(int $limit = 60, int $offset = 0, string $category = ''): array
    {
        $limit = max(1, min($limit, 100));
        $offset = max(0, $offset);
        $sql = 'SELECT * FROM posts WHERE status = ?';
        $args = ['published'];
        if ($category !== '') {
            $sql .= ' AND category = ?';
            $args[] = $category;
        }
        $sql .= ' ORDER BY published_at DESC LIMIT ' . $limit . ' OFFSET ' . $offset;
        $st = DB::pdo()->prepare($sql);
        $st->execute($args);
        return array_map([self::class, 'shape'], $st->fetchAll());
    }

    public static function listAll(): array
    {
        $rows = DB::pdo()->query(
            'SELECT * FROM posts ORDER BY
             CASE WHEN status = \'published\' THEN 0 ELSE 1 END, updated_at DESC LIMIT 500'
        )->fetchAll();
        return array_map([self::class, 'adminShape'], $rows);
    }

    public static function findPublishedBySlug(string $slug): ?array
    {
        $st = DB::pdo()->prepare('SELECT * FROM posts WHERE slug = ? AND status = ?');
        $st->execute([$slug, 'published']);
        $row = $st->fetch();
        return $row === false ? null : self::shape($row);
    }

    public static function findAnyBySlug(string $slug): ?array
    {
        $st = DB::pdo()->prepare('SELECT * FROM posts WHERE slug = ?');
        $st->execute([$slug]);
        $row = $st->fetch();
        return $row === false ? null : self::adminShape($row);
    }

    public static function categories(): array
    {
        $rows = DB::pdo()->query(
            "SELECT DISTINCT category FROM posts WHERE status = 'published' ORDER BY category"
        )->fetchAll(PDO::FETCH_COLUMN);
        return array_values($rows);
    }

    private static function uniqueSlug(string $base, int $ignoreId = 0): string
    {
        $base = trim(substr($base, 0, self::MAX_SLUG), "-");
        if ($base === '') {
            $base = 'post';
        }
        $slug = $base;
        $i = 2;
        while (true) {
            $st = DB::pdo()->prepare('SELECT id FROM posts WHERE slug = ?');
            $st->execute([$slug]);
            $row = $st->fetch();
            if ($row === false || (int) $row['id'] === $ignoreId) {
                return $slug;
            }
            $slug = $base . '-' . $i++;
        }
    }

    /** Validate + normalize the writable fields of a post payload. */
    private static function fields(array $in, bool $forCreate): array
    {
        $errors = [];
        $out = [];

        if ($forCreate || array_key_exists('title', $in)) {
            $title = trim(Util::str($in, 'title', self::MAX_TITLE));
            if (mb_strlen($title) < 3) {
                $errors[] = 'Title must be at least 3 characters.';
            }
            $out['title'] = $title;
        }
        if ($forCreate || array_key_exists('category', $in)) {
            $out['category'] = trim(Util::str($in, 'category', self::MAX_CATEGORY));
            if ($out['category'] === '') {
                $out['category'] = 'News';
            }
        }
        if ($forCreate || array_key_exists('excerpt', $in)) {
            $out['excerpt'] = trim(Util::str($in, 'excerpt', self::MAX_EXCERPT));
        }
        if ($forCreate || array_key_exists('body', $in)) {
            $body = (string) ($in['body'] ?? '');
            if (mb_strlen($body) > self::MAX_BODY) {
                $errors[] = 'Body is too long (max 60,000 characters).';
            }
            $out['body'] = $body;
        }
        if ($forCreate || array_key_exists('cover', $in)) {
            $out['cover'] = self::sanitizeSrc(Util::str($in, 'cover', 400));
        }
        if ($forCreate || array_key_exists('status', $in)) {
            $status = ($in['status'] ?? '') === 'published' ? 'published' : 'draft';
            $out['status'] = $status;
        }

        if ($errors) {
            json_out(['ok' => false, 'error' => 'invalid_post', 'message' => implode(' ', $errors)], 422);
        }
        return $out;
    }

    public static function create(array $in, string $author): array
    {
        $f = self::fields($in, true);
        $now = time();
        $slug = self::uniqueSlug(self::slugify((string) ($in['slug'] ?? '') ?: $f['title']));
        $published = $f['status'] === 'published' ? $now : null;
        $st = DB::pdo()->prepare(
            'INSERT INTO posts (slug, title, category, excerpt, body, cover, author, status, published_at, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $st->execute([
            $slug, $f['title'], $f['category'], $f['excerpt'], $f['body'],
            $f['cover'], $author, $f['status'], $published, $now, $now,
        ]);
        $id = (int) DB::pdo()->lastInsertId();
        return ['ok' => true, 'id' => $id, 'slug' => $slug];
    }

    public static function update(int $id, array $in): array
    {
        $st = DB::pdo()->prepare('SELECT * FROM posts WHERE id = ?');
        $st->execute([$id]);
        $row = $st->fetch();
        if ($row === false) {
            return ['ok' => false, 'error' => 'not_found'];
        }

        $f = self::fields($in, false);
        $sets = [];
        $args = [];
        foreach ($f as $k => $v) {
            $sets[] = "$k = ?";
            $args[] = $v;
        }
        if (array_key_exists('slug', $in)) {
            $sets[] = 'slug = ?';
            $args[] = self::uniqueSlug(self::slugify((string) $in['slug'] ?: (string) $row['slug']), $id);
        }
        // First publish stamps published_at; unpublish keeps the history.
        if (($f['status'] ?? '') === 'published' && $row['status'] !== 'published') {
            $sets[] = 'published_at = ?';
            $args[] = time();
        }
        if (!$sets) {
            return ['ok' => false, 'error' => 'nothing_to_update'];
        }
        $sets[] = 'updated_at = ?';
        $args[] = time();
        $args[] = $id;

        $st = DB::pdo()->prepare('UPDATE posts SET ' . implode(', ', $sets) . ' WHERE id = ?');
        $st->execute($args);
        return ['ok' => true];
    }

    public static function delete(int $id): array
    {
        $st = DB::pdo()->prepare('DELETE FROM posts WHERE id = ?');
        $st->execute([$id]);
        return ['ok' => true];
    }

    /** URL-safe slug from arbitrary text. */
    public static function slugify(string $text): string
    {
        $text = strtolower(trim($text));
        $text = preg_replace('/[^a-z0-9]+/', '-', $text) ?? '';
        return trim($text, '-');
    }

    /** Only local media paths or direct image URLs are allowed as covers. */
    private static function sanitizeSrc(string $src): string
    {
        if ($src === '') {
            return '';
        }
        if ($src[0] === '/' && !str_contains($src, '..')) {
            return $src;
        }
        if (filter_var($src, FILTER_VALIDATE_URL) && preg_match('/\.(webp|jpe?g|png|gif|avif)(\?|$)/i', $src)) {
            return $src;
        }
        return '';
    }
}
