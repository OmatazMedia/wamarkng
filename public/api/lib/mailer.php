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
 * Mailer — sends via PHP mail() from no-reply@<site-domain>.
 * Nothing for the site owner to configure on cPanel (PHP mail is builtin).
 */

declare(strict_types=1);

final class Mailer
{
    /**
     * Send the contact notification.
     * @return array{ok:bool, error?:string, sent?:bool}
     */
    public static function sendContact(array $msg): array
    {
        $to = Settings::get('contact_email', Config::DEFAULT_SITE['contact_email']);
        $from = Config::mailFrom();
        $site = Settings::get('site_name', Config::DEFAULT_SITE['site_name']);
        $domain = Config::domain();

        $subject = sprintf('[%s] New website enquiry: %s', $site, $msg['subject'] !== '' ? $msg['subject'] : 'General');

        $lines = [
            'New enquiry from the WAMARK website contact form.',
            '',
            'Name    : ' . $msg['name'],
            'Email   : ' . $msg['email'],
            'Phone   : ' . ($msg['phone'] !== '' ? $msg['phone'] : '—'),
            'Subject : ' . ($msg['subject'] !== '' ? $msg['subject'] : '—'),
            'IP      : ' . $msg['ip'],
            'Time    : ' . gmdate('r'),
            '',
            'Message :',
            '--------',
            $msg['message'],
            '',
            '--',
            'Sent automatically by the website. Do not reply to this address.',
        ];
        $body = implode("\r\n", $lines);

        $headers = [
            'From: ' . $site . ' <' . $from . '>',
            'Reply-To: ' . $msg['name'] . ' <' . $msg['email'] . '>',
            'X-Mailer: WAMARK-API/' . PHP_VERSION,
            'MIME-Version: 1.0',
            'Content-Type: text/plain; charset=utf-8',
        ];

        // Header-injection guard: strip CR/LF from any value we embed.
        $to = str_replace(["\r", "\n"], '', $to);
        $subject = str_replace(["\r", "\n"], '', $subject);

        $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
        $ok = @mail($to, $encodedSubject, $body, implode("\r\n", $headers));

        $fallback = null;
        if (!$ok) {
            // Some hosts disable mail() or reject non-local senders from CLI.
            $fallback = self::spoolToFile($msg);
        }

        if ($ok) {
            return ['ok' => true, 'sent' => true];
        }
        return [
            'ok'   => true, // the message is stored either way; never lose enquiries
            'sent' => false,
            'note' => $fallback
                ? 'Message saved. The host mail() did not confirm delivery; it was spooled in api/data/mail-spool/ for retry.'
                : 'Message saved but delivery was not confirmed. Check the hosting mail settings.',
        ];
    }

    /** Last-resort spool so a message is never silently lost. */
    private static function spoolToFile(array $msg): bool
    {
        $dir = __DIR__ . '/../data/mail-spool';
        if (!is_dir($dir) && !@mkdir($dir, 0775, true)) {
            return false;
        }
        $file = $dir . '/' . date('Ymd-His') . '-' . bin2hex(random_bytes(4)) . '.json';
        $payload = [
            'to'      => Settings::get('contact_email'),
            'from'    => Config::mailFrom(),
            'message' => $msg,
            'spooled' => gmdate('c'),
        ];
        return (bool) @file_put_contents($file, json_encode($payload, JSON_PRETTY_PRINT), LOCK_EX);
    }
}
