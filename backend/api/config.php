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

const BALE_URL = 'https://ble.ir/nazari_maison';
const EITAA_URL = 'https://eitaa.com/nazari_maison';
const PHONE_URL = 'tel:+989000000000';

const DATA_DIR = __DIR__ . '/../data';
const UPLOAD_DIR = __DIR__ . '/../uploads';
const PRODUCTS_JSON = DATA_DIR . '/products.json';
const PRODUCTS_SQLITE = DATA_DIR . '/products.sqlite';

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
}

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
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            category TEXT,
            availability TEXT NOT NULL,
            pinned INTEGER NOT NULL DEFAULT 0,
            image_url TEXT NOT NULL,
            image_path TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )'
    );

    return $db;
}

function sample_products(): array
{
    return [
        [
            'id' => 'sample-1',
            'title' => 'پیراهن مجلسی کرم',
            'description' => 'نمونه نمایشی برای شروع گالری. پس از ورود به پنل مدیریت می‌توانید مدل واقعی بارگذاری کنید.',
            'category' => 'مجلسی',
            'availability' => 'available',
            'pinned' => true,
            'image_url' => '',
            'created_at' => '2026-05-10T00:00:00+00:00',
            'updated_at' => '2026-05-10T00:00:00+00:00',
        ],
        [
            'id' => 'sample-2',
            'title' => 'کت و دامن مزونی',
            'description' => 'چیدمان سه ستونه برای مشاهده سریع مدل‌ها، مشابه حس آشنای شبکه‌های اجتماعی.',
            'category' => 'مزونی',
            'availability' => 'available',
            'pinned' => false,
            'image_url' => '',
            'created_at' => '2026-05-09T00:00:00+00:00',
            'updated_at' => '2026-05-09T00:00:00+00:00',
        ],
        [
            'id' => 'sample-3',
            'title' => 'مانتو پاییزه',
            'description' => 'این محصول نمونه است و تصویر واقعی ندارد.',
            'category' => 'Fall',
            'availability' => 'sold_out',
            'pinned' => false,
            'image_url' => '',
            'created_at' => '2026-05-08T00:00:00+00:00',
            'updated_at' => '2026-05-08T00:00:00+00:00',
        ],
    ];
}

function normalize_product(array $row): array
{
    return [
        'id' => (string)($row['id'] ?? ''),
        'title' => htmlspecialchars((string)($row['title'] ?? ''), ENT_QUOTES, 'UTF-8'),
        'description' => htmlspecialchars((string)($row['description'] ?? ''), ENT_QUOTES, 'UTF-8'),
        'category' => htmlspecialchars((string)($row['category'] ?? ''), ENT_QUOTES, 'UTF-8'),
        'availability' => ($row['availability'] ?? 'available') === 'sold_out' ? 'sold_out' : 'available',
        'pinned' => filter_var($row['pinned'] ?? false, FILTER_VALIDATE_BOOLEAN),
        'image_url' => (string)($row['image_url'] ?? ''),
        'created_at' => (string)($row['created_at'] ?? gmdate('c')),
        'updated_at' => (string)($row['updated_at'] ?? gmdate('c')),
    ];
}

function read_products(): array
{
    ensure_storage();
    $db = db();
    if ($db instanceof SQLite3) {
        $result = $db->query('SELECT * FROM products ORDER BY pinned DESC, datetime(created_at) DESC');
        $products = [];
        while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
            $row['pinned'] = (bool)$row['pinned'];
            $products[] = normalize_product($row);
        }
        return $products ?: sample_products();
    }

    $raw = file_get_contents(PRODUCTS_JSON);
    $products = json_decode($raw ?: '[]', true);
    if (!is_array($products) || count($products) === 0) {
        return sample_products();
    }

    usort($products, static function (array $a, array $b): int {
        $pinCompare = (int)!empty($b['pinned']) <=> (int)!empty($a['pinned']);
        return $pinCompare !== 0 ? $pinCompare : strcmp((string)($b['created_at'] ?? ''), (string)($a['created_at'] ?? ''));
    });

    return array_map('normalize_product', $products);
}

function read_raw_products(): array
{
    ensure_storage();
    $raw = file_get_contents(PRODUCTS_JSON);
    $products = json_decode($raw ?: '[]', true);
    return is_array($products) ? $products : [];
}

function save_products_json(array $products): void
{
    ensure_storage();
    file_put_contents(PRODUCTS_JSON, json_encode(array_values($products), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n", LOCK_EX);
}

function save_product(array $product): void
{
    ensure_storage();
    $db = db();
    if ($db instanceof SQLite3) {
        $stmt = $db->prepare(
            'INSERT INTO products (id, title, description, category, availability, pinned, image_url, image_path, created_at, updated_at)
             VALUES (:id, :title, :description, :category, :availability, :pinned, :image_url, :image_path, :created_at, :updated_at)
             ON CONFLICT(id) DO UPDATE SET
                title = excluded.title,
                description = excluded.description,
                category = excluded.category,
                availability = excluded.availability,
                pinned = excluded.pinned,
                image_url = excluded.image_url,
                image_path = excluded.image_path,
                updated_at = excluded.updated_at'
        );
        foreach (['id', 'title', 'description', 'category', 'availability', 'image_url', 'image_path', 'created_at', 'updated_at'] as $key) {
            $stmt->bindValue(':' . $key, (string)($product[$key] ?? ''), SQLITE3_TEXT);
        }
        $stmt->bindValue(':pinned', !empty($product['pinned']) ? 1 : 0, SQLITE3_INTEGER);
        $stmt->execute();
        mirror_sqlite_to_json($db);
        return;
    }

    $products = read_raw_products();
    $found = false;
    foreach ($products as $index => $existing) {
        if (($existing['id'] ?? '') === $product['id']) {
            $products[$index] = $product;
            $found = true;
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

    $products = array_values(array_filter(read_raw_products(), static fn (array $product): bool => ($product['id'] ?? '') !== $id));
    save_products_json($products);
}

function mirror_sqlite_to_json(SQLite3 $db): void
{
    $result = $db->query('SELECT * FROM products ORDER BY pinned DESC, datetime(created_at) DESC');
    $products = [];
    while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
        $row['pinned'] = (bool)$row['pinned'];
        $products[] = $row;
    }
    save_products_json($products);
}

function input_string(string $key, int $max = 500): string
{
    $value = trim((string)($_POST[$key] ?? ''));
    $value = preg_replace('/\s+/u', ' ', $value) ?? '';
    return mb_substr($value, 0, $max, 'UTF-8');
}
?>
