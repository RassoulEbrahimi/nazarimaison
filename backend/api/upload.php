<?php
declare(strict_types=1);
require_once __DIR__ . '/config.php';

require_method(['POST']);
require_login();
verify_csrf();

$id = trim((string)($_POST['id'] ?? ''));
$isUpdate = $id !== '';
$existing = null;
foreach (read_products() as $product) {
    if (($product['id'] ?? '') === $id) {
        $existing = $product;
        break;
    }
}

$title = input_string('title', 120);
if ($title === '') {
    send_json(['ok' => false, 'error' => 'Title is required'], 422);
}

$description = input_string('description', 1200);
$category = input_string('category', 80);
$availability = ($_POST['availability'] ?? 'available') === 'sold_out' ? 'sold_out' : 'available';
$pinned = isset($_POST['pinned']) && $_POST['pinned'] === '1';
$now = gmdate('c');

$imageUrl = $existing['image_url'] ?? '';
$imagePath = '';

if (!empty($_FILES['image']['name'])) {
    $file = $_FILES['image'];
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        send_json(['ok' => false, 'error' => 'Upload failed'], 400);
    }
    if (($file['size'] ?? 0) > 5 * 1024 * 1024) {
        send_json(['ok' => false, 'error' => 'Image must be 5MB or smaller'], 422);
    }

    $originalName = (string)$file['name'];
    $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    $allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    if (!in_array($extension, $allowedExtensions, true)) {
        send_json(['ok' => false, 'error' => 'Only jpg, jpeg, png, and webp images are allowed'], 422);
    }

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->file((string)$file['tmp_name']);
    $allowedMimes = [
        'jpg' => ['image/jpeg'],
        'jpeg' => ['image/jpeg'],
        'png' => ['image/png'],
        'webp' => ['image/webp'],
    ];
    if (!in_array($mime, $allowedMimes[$extension], true)) {
        send_json(['ok' => false, 'error' => 'Invalid image type'], 422);
    }

    $safeBase = preg_replace('/[^a-zA-Z0-9_-]+/', '-', pathinfo($originalName, PATHINFO_FILENAME)) ?: 'model';
    $filename = strtolower(trim($safeBase, '-')) . '-' . bin2hex(random_bytes(6)) . '.' . $extension;
    $destination = UPLOAD_DIR . '/' . $filename;

    if (!move_uploaded_file((string)$file['tmp_name'], $destination)) {
        send_json(['ok' => false, 'error' => 'Could not save uploaded file'], 500);
    }

    chmod($destination, 0644);
    $imageUrl = '../backend/uploads/' . $filename;
    $imagePath = $destination;
}

if (!$isUpdate && $imageUrl === '') {
    send_json(['ok' => false, 'error' => 'Image is required for new products'], 422);
}

$product = [
    'id' => $isUpdate ? $id : bin2hex(random_bytes(12)),
    'title' => $title,
    'description' => $description,
    'category' => $category,
    'availability' => $availability,
    'pinned' => $pinned,
    'image_url' => $imageUrl,
    'image_path' => $imagePath,
    'created_at' => $existing['created_at'] ?? $now,
    'updated_at' => $now,
];

save_product($product);
send_json(['ok' => true, 'product' => normalize_product($product), 'products' => read_products()]);
?>
