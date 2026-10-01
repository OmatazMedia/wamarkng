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
 * Gallery management: list, create (upload), update, delete, reorder.
 */

declare(strict_types=1);

final class Gallery
{
    /** Public list for the projects page. */
    public static function listPublic(): array
    {
        $rows = DB::pdo()->query(
            'SELECT id, title, category, media_type, src, poster, sort
             FROM gallery WHERE active = 1 ORDER BY sort DESC, id DESC'
        )->fetchAll();
        return array_map([self::class, 'shape'], $rows);
    }

    /** Full list including inactive items (dashboard). */
    public static function listAll(): array
    {
        $rows = DB::pdo()->query(
            'SELECT id, title, category, media_type, src, poster, caption, sort, active, created_at
             FROM gallery ORDER BY sort DESC, id DESC'
        )->fetchAll();
        return array_map([self::class, 'shape'], $rows);
    }

    private static function shape(array $r): array
    {
        return [
            'id'         => (int) $r['id'],
            'title'      => (string) $r['title'],
            'category'   => (string) $r['category'],
            'media_type' => (string) $r['media_type'],
            'src'        => (string) $r['src'],
            'poster'     => (string) $r['poster'],
            'caption'    => (string) ($r['caption'] ?? ''),
            'sort'       => (int) $r['sort'],
            'active'     => (bool) ($r['active'] ?? 1),
        ];
    }

    /**
     * Store an uploaded image or video into api/data/uploads.
     * @return array{ok:bool, path?:string, error?:string}
     */
    public static function storeUpload(array $file, string $kind): array
    {
        if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            return ['ok' => false, 'error' => 'upload_failed'];
        }
        if (($file['size'] ?? 0) > Config::UPLOAD_MAX_BYTES) {
            return ['ok' => false, 'error' => 'too_large'];
        }
        $ext = strtolower(pathinfo((string) ($file['name'] ?? ''), PATHINFO_EXTENSION));
        $allowedExts = $kind === 'video'
            ? Config::VIDEO_EXTS
            : Config::IMAGE_EXTS;
        if (!in_array($ext, $allowedExts, true)) {
            return ['ok' => false, 'error' => 'bad_type'];
        }

        // Real content sniff — never trust the extension alone.
        $tmp = (string) $file['tmp_name'];
        $mime = (new finfo(FILEINFO_MIME_TYPE))->file($tmp) ?: '';
        $allowed = $kind === 'video'
            ? ['video/mp4', 'video/webm', 'video/quicktime']
            : ['image/webp', 'image/jpeg', 'image/png', 'image/gif', 'image/avif'];
        if (!in_array($mime, $allowed, true)) {
            return ['ok' => false, 'error' => 'bad_mime'];
        }

        if (!is_dir(Config::UPLOAD_DIR) && !@mkdir(Config::UPLOAD_DIR, 0775, true)) {
            return ['ok' => false, 'error' => 'storage_unavailable'];
        }

