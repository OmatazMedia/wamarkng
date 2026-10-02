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
 * WAMARK Nigeria Limited - Public API & PHP Mailer Endpoint
 * Handles contact form submissions with spam scrutiny, rate limiting,
 * and sends email directly to info@wamarkng.com using native PHP mail().
 */

session_start();

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$route = isset($_GET['route']) ? trim($_GET['route'], '/') : '';

// 1. Service Status
if ($route === '') {
    echo json_encode([
        'ok' => true,
        'service' => 'wamark-php-api',
        'installed' => true,
        'version' => '1.0.0'
    ]);
    exit;
}

// 2. CSRF & Captcha
if ($route === 'csrf') {
    if (empty($_SESSION['wamark_csrf'])) {
        $_SESSION['wamark_csrf'] = bin2hex(random_bytes(16));
    }
    $a = rand(2, 9);
    $b = rand(2, 9);
    $_SESSION['captcha_sum'] = $a + $b;

    echo json_encode([
        'ok' => true,
        'csrf' => $_SESSION['wamark_csrf'],
        'captcha' => ['a' => $a, 'b' => $b]
    ]);
    exit;
}

// 3. Contact Form Submission
if ($route === 'contact' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true) ?? $_POST;

    // CSRF check
    $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? ($data['csrf'] ?? '');
    if (empty($token) || empty($_SESSION['wamark_csrf']) || $token !== $_SESSION['wamark_csrf']) {
        http_response_code(403);
        echo json_encode(['ok' => false, 'error' => 'bad_csrf', 'message' => 'Invalid security token.']);
        exit;
    }

    // Honeypot check
    if (!empty($data['_hp'])) {
        echo json_encode(['ok' => true, 'sent' => true]);
        exit;
    }

    // Rate Limiting: Max 3 submissions per 10 minutes per IP
    $ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? ($_SERVER['REMOTE_ADDR'] ?? '127.0.0.1');
    $ip = explode(',', $ip)[0];
    $rateLimitFile = sys_get_temp_dir() . '/wamark_rate_' . md5($ip) . '.json';
    $now = time();
    $window = 10 * 60; // 10 mins
    $limit = 3;

    $history = [];
    if (file_exists($rateLimitFile)) {
        $saved = json_decode(file_get_contents($rateLimitFile), true);
        if (is_array($saved)) {
            $history = array_filter($saved, function($t) use ($now, $window) {
                return ($now - $t) < $window;
            });
        }
    }

    if (count($history) >= $limit) {
        http_response_code(429);
        echo json_encode([
            'ok' => false,
            'error' => 'rate_limited',
            'message' => 'Sending rate limit exceeded. You can only send up to 3 messages per 10 minutes. Please try again later or reach us on WhatsApp.'
        ]);
        exit;
    }

    $history[] = $now;
    @file_put_contents($rateLimitFile, json_encode($history));

    // Captcha verification
    $expectedCaptcha = $_SESSION['captcha_sum'] ?? -1;
    unset($_SESSION['captcha_sum']);
    $givenCaptcha = isset($data['captcha_answer']) ? intval($data['captcha_answer']) : -2;

    if ($givenCaptcha !== $expectedCaptcha) {
        http_response_code(422);
        echo json_encode([
            'ok' => false,
            'error' => 'captcha_failed',
            'message' => 'Human verification failed. Please try the new question.'
        ]);
        exit;
    }

    $name = trim($data['name'] ?? '');
    $email = trim(strtolower($data['email'] ?? ''));
    $phone = trim($data['phone'] ?? '');
    $subject = trim($data['subject'] ?? 'General Inquiry');
    $message = trim($data['message'] ?? '');

    if (strlen($name) < 2) {
        http_response_code(422);
        echo json_encode(['ok' => false, 'error' => 'invalid_name', 'message' => 'Name is required.']);
        exit;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(422);
        echo json_encode(['ok' => false, 'error' => 'invalid_email', 'message' => 'Valid email address is required.']);
        exit;
    }

    if (strlen($message) < 10) {
        http_response_code(422);
        echo json_encode(['ok' => false, 'error' => 'invalid_message', 'message' => 'Message must be at least 10 characters.']);
        exit;
    }

    // -------------------------------------------------------------
    // SPAM CONTENT SCRUTINY
    // -------------------------------------------------------------
    $combined = strtolower($name . ' ' . $subject . ' ' . $message);
    $isSpam = false;

    // 1. Link density check (more than 1 link in inquiry)
    preg_match_all('/https?:\/\/|www\.|\.xyz|\.ru|\.top|\.click|\[url=/i', $message, $linkMatches);
    if (!empty($linkMatches[0]) && count($linkMatches[0]) >= 2) {
        $isSpam = true;
    }

    // 2. High-confidence spam phrases & keyword filters
    $spamPatterns = '/\b(casino|viagra|cialis|crypto|bitcoin|forex|telegram\s*bot|bulk\s*email|seo\s*ranking|guest\s*post|backlinks?|rank\s*#?1|make\s*money\s*fast|dating\s*service|sex\s*video|porn|erotic|whatsapp\s*blast|lottery\s*winner|wire\s*transfer|bank\s*guarantee|pills\s*online|weight\s*loss\s*secret)\b/i';
    if (preg_match($spamPatterns, $combined)) {
        $isSpam = true;
    }

    // 3. Cyrillic script link spam
    if (preg_match('/[а-яА-ЯЁё]/u', $message) && preg_match('/https?:\/\/|www\./i', $message)) {
        $isSpam = true;
    }

    // 4. Obfuscated messaging handles
    if (preg_match('/t\s*\.\s*m\s*e\s*\/|w\s*a\s*\.\s*m\s*e\s*\//i', $message)) {
        $isSpam = true;
    }

    if ($isSpam) {
        http_response_code(400);
        echo json_encode([
            'ok' => false,
            'error' => 'spam_detected',
            'message' => 'Such messages are not allowed here.'
        ]);
        exit;
    }

    // -------------------------------------------------------------
    // SEND EMAIL TO info@wamarkng.com via native PHP mail()
    // No external SMTP credentials needed!
    // -------------------------------------------------------------
    $to = 'info@wamarkng.com';
    $serverDomain = !empty($_SERVER['SERVER_NAME']) ? $_SERVER['SERVER_NAME'] : 'wamarkng.com';
    $fromEmail = 'no-reply@' . $serverDomain;

    $mailSubject = "New Website Inquiry: " . ($subject ?: "General Contact");

    $headers = "From: WAMARK Website <" . $fromEmail . ">\r\n" .
               "Reply-To: " . $email . "\r\n" .
               "MIME-Version: 1.0\r\n" .
               "Content-Type: text/html; charset=UTF-8\r\n" .
               "X-Mailer: PHP/" . phpversion();

    $htmlBody = "
    <!DOCTYPE html>
    <html>
    <head><title>" . htmlspecialchars($mailSubject) . "</title></head>
    <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f9f9f9; padding: 20px;'>
      <div style='max-width: 600px; margin: 0 auto; background: #fff; padding: 24px; border-radius: 8px; border: 1px solid #ddd;'>
        <h2 style='color: #0b1322; border-bottom: 2px solid #48bb57; padding-bottom: 8px;'>New Website Contact Inquiry</h2>
        <p><strong>Full Name:</strong> " . htmlspecialchars($name) . "</p>
        <p><strong>Email Address:</strong> <a href='mailto:" . htmlspecialchars($email) . "'>" . htmlspecialchars($email) . "</a></p>
        <p><strong>Phone Number:</strong> " . htmlspecialchars($phone ?: 'Not provided') . "</p>
        <p><strong>Subject:</strong> " . htmlspecialchars($subject) . "</p>
        <div style='background: #f4f6f8; padding: 14px; border-radius: 6px; margin-top: 14px;'>
          <strong>Message:</strong><br>
          " . nl2br(htmlspecialchars($message)) . "
        </div>
        <hr style='margin-top: 24px; border: 0; border-top: 1px solid #eee;'>
        <p style='font-size: 12px; color: #888;'>Sent automatically from WAMARK Nigeria Limited Website Contact Form</p>
      </div>
    </body>
    </html>";

    @mail($to, $mailSubject, $htmlBody, $headers);

    echo json_encode([
        'ok' => true,
        'sent' => true,
        'message' => 'Thank you! Your message has been sent to info@wamarkng.com.'
    ]);
    exit;
}

http_response_code(404);
echo json_encode(['ok' => false, 'error' => 'not_found']);
