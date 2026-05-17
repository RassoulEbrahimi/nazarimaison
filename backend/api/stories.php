<?php
declare(strict_types=1);
require_once __DIR__ . '/config.php';

require_method(['GET', 'POST']);

// ---------------------------------------------------------------------------
// GET — public returns only active, time-valid stories.
//        ?all=1 with a valid admin session returns everything.
// ---------------------------------------------------------------------------
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $show_all = !empty($_GET['all']) && is_logged_in();
    send_json([
        'ok'      => true,
        'stories' => read_stories(!$show_all),
    ]);
}

// ---------------------------------------------------------------------------
// POST — all write actions require authentication and a valid CSRF token
// ---------------------------------------------------------------------------
require_login();
verify_csrf();

$action = trim((string)($_POST['action'] ?? ''));
$allowed_actions = ['create', 'update', 'hide', 'delete'];
if (!in_array($action, $allowed_actions, true)) {
    send_json(['ok' => false, 'error' => 'Invalid action. Allowed: ' . implode(', ', $allowed_actions)], 400);
}

// ---------------------------------------------------------------------------
// delete — hard-delete a story by id
// ---------------------------------------------------------------------------
if ($action === 'delete') {
    $id = trim((string)($_POST['id'] ?? ''));
    if ($id === '') {
        send_json(['ok' => false, 'error' => 'شناسه استوری الزامی است'], 422);
    }
    delete_story_by_id($id);
    send_json(['ok' => true, 'stories' => read_stories()]);
}

// ---------------------------------------------------------------------------
// hide — toggle status between active ↔ hidden
// ---------------------------------------------------------------------------
if ($action === 'hide') {
    $id = trim((string)($_POST['id'] ?? ''));
    if ($id === '') {
        send_json(['ok' => false, 'error' => 'شناسه استوری الزامی است'], 422);
    }

    $raw   = read_raw_stories();
    $found = false;
    foreach ($raw as $i => $s) {
        if (($s['id'] ?? '') === $id) {
            $raw[$i]['status']     = ($s['status'] ?? 'active') === 'hidden' ? 'active' : 'hidden';
            $raw[$i]['updated_at'] = gmdate('c');
            $found                 = true;
            break;
        }
    }
    if (!$found) {
        send_json(['ok' => false, 'error' => 'استوری یافت نشد'], 404);
    }

    write_json_file(STORIES_JSON, array_values($raw));
    send_json(['ok' => true, 'stories' => read_stories()]);
}

// ---------------------------------------------------------------------------
// create / update
// ---------------------------------------------------------------------------
$id        = trim((string)($_POST['id'] ?? ''));
$is_update = $action === 'update' && $id !== '';
$existing  = null;

if ($is_update) {
    foreach (read_raw_stories() as $s) {
        if (($s['id'] ?? '') === $id) {
            $existing = $s;
            break;
        }
    }
    if ($existing === null) {
        send_json(['ok' => false, 'error' => 'استوری یافت نشد'], 404);
    }
}

$title = input_string('title', 120);
if ($title === '') {
    send_json(['ok' => false, 'error' => 'عنوان الزامی است'], 422);
}

$status     = ($_POST['status'] ?? 'active') === 'hidden' ? 'hidden' : 'active';
$starts_at  = trim((string)($_POST['starts_at']  ?? ''));
$expires_at = trim((string)($_POST['expires_at'] ?? ''));
$now        = gmdate('c');

// Carry forward existing media; overwrite only when a new file is provided
$media_url  = (string)($existing['media_url']  ?? '');
$media_path = (string)($existing['media_path'] ?? '');
$type       = (string)($existing['type']       ?? 'image');

// ---------------------------------------------------------------------------
// Media upload — image (jpg/png/webp, 5 MB) or video (mp4/webm/mov, 100 MB)
// ---------------------------------------------------------------------------
if (!empty($_FILES['media']['name'])) {
    $file = $_FILES['media'];

    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        send_json(['ok' => false, 'error' => 'خطا در بارگذاری فایل'], 400);
    }

    $original_name = (string)$file['name'];
    $extension     = strtolower(pathinfo($original_name, PATHINFO_EXTENSION));
    $image_exts    = ['jpg', 'jpeg', 'png', 'webp'];
    $video_exts    = ['mp4', 'webm', 'mov'];
    $all_exts      = array_merge($image_exts, $video_exts);

    if (!in_array($extension, $all_exts, true)) {
        send_json(['ok' => false, 'error' => 'فرمت فایل پشتیبانی نمی‌شود. تصویر: jpg/png/webp — ویدیو: mp4/webm/mov'], 422);
    }

    $is_video = in_array($extension, $video_exts, true);
    $max_size = $is_video ? 100 * 1024 * 1024 : 5 * 1024 * 1024;

    if (($file['size'] ?? 0) > $max_size) {
        $limit = $is_video ? '100MB' : '5MB';
        send_json(['ok' => false, 'error' => "حجم فایل نباید بیشتر از {$limit} باشد"], 422);
    }

    $finfo         = new finfo(FILEINFO_MIME_TYPE);
    $mime          = $finfo->file((string)$file['tmp_name']);
    $allowed_mimes = [
        'jpg'  => ['image/jpeg'],
        'jpeg' => ['image/jpeg'],
        'png'  => ['image/png'],
        'webp' => ['image/webp'],
        'mp4'  => ['video/mp4'],
        'webm' => ['video/webm'],
        'mov'  => ['video/quicktime', 'video/mp4', 'video/x-m4v'],
    ];

    if (!in_array($mime, $allowed_mimes[$extension], true)) {
        send_json(['ok' => false, 'error' => 'نوع فایل معتبر نیست'], 422);
    }

    $safe_base   = preg_replace('/[^a-zA-Z0-9_-]+/', '-', pathinfo($original_name, PATHINFO_FILENAME)) ?: 'story';
    $filename    = 'story-' . strtolower(trim($safe_base, '-')) . '-' . bin2hex(random_bytes(6)) . '.' . $extension;
    $destination = UPLOAD_DIR . '/' . $filename;

    if (!move_uploaded_file((string)$file['tmp_name'], $destination)) {
        send_json(['ok' => false, 'error' => 'ذخیره فایل ناموفق بود'], 500);
    }

    chmod($destination, 0644);
    $media_url  = '../backend/uploads/' . $filename;
    $media_path = $destination;
    $type       = $is_video ? 'video' : 'image';
}

if (!$is_update && $media_url === '') {
    send_json(['ok' => false, 'error' => 'فایل رسانه برای استوری جدید الزامی است'], 422);
}

$story = [
    'id'         => $is_update ? $id : bin2hex(random_bytes(12)),
    'title'      => $title,
    'media_url'  => $media_url,
    'media_path' => $media_path,
    'type'       => $type,
    'starts_at'  => $starts_at,
    'expires_at' => $expires_at,
    'status'     => $status,
    'created_at' => $existing['created_at'] ?? $now,
    'updated_at' => $now,
];

save_story($story);
send_json(['ok' => true, 'story' => normalize_story($story), 'stories' => read_stories()]);
