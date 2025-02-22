<?php
// إعدادات قاعدة البيانات
$db_file = "chat.db";

try {
    // إنشاء اتصال قاعدة البيانات
    $db = new PDO("sqlite:$db_file");
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // إنشاء جداول قاعدة البيانات إذا لم تكن موجودة
    $db->exec("CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        fullname TEXT NOT NULL,
        password TEXT NOT NULL,
        is_temporary INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    $db->exec("CREATE TABLE IF NOT EXISTS rooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        creator_id INTEGER,
        is_public INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(creator_id) REFERENCES users(id)
    )");

    $db->exec("CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_id INTEGER,
        user_id INTEGER,
        message TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(room_id) REFERENCES rooms(id),
        FOREIGN KEY(user_id) REFERENCES users(id)
    )");

    // إنشاء الغرفة العامة إذا لم تكن موجودة
    $stmt = $db->prepare("INSERT OR IGNORE INTO rooms (id, name, is_public) VALUES (1, 'الغرفة العامة', 1)");
    $stmt->execute();

} catch(PDOException $e) {
    die("خطأ في الاتصال بقاعدة البيانات: " . $e->getMessage());
}
?>