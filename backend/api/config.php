<?php
declare(strict_types=1);

session_name('nazari_maison_admin');
session_start();

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (preg_match('/^http:\/\/(localhost|127\.0\.0\.1):\d+$/', $origin)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Vary: Origin');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'change-this-password';

const BALE_URL  = 'https://ble.ir/nazari_maison';
const EITAA_URL = 'https://eitaa.com/nazari_maison';
const PHONE_URL = 'tel:+989000000000';

const DATA_DIR       = __DIR__ . '/../data';
const UPLOAD_DIR     = __DIR__ . '/../uploads';
const PRODUCTS_JSON  = DATA_DIR . '/products.json';
const PRODUCTS_SQLITE = DATA_DIR . '/products.sqlite';
const STORIES_JSON   = DATA_DIR . '/stories.json';
const SETTINGS_JSON  = DATA_DIR . '/settings.json';

// ---------------------------------------------------------------------------
// Core helpers
// ---------------------------------------------------------------------------

function send_json(array $payload, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function require_method(array $allowed): void
{
    if (!in_array($_SERVER['REQUEST_METHOD'] ?? 'GET', $allowed, true)) {
        send_json(['ok' => false, 'error' => 'Method not allowed'], 405);
    }
}

function is_logged_in(): bool
{
    return !empty($_SESSION['admin_logged_in']);
}

function require_login(): void
{
    if (!is_logged_in()) {
        send_json(['ok' => false, 'error' => 'Unauthorized'], 401);
    }
}

function get_csrf_token(): string
{
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function verify_csrf(): void
{
    $token = $_POST['csrf_token'] ?? ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');
    if (!is_string($token) || !hash_equals(get_csrf_token(), $token)) {
        send_json(['ok' => false, 'error' => 'Invalid CSRF token'], 403);
    }
}

function input_string(string $key, int $max = 500): string
{
    $value = trim((string)($_POST[$key] ?? ''));
    $value = preg_replace('/\s+/u', ' ', $value) ?? '';
    return mb_substr($value, 0, $max, 'UTF-8');
}

// ---------------------------------------------------------------------------
// Safe JSON writer — exclusive file lock, in-place truncate-and-write.
// Works for both indexed arrays (→ JSON array) and assoc arrays (→ JSON object).
// ---------------------------------------------------------------------------

function write_json_file(string $path, $data): bool
{
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) {
        return false;
    }
    $json .= "\n";
    $fp = @fopen($path, 'c');
    if ($fp === false) {
        return false;
    }
    $locked = flock($fp, LOCK_EX);
    if ($locked) {
        ftruncate($fp, 0);
        rewind($fp);
        fwrite($fp, $json);
        fflush($fp);
        flock($fp, LOCK_UN);
    }
    fclose($fp);
    return $locked;
}

// ---------------------------------------------------------------------------
// Storage bootstrap
// ---------------------------------------------------------------------------

function ensure_storage(): void
{
    if (!is_dir(DATA_DIR)) {
        mkdir(DATA_DIR, 0755, true);
    }
    if (!is_dir(UPLOAD_DIR)) {
        mkdir(UPLOAD_DIR, 0755, true);
    }
    if (!file_exists(PRODUCTS_JSON)) {
        file_put_contents(PRODUCTS_JSON, "[]\n", LOCK_EX);
    }
    if (!file_exists(STORIES_JSON)) {
        file_put_contents(STORIES_JSON, "[]\n", LOCK_EX);
    }
    if (!file_exists(SETTINGS_JSON)) {
        $defaults = default_settings();
        file_put_contents(
            SETTINGS_JSON,
            json_encode($defaults, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n",
            LOCK_EX
        );
    }
}

// ---------------------------------------------------------------------------
// SQLite — optional; JSON is always the source of truth via mirroring
// ---------------------------------------------------------------------------

function use_sqlite(): bool
{
    return class_exists('SQLite3');
}

function db(): ?SQLite3
{
    if (!use_sqlite()) {
        return null;
    }

    ensure_storage();
    $db = new SQLite3(PRODUCTS_SQLITE);
    $db->exec(
        'CREATE TABLE IF NOT EXISTS products (
            id          TEXT PRIMARY KEY,
            title       TEXT NOT NULL,
            description TEXT,
            category    TEXT,
            availability TEXT NOT NULL,
            pinned      INTEGER NOT NULL DEFAULT 0,
            image_url   TEXT NOT NULL,
            image_path  TEXT,
            created_at  TEXT NOT NULL,
            updated_at  TEXT NOT NULL
        )'
    );

    // Extend schema for existing databases — errors mean column already exists
    $new_columns = [
        "ALTER TABLE products ADD COLUMN type         TEXT    NOT NULL DEFAULT 'image'",
        "ALTER TABLE products ADD COLUMN video_url    TEXT    NOT NULL DEFAULT ''",
        "ALTER TABLE products ADD COLUMN video_path   TEXT    NOT NULL DEFAULT ''",
        "ALTER TABLE products ADD COLUMN poster       TEXT    NOT NULL DEFAULT ''",
        "ALTER TABLE products ADD COLUMN poster_path  TEXT    NOT NULL DEFAULT ''",
        "ALTER TABLE products ADD COLUMN featured     INTEGER NOT NULL DEFAULT 0",
        "ALTER TABLE products ADD COLUMN status       TEXT    NOT NULL DEFAULT 'active'",
    ];
    foreach ($new_columns as $sql) {
        @$db->exec($sql);
    }

    return $db;
}

// ---------------------------------------------------------------------------
// Product normalization — applies safe defaults for all fields.
// Internal path fields are NOT exposed; only public URL fields are returned.
// ---------------------------------------------------------------------------

function normalize_product(array $row): array
{
    $has_video   = !empty($row['video_url']);
    $stored_type = $row['type'] ?? '';
    $type        = ($stored_type === 'video' || $stored_type === 'image')
                 ? $stored_type
                 : ($has_video ? 'video' : 'image');

    return [
        'id'          => (string)($row['id'] ?? ''),
        'title'       => htmlspecialchars((string)($row['title'] ?? ''), ENT_QUOTES, 'UTF-8'),
        'description' => htmlspecialchars((string)($row['description'] ?? ''), ENT_QUOTES, 'UTF-8'),
        'category'    => htmlspecialchars((string)($row['category'] ?? ''), ENT_QUOTES, 'UTF-8'),
        'type'        => $type,
        'availability'=> ($row['availability'] ?? 'available') === 'sold_out' ? 'sold_out' : 'available',
        'pinned'      => filter_var($row['pinned'] ?? false, FILTER_VALIDATE_BOOLEAN),
        'featured'    => filter_var($row['featured'] ?? false, FILTER_VALIDATE_BOOLEAN),
        'status'      => ($row['status'] ?? 'active') === 'hidden' ? 'hidden' : 'active',
        'image_url'   => (string)($row['image_url'] ?? ''),
        'video_url'   => (string)($row['video_url'] ?? ''),
        'poster'      => (string)($row['poster'] ?? ''),
        'created_at'  => (string)($row['created_at'] ?? gmdate('c')),
        'updated_at'  => (string)($row['updated_at'] ?? gmdate('c')),
    ];
}

// ---------------------------------------------------------------------------
// Product CRUD
// ---------------------------------------------------------------------------

function sample_products(): array
{
    return [
        [
            'id'          => 'sample-1',
            'title'       => 'پیراهن مجلسی کرم',
            'description' => 'نمونه نمایشی برای شروع گالری. پس از ورود به پنل مدیریت می‌توانید مدل واقعی بارگذاری کنید.',
            'category'    => 'مجلسی',
            'type'        => 'image',
            'availability'=> 'available',
            'pinned'      => true,
            'featured'    => false,
            'status'      => 'active',
            'image_url'   => '',
            'video_url'   => '',
            'poster'      => '',
            'created_at'  => '2026-05-10T00:00:00+00:00',
            'updated_at'  => '2026-05-10T00:00:00+00:00',
        ],
        [
            'id'          => 'sample-2',
            'title'       => 'کت و دامن مزونی',
            'description' => 'چیدمان سه ستونه برای مشاهده سریع مدل‌ها، مشابه حس آشنای شبکه‌های اجتماعی.',
            'category'    => 'مزونی',
            'type'        => 'image',
            'availability'=> 'available',
            'pinned'      => false,
            'featured'    => false,
            'status'      => 'active',
            'image_url'   => '',
            'video_url'   => '',
            'poster'      => '',
            'created_at'  => '2026-05-09T00:00:00+00:00',
            'updated_at'  => '2026-05-09T00:00:00+00:00',
        ],
        [
            'id'          => 'sample-3',
            'title'       => 'مانتو پاییزه',
            'description' => 'این محصول نمونه است و تصویر واقعی ندارد.',
            'category'    => 'Fall',
            'type'        => 'image',
            'availability'=> 'sold_out',
            'pinned'      => false,
            'featured'    => false,
            'status'      => 'active',
            'image_url'   => '',
            'video_url'   => '',
            'poster'      => '',
            'created_at'  => '2026-05-08T00:00:00+00:00',
            'updated_at'  => '2026-05-08T00:00:00+00:00',
        ],
    ];
}

/**
 * Read products. When $public_only is true, products with status='hidden' are
 * excluded so the public gallery never sees them.
 */
function read_products(bool $public_only = false): array
{
    ensure_storage();
    $db = db();

    if ($db instanceof SQLite3) {
        $result   = $db->query('SELECT * FROM products ORDER BY pinned DESC, datetime(created_at) DESC');
        $products = [];
        while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
            $row['pinned']   = (bool)$row['pinned'];
            $row['featured'] = (bool)($row['featured'] ?? false);
            $products[]      = normalize_product($row);
        }
        // When SQLite is empty fall through to the JSON file below, which may
        // have been populated by a data migration (e.g. seeding from the static
        // frontend products.json). sample_products() is only the final fallback.
        if (!empty($products)) {
            if ($public_only) {
                $products = array_values(
                    array_filter($products, static fn(array $p): bool => $p['status'] !== 'hidden')
                );
            }
            return $products;
        }
    }

    $raw      = file_get_contents(PRODUCTS_JSON);
    $products = json_decode($raw ?: '[]', true);
    if (!is_array($products) || count($products) === 0) {
        return sample_products();
    }

    usort($products, static function (array $a, array $b): int {
        $pin_cmp = (int)!empty($b['pinned']) <=> (int)!empty($a['pinned']);
        return $pin_cmp !== 0
            ? $pin_cmp
            : strcmp((string)($b['created_at'] ?? ''), (string)($a['created_at'] ?? ''));
    });

    $normalized = array_map('normalize_product', $products);

    if ($public_only) {
        $normalized = array_values(
            array_filter($normalized, static fn(array $p): bool => $p['status'] !== 'hidden')
        );
    }

    return $normalized;
}

function read_raw_products(): array
{
    ensure_storage();
    $raw      = file_get_contents(PRODUCTS_JSON);
    $products = json_decode($raw ?: '[]', true);
    return is_array($products) ? $products : [];
}

function save_products_json(array $products): void
{
    ensure_storage();
    write_json_file(PRODUCTS_JSON, array_values($products));
}

function _sqlite_upsert(SQLite3 $db, array $product): void
{
    $stmt = $db->prepare(
        'INSERT INTO products (
            id, title, description, category, availability, pinned,
            image_url, image_path, type, video_url, video_path,
            poster, poster_path, featured, status, created_at, updated_at
         ) VALUES (
            :id, :title, :description, :category, :availability, :pinned,
            :image_url, :image_path, :type, :video_url, :video_path,
            :poster, :poster_path, :featured, :status, :created_at, :updated_at
         )
         ON CONFLICT(id) DO UPDATE SET
            title        = excluded.title,
            description  = excluded.description,
            category     = excluded.category,
            availability = excluded.availability,
            pinned       = excluded.pinned,
            image_url    = excluded.image_url,
            image_path   = excluded.image_path,
            type         = excluded.type,
            video_url    = excluded.video_url,
            video_path   = excluded.video_path,
            poster       = excluded.poster,
            poster_path  = excluded.poster_path,
            featured     = excluded.featured,
            status       = excluded.status,
            updated_at   = excluded.updated_at'
    );
    foreach ([
        'id', 'title', 'description', 'category', 'availability',
        'image_url', 'image_path', 'type', 'video_url', 'video_path',
        'poster', 'poster_path', 'status', 'created_at', 'updated_at',
    ] as $key) {
        $stmt->bindValue(':' . $key, (string)($product[$key] ?? ''), SQLITE3_TEXT);
    }
    $stmt->bindValue(':pinned',   !empty($product['pinned'])   ? 1 : 0, SQLITE3_INTEGER);
    $stmt->bindValue(':featured', !empty($product['featured']) ? 1 : 0, SQLITE3_INTEGER);
    $stmt->execute();
}

