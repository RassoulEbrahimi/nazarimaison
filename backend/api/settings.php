<?php
declare(strict_types=1);
require_once __DIR__ . '/config.php';

require_method(['GET', 'POST']);

// ---------------------------------------------------------------------------
// GET — public; returns the current settings (safe for public consumption)
// ---------------------------------------------------------------------------
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    send_json(['ok' => true, 'settings' => read_settings()]);
}

// ---------------------------------------------------------------------------
// POST — requires authentication and a valid CSRF token
// ---------------------------------------------------------------------------
require_login();
verify_csrf();

$current = read_settings();

// Only these keys may be written; all others are silently ignored
$allowed_keys = [
    'bio',
    'bio_line2',
    'stat_models_label',
    'stat_orders_value',
    'stat_orders_label',
    'stat_contact_value',
    'stat_contact_label',
    'telegram_url',
    'bale_url',
];

$updated = $current;
foreach ($allowed_keys as $key) {
    if (!isset($_POST[$key])) {
        continue;
    }
    $value       = trim((string)$_POST[$key]);
    $max_length  = in_array($key, ['telegram_url', 'bale_url'], true) ? 300 : 200;
    $updated[$key] = mb_substr($value, 0, $max_length, 'UTF-8');
}

// Validate URL fields
foreach (['telegram_url', 'bale_url'] as $url_key) {
    $url = $updated[$url_key] ?? '';
    if ($url !== '' && !filter_var($url, FILTER_VALIDATE_URL)) {
        send_json(['ok' => false, 'error' => "آدرس {$url_key} معتبر نیست"], 422);
    }
}

save_settings($updated);
send_json(['ok' => true, 'settings' => $updated]);
