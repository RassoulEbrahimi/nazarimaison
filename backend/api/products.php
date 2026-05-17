<?php
declare(strict_types=1);
require_once __DIR__ . '/config.php';

require_method(['GET', 'POST']);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // ?all=1 with a valid session returns all products (including hidden) for admin use
    $show_all = !empty($_GET['all']) && is_logged_in();
    send_json([
        'ok'       => true,
        'products' => read_products(!$show_all),
        'links'    => [
            'bale'  => BALE_URL,
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