function save_product(array $product): void
{
    ensure_storage();
    $db = db();

    if ($db instanceof SQLite3) {
        // Seed SQLite from JSON on first write so migrated products are not lost.
        if ((int)($db->querySingle('SELECT COUNT(*) FROM products') ?? 0) === 0) {
            foreach (read_raw_products() as $seed) {
                _sqlite_upsert($db, $seed);
            }
        }
        _sqlite_upsert($db, $product);
        mirror_sqlite_to_json($db);
        return;
    }

    $products = read_raw_products();
    $found    = false;
    foreach ($products as $index => $existing) {
        if (($existing['id'] ?? '') === $product['id']) {
            $products[$index] = $product;
            $found            = true;
            break;
        }
    }
    if (!$found) {
        $products[] = $product;
    }
    save_products_json($products);
}

function delete_product_by_id(string $id): void
{
    $db = db();
    if ($db instanceof SQLite3) {
        $stmt = $db->prepare('DELETE FROM products WHERE id = :id');
        $stmt->bindValue(':id', $id, SQLITE3_TEXT);
        $stmt->execute();
        mirror_sqlite_to_json($db);
        return;
    }

    $products = array_values(
        array_filter(read_raw_products(), static fn(array $p): bool => ($p['id'] ?? '') !== $id)
    );
    save_products_json($products);
}

