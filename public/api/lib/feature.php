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
 * Homepage feature-card modal images — the image sets shown in the
 * detail modals that open from the three homepage feature cards
 * (Security Systems / Technical Surveillance / Oil & Gas Solutions).
 * The built-in defaults ship with the static export; the dashboard
 * can override each set through the settings table (keys
 * feature_images_01/02/03) and the changes are served live through
 * ?route=feature, so no rebuild is ever needed.
 */

declare(strict_types=1);

final class FeatureMedia
{
    /** The three feature cards, keyed by their modal number badge. */
    public const FEATURES = ['01', '02', '03'];

    /** Cap on images per feature modal (the grid holds a few at most). */
    public const MAX_IMAGES = 6;

    /** Built-in fallback image sets (mirror of src/lib/data.tsx). */
    public static function defaults(): array
    {
        return [
            '01' => ['/images/cctv.webp', '/images/airport-detector.webp', '/images/cybersecurity-1.webp'],
            '02' => ['/images/imsi-catcher-system.webp', '/images/project-at-12-07-55_f4d81555.webp', '/images/airport-detector.webp'],
            '03' => ['/images/oilgas.webp', '/images/project-0005.webp', '/images/project-3.webp'],
        ];
    }

    /** Effective image sets: built-in defaults with dashboard overrides applied. */
    public static function effective(): array
    {
        $out = [];
        foreach (self::defaults() as $no => $imgs) {
            $over = self::stored($no);
            $out[$no] = ($over !== null && $over !== []) ? $over : $imgs;
        }
        return $out;
    }

    /**
     * Decode the stored override for one feature, re-validating every
     * entry (defence in depth: only safe local paths or direct image
     * URLs survive). Returns null when no override is stored.
     *
     * @return string[]|null
     */
    private static function stored(string $no): ?array
    {
        $raw = Settings::get('feature_images_' . $no, '');
        if ($raw === '') {
            return null;
        }
        $dec = json_decode($raw, true);
        if (!is_array($dec)) {
            return null;
        }
        $clean = [];
        foreach ($dec as $src) {
            $s = is_scalar($src) ? Blog::sanitizeSrc((string) $src) : '';
            if ($s !== '') {
                $clean[] = $s;
            }
        }
        return $clean;
    }

    /**
     * Replace one feature's image set. Invalid entries are filtered
     * out, duplicates removed and the list capped. An empty result
     * clears the override entirely (back to the built-in defaults).
     *
     * @param string[] $images
     * @return string[] the effective set now in force
     */
    public static function set(string $no, array $images): array
    {
        $clean = [];
        $capped = array_slice(array_values($images), 0, self::MAX_IMAGES);
        foreach ($capped as $src) {
            $s = is_scalar($src) ? Blog::sanitizeSrc((string) $src) : '';
            if ($s !== '' && !in_array($s, $clean, true)) {
                $clean[] = $s;
            }
        }
        Settings::set('feature_images_' . $no, $clean === [] ? '' : json_encode($clean));
        return $clean === [] ? self::defaults()[$no] : $clean;
    }
}
