<?php
declare(strict_types=1);
require_once __DIR__ . '/config.php';

require_method(['GET', 'POST']);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    send_json([
        'ok' => true,
        'products' => read_products(),
        'links' => [
            'bale' => BALE_URL,
            'eitaa' => EITAA_URL,
            'phone' => PHONE_URL,
        ],
    ]);
}

require_login();
verify_csrf();

$action = $_POST['action'] ?? '';
if ($action !== 'delete') {
    send_json(['ok' => false, 'error' => 'Invalid action'], 400);
}

$id = trim((string)($_POST['id'] ?? ''));
if ($id === '') {
    send_json(['ok' => false, 'error' => 'Product id is required'], 422);
}

delete_product_by_id($id);
send_json(['ok' => true, 'products' => read_products()]);
?>
