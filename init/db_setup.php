<?php
// init/db_setup.php - YAKUNIY, SODDALASHTIRILGAN VERSIYA

$db_file = '../db/app.sqlite3';
$db_dir = dirname($db_file);

if (!is_dir($db_dir)) {
    mkdir($db_dir, 0777, true);
}

try {
    $pdo = new PDO('sqlite:' . $db_file);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // 1. Foydalanuvchilar jadvali (username noyob kalit bo'ladi)
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL, 
            password_hash TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    ");

    // 2. Kaloriya tarixi jadvali 
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            food_name TEXT NOT NULL,
            calories INTEGER NOT NULL,
            protein REAL,
            fat REAL,
            carbs REAL,
            fiber REAL,
            log_date DATE DEFAULT CURRENT_DATE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
    ");

    echo "✅ Ma'lumotlar bazasi va jadvallar muvaffaqiyatli yaratildi (yoki allaqachon mavjud).";

} catch (PDOException $e) {
    echo "❌ DB xatosi: " . $e->getMessage();
}