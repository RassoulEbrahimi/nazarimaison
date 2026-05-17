<?php
declare(strict_types=1);
require_once __DIR__ . '/config.php';

require_method(['POST']);
require_login();
verify_csrf();

$id        = trim((string)($_POST['id'] ?? ''));
$is_update = $id !== '';
$existing  = null;

if ($is_update) {
    foreach (read_raw_products() as $p) {
        if (($p['id'] ?? '') === $id) {
            $existing = $p;
            break;
        }
    }
    if ($existing === null) {
        send_json(['ok' => false, 'error' => 'محصول یافت نشد'], 404);
    }
}

$title = input_string('title', 120);
if ($title === '') {
    send_json(['ok' => false, 'error' => 'عنوان الزامی است'], 422);
}

$description  = input_string('description', 1200);
$category     = input_string('category', 80);
$availability = ($_POST['availability'] ?? 'available') === 'sold_out' ? 'sold_out' : 'available';
$pinned       = isset($_POST['pinned'])   && $_POST['pinned']   === '1';
$featured     = isset($_POST['featured']) && $_POST['featured'] === '1';
$status       = ($_POST['status'] ?? 'active') === 'hidden' ? 'hidden' : 'active';
$now          = gmdate('c');

// Preserve existing media from the stored raw record (includes file-system paths)
$image_url   = (string)($existing['image_url']   ?? '');
$image_path  = (string)($existing['image_path']  ?? '');
$video_url   = (string)($existing['video_url']   ?? '');
$video_path  = (string)($existing['video_path']  ?? '');
$poster_url  = (string)($existing['poster']      ?? '');
$poster_path = (string)($existing['poster_path'] ?? '');

// ---------------------------------------------------------------------------
// Image upload — jpg, jpeg, png, webp — max 5 MB
// ---------------------------------------------------------------------------
if (!empty($_FILES['image']['name'])) {
    $file = $_FILES['image'];

    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        send_json(['ok' => false, 'error' => 'خطا در بارگذاری تصویر'], 400);
    }
    if (($file['size'] ?? 0) > 5 * 1024 * 1024) {
        send_json(['ok' => false, 'error' => 'تصویر نباید بیشتر از 5MB باشد'], 422);
    }

    $original_name = (string)$file['name'];
    $extension     = strtolower(pathinfo($original_name, PATHINFO_EXTENSION));
    $allowed_exts  = ['jpg', 'jpeg', 'png', 'webp'];

    if (!in_array($extension, $allowed_exts, true)) {
        send_json(['ok' => false, 'error' => 'فقط فرمت‌های jpg، jpeg، png و webp مجاز هستند'], 422);
    }

    $finfo         = new finfo(FILEINFO_MIME_TYPE);
    $mime          = $finfo->file((string)$file['tmp_name']);
    $allowed_mimes = [
        'jpg'  => ['image/jpeg'],
        'jpeg' => ['image/jpeg'],
        'png'  => ['image/png'],
        'webp' => ['image/webp'],
    ];

    if (!in_array($mime, $allowed_mimes[$extension], true)) {
        send_json(['ok' => false, 'error' => 'نوع فایل تصویر معتبر نیست'], 422);
    }

    $safe_base   = preg_replace('/[^a-zA-Z0-9_-]+/', '-', pathinfo($original_name, PATHINFO_FILENAME)) ?: 'model';
    $filename    = strtolower(trim($safe_base, '-')) . '-' . bin2hex(random_bytes(6)) . '.' . $extension;
    $destination = UPLOAD_DIR . '/' . $filename;

    if (!move_uploaded_file((string)$file['tmp_name'], $destination)) {
        send_json(['ok' => false, 'error' => 'ذخیره تصویر ناموفق بود'], 500);
    }

    chmod($destination, 0644);
    $image_url  = '../backend/uploads/' . $filename;
    $image_path = $destination;
}