        $name = date('Ymd') . '-' . bin2hex(random_bytes(8)) . '.' . $ext;
        $dest = Config::UPLOAD_DIR . '/' . $name;
        if (!move_uploaded_file($tmp, $dest)) {
            return ['ok' => false, 'error' => 'move_failed'];
        }
        @chmod($dest, 0644);
        return ['ok' => true, 'path' => '/api/data/uploads/' . $name];
    }

    public static function create(array $in, ?array $uploadFile): array
    {
        $type = ($in['media_type'] ?? 'image') === 'video' ? 'video' : 'image';
        $src = '';

        if (is_array($uploadFile) && ($uploadFile['error'] ?? 1) !== UPLOAD_ERR_NO_FILE) {
            $up = self::storeUpload($uploadFile, $type);
            if (!$up['ok']) {
                return $up;
            }
            $src = (string) $up['path'];
        } elseif (isset($in['src']) && is_string($in['src']) && $in['src'] !== '') {
            // Reference an existing site asset (/images/foo.webp) or an
            // external media URL (https://…/clip.mp4 or a video embed page).
            $src = $in['src'];
            $isLocal = (bool) preg_match(
                '#^/([\w\-.]+/)*[\w\-. ]+\.(webp|jpe?g|png|gif|avif|mp4|webm|mov|m4v)$#i',
                $src
            );
            $isUrl = (bool) filter_var($src, FILTER_VALIDATE_URL);
            if (!$isLocal && !$isUrl) {
                return ['ok' => false, 'error' => 'bad_src'];
            }
            if ($isUrl) {
                $host = parse_url($src, PHP_URL_HOST) ?: '';
                if (!preg_match('#\.(webp|jpe?g|png|gif|avif)$#i', (string) parse_url($src, PHP_URL_PATH))
                    && !preg_match('#\.(mp4|webm|mov|m4v)$#i', (string) parse_url($src, PHP_URL_PATH))
                    && !preg_match('#(youtube\.com|youtu\.be|vimeo\.com)$#i', $host)) {
                    return ['ok' => false, 'error' => 'bad_src_url'];
                }
                // Anything that is not a direct image file is treated as video/embed.
                if (!preg_match('#\.(webp|jpe?g|png|gif|avif)$#i', (string) parse_url($src, PHP_URL_PATH))) {
                    $type = 'video';
                }
            }
        } else {
            return ['ok' => false, 'error' => 'missing_media'];
        }

        $st = DB::pdo()->prepare(
            'INSERT INTO gallery (title, category, media_type, src, poster, caption, sort, active, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)'
        );
        $sort = (int) DB::pdo()->query('SELECT COALESCE(MAX(sort), 0) FROM gallery')->fetchColumn();
        $st->execute([
            Util::str($in, 'title', 120),
            Util::str($in, 'category', 60) ?: 'General',
            $type,
            $src,
            Util::str($in, 'poster', 255),
            Util::str($in, 'caption', 400),
            $sort + 1,
            time(),
        ]);
        $id = (int) DB::pdo()->lastInsertId();
        return ['ok' => true, 'id' => $id, 'item' => self::find($id)];
    }

    public static function find(int $id): ?array
    {
        $st = DB::pdo()->prepare(
            'SELECT id, title, category, media_type, src, poster, caption, sort, active, created_at
             FROM gallery WHERE id = ?'
        );
        $st->execute([$id]);
        $row = $st->fetch();
        return $row === false ? null : self::shape($row);
    }

    public static function update(int $id, array $in): array
    {
        $allowed = ['title', 'category', 'poster', 'caption', 'sort', 'active', 'media_type'];
        $sets = [];
        $vals = [];
        foreach ($allowed as $f) {
            if (!array_key_exists($f, $in)) {
                continue;
            }
            $v = $in[$f];
            if ($f === 'active') {
                $v = ((int) (is_bool($v) ? $v : filter_var($v, FILTER_VALIDATE_BOOLEAN))) ? 1 : 0;
            } elseif ($f === 'sort') {
                $v = (int) $v;
            } else {
                $max = $f === 'poster' ? 255 : ($f === 'caption' ? 400 : 120);
                $v = Util::str($in, $f, $max);
            }
            $sets[] = "$f = ?";
            $vals[] = $v;
        }
        if (!$sets) {
            return ['ok' => false, 'error' => 'nothing_to_update'];
        }
        $vals[] = $id;
        $st = DB::pdo()->prepare('UPDATE gallery SET ' . implode(', ', $sets) . ' WHERE id = ?');
        $st->execute($vals);
        return ['ok' => true];
    }

    public static function delete(int $id): array
    {
        $st = DB::pdo()->prepare('SELECT src FROM gallery WHERE id = ?');
        $st->execute([$id]);
        $src = (string) ($st->fetchColumn() ?: '');
        // Only delete files we own (uploads); never touch /images content.
        if (str_starts_with($src, '/api/data/uploads/')) {
            $path = Config::UPLOAD_DIR . '/' . basename($src);
            if (is_file($path)) {
                @unlink($path);
            }
        }
        DB::pdo()->prepare('DELETE FROM gallery WHERE id = ?')->execute([$id]);
        return ['ok' => true];
    }
}