function mirror_sqlite_to_json(SQLite3 $db): void
{
    $result   = $db->query('SELECT * FROM products ORDER BY pinned DESC, datetime(created_at) DESC');
    $products = [];
    while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
        $row['pinned']   = (bool)$row['pinned'];
        $row['featured'] = (bool)($row['featured'] ?? false);
        $products[]      = $row;
    }
    save_products_json($products);
}

// ---------------------------------------------------------------------------
// Story normalization and CRUD
// ---------------------------------------------------------------------------

function normalize_story(array $row): array
{
    return [
        'id'         => (string)($row['id'] ?? ''),
        'title'      => htmlspecialchars((string)($row['title'] ?? ''), ENT_QUOTES, 'UTF-8'),
        'media_url'  => (string)($row['media_url'] ?? ''),
        'type'       => ($row['type'] ?? 'image') === 'video' ? 'video' : 'image',
        'starts_at'  => (string)($row['starts_at'] ?? ''),
        'expires_at' => (string)($row['expires_at'] ?? ''),
        'status'     => ($row['status'] ?? 'active') === 'hidden' ? 'hidden' : 'active',
        'created_at' => (string)($row['created_at'] ?? gmdate('c')),
        'updated_at' => (string)($row['updated_at'] ?? gmdate('c')),
    ];
}

