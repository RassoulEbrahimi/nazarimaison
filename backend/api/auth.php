<?php
declare(strict_types=1);
require_once __DIR__ . '/config.php';

require_method(['GET', 'POST']);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    send_json([
        'ok' => true,
        'logged_in' => is_logged_in(),
        'csrf_token' => get_csrf_token(),
    ]);
}

$username = trim((string)($_POST['username'] ?? ''));
$password = (string)($_POST['password'] ?? '');

if (hash_equals(ADMIN_USERNAME, $username) && hash_equals(ADMIN_PASSWORD, $password)) {
    session_regenerate_id(true);
    $_SESSION['admin_logged_in'] = true;
    send_json([
        'ok' => true,
        'logged_in' => true,
        'csrf_token' => get_csrf_token(),
    ]);
}

send_json(['ok' => false, 'error' => 'نام کاربری یا رمز عبور نادرست است.'], 401);
?>