// ---------------------------------------------------------------------------
// Video upload — mp4, webm, mov — max 100 MB
// Requires cPanel php.ini: upload_max_filesize=100M, post_max_size=101M
// ---------------------------------------------------------------------------
if (!empty($_FILES['video']['name'])) {
    $file = $_FILES['video'];

    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        send_json(['ok' => false, 'error' => 'خطا در بارگذاری ویدیو'], 400);
    }
    if (($file['size'] ?? 0) > 100 * 1024 * 1024) {
        send_json(['ok' => false, 'error' => 'ویدیو نباید بیشتر از 100MB باشد'], 422);
    }

    $original_name = (string)$file['name'];
    $extension     = strtolower(pathinfo($original_name, PATHINFO_EXTENSION));
    $allowed_exts  = ['mp4', 'webm', 'mov'];

    if (!in_array($extension, $allowed_exts, true)) {
        send_json(['ok' => false, 'error' => 'فقط فرمت‌های mp4، webm و mov مجاز هستند'], 422);
    }

    $finfo         = new finfo(FILEINFO_MIME_TYPE);
    $mime          = $finfo->file((string)$file['tmp_name']);
    $allowed_mimes = [
        'mp4'  => ['video/mp4'],
        'webm' => ['video/webm'],
        'mov'  => ['video/quicktime', 'video/mp4', 'video/x-m4v'],
    ];

    if (!in_array($mime, $allowed_mimes[$extension], true)) {
        send_json(['ok' => false, 'error' => 'نوع فایل ویدیو معتبر نیست'], 422);
    }

    $safe_base   = preg_replace('/[^a-zA-Z0-9_-]+/', '-', pathinfo($original_name, PATHINFO_FILENAME)) ?: 'video';
    $filename    = 'vid-' . strtolower(trim($safe_base, '-')) . '-' . bin2hex(random_bytes(6)) . '.' . $extension;
    $destination = UPLOAD_DIR . '/' . $filename;

    if (!move_uploaded_file((string)$file['tmp_name'], $destination)) {
        send_json(['ok' => false, 'error' => 'ذخیره ویدیو ناموفق بود'], 500);
    }

    chmod($destination, 0644);
    $video_url  = '../backend/uploads/' . $filename;
    $video_path = $destination;
}

// ---------------------------------------------------------------------------
// Poster upload — jpg, jpeg, png, webp — max 5 MB (thumbnail for video posts)
// ---------------------------------------------------------------------------
if (!empty($_FILES['poster']['name'])) {
    $file = $_FILES['poster'];

    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        send_json(['ok' => false, 'error' => 'خطا در بارگذاری پوستر'], 400);
    }
    if (($file['size'] ?? 0) > 5 * 1024 * 1024) {
        send_json(['ok' => false, 'error' => 'پوستر نباید بیشتر از 5MB باشد'], 422);
    }

    $original_name = (string)$file['name'];
    $extension     = strtolower(pathinfo($original_name, PATHINFO_EXTENSION));
    $allowed_exts  = ['jpg', 'jpeg', 'png', 'webp'];

    if (!in_array($extension, $allowed_exts, true)) {
        send_json(['ok' => false, 'error' => 'فقط فرمت‌های jpg، jpeg، png و webp برای پوستر مجاز هستند'], 422);
    }

    $finfo         = new finfo(FILEINFO_MIME_TYPE);
    $mime          = $finfo->file((string)$file['tmp_name']);
    $allowed_mimes = [
        'jpg'  => ['image/jpeg'],
        'jpeg' => ['image/jpeg'],
        'png'  => ['image/png'],
        'webp' => ['image/webp'],
    ];

    if (!in_array($mime, $allowed_mimes[$extension], true)) {
        send_json(['ok' => false, 'error' => 'نوع فایل پوستر معتبر نیست'], 422);
    }

    $safe_base   = preg_replace('/[^a-zA-Z0-9_-]+/', '-', pathinfo($original_name, PATHINFO_FILENAME)) ?: 'poster';
    $filename    = 'poster-' . strtolower(trim($safe_base, '-')) . '-' . bin2hex(random_bytes(6)) . '.' . $extension;
    $destination = UPLOAD_DIR . '/' . $filename;

    if (!move_uploaded_file((string)$file['tmp_name'], $destination)) {
        send_json(['ok' => false, 'error' => 'ذخیره پوستر ناموفق بود'], 500);
    }

    chmod($destination, 0644);
    $poster_url  = '../backend/uploads/' . $filename;
    $poster_path = $destination;
}

// Determine type: explicit POST field → video_url presence → existing → default
$type_input = trim($_POST['type'] ?? '');
if ($type_input === 'video' || $type_input === 'image') {
    $type = $type_input;
} elseif ($video_url !== '') {
    $type = 'video';
} else {
    $stored = (string)($existing['type'] ?? 'image');
    $type   = ($stored === 'video' || $stored === 'image') ? $stored : 'image';
}

// New products require at least one media file
if (!$is_update && $image_url === '' && $video_url === '') {
    send_json(['ok' => false, 'error' => 'تصویر یا ویدیو برای محصول جدید الزامی است'], 422);
}

$product = [
    'id'          => $is_update ? $id : bin2hex(random_bytes(12)),
    'title'       => $title,
    'description' => $description,
    'category'    => $category,
    'type'        => $type,
    'availability'=> $availability,
    'pinned'      => $pinned,
    'featured'    => $featured,
    'status'      => $status,
    'image_url'   => $image_url,
    'image_path'  => $image_path,
    'video_url'   => $video_url,
    'video_path'  => $video_path,
    'poster'      => $poster_url,
    'poster_path' => $poster_path,
    'created_at'  => $existing['created_at'] ?? $now,
    'updated_at'  => $now,
];

save_product($product);
send_json(['ok' => true, 'product' => normalize_product($product), 'products' => read_products()]);