function read_raw_stories(): array
{
    ensure_storage();
    $raw     = file_get_contents(STORIES_JSON);
    $stories = json_decode($raw ?: '[]', true);
    return is_array($stories) ? $stories : [];
}

/**
 * Read stories. When $public_only is true, only active stories whose current
 * time falls within [starts_at, expires_at] are returned.
 */
function read_stories(bool $public_only = false): array
{
    $stories = array_map('normalize_story', read_raw_stories());

    if (!$public_only) {
        return $stories;
    }

    $now = gmdate('c');
    return array_values(array_filter($stories, static function (array $s) use ($now): bool {
        if ($s['status'] !== 'active') {
            return false;
        }
        if ($s['starts_at'] !== '' && $now < $s['starts_at']) {
            return false;
        }
        if ($s['expires_at'] !== '' && $now > $s['expires_at']) {
            return false;
        }
        return true;
    }));
}

function save_story(array $story): void
{
    $stories = read_raw_stories();
    $found   = false;
    foreach ($stories as $i => $existing) {
        if (($existing['id'] ?? '') === $story['id']) {
            $stories[$i] = $story;
            $found        = true;
            break;
        }
    }
    if (!$found) {
        $stories[] = $story;
    }
    write_json_file(STORIES_JSON, array_values($stories));
}

function delete_story_by_id(string $id): void
{
    $stories = array_values(
        array_filter(read_raw_stories(), static fn(array $s): bool => ($s['id'] ?? '') !== $id)
    );
    write_json_file(STORIES_JSON, $stories);
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

function default_settings(): array
{
    return [
        'bio'                => 'لباس‌های مجلسی و مزونی با دوخت اختصاصی',
        'bio_line2'          => 'سفارش آنلاین از طریق پیام',
        'stat_models_label'  => 'مدل',
        'stat_orders_value'  => '۳۸۴',
        'stat_orders_label'  => 'سفارش',
        'stat_contact_value' => '۴۱/۵K',
        'stat_contact_label' => 'دنبال‌کننده',
        'telegram_url'       => 'https://t.me/nazari_maison',
        'bale_url'           => 'https://ble.ir/nazari_maison',
        'updated_at'         => gmdate('c'),
    ];
}

function read_settings(): array
{
    ensure_storage();
    $raw      = file_get_contents(SETTINGS_JSON);
    $settings = json_decode($raw ?: '{}', true);
    if (!is_array($settings)) {
        $settings = [];
    }
    return array_merge(default_settings(), $settings);
}

function save_settings(array $settings): void
{
    ensure_storage();
    $settings['updated_at'] = gmdate('c');
    write_json_file(SETTINGS_JSON, $settings);
}
