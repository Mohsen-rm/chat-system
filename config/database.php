<?php
$db_file = __DIR__ . '/../database/chat.db';
$db_directory = dirname($db_file);

// إنشاء مجلد قاعدة البيانات إذا لم يكن موجوداً
if (!file_exists($db_directory)) {
    mkdir($db_directory, 0777, true);
}

try {
    $db = new PDO("sqlite:$db_file");
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // إنشاء جداول قاعدة البيانات
    $db->exec("
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            fullname TEXT NOT NULL,
            password TEXT NOT NULL,
            is_guest INTEGER DEFAULT 0,
            last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS rooms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            creator_id INTEGER,
            is_public INTEGER DEFAULT 1,
            is_ai INTEGER DEFAULT 0,
            room_type TEXT DEFAULT 'normal',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(creator_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            room_id INTEGER,
            user_id INTEGER,
            content TEXT DEFAULT NULL,
            file_path TEXT,
            file_type TEXT,
            original_name TEXT,
            file_size INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(room_id) REFERENCES rooms(id),
            FOREIGN KEY(user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS ai_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            room_id INTEGER,
            user_id INTEGER,
            message TEXT,
            ai_response TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(room_id) REFERENCES rooms(id),
            FOREIGN KEY(user_id) REFERENCES users(id)
        );
    ");

    // إنشاء الغرف الافتراضية
    $db->exec("
        INSERT OR IGNORE INTO rooms (id, name, is_public, room_type) VALUES (1, 'الغرفة العامة', 1, 'general');
        INSERT OR IGNORE INTO rooms (id, name, is_public, is_ai, room_type) VALUES (2, 'الدردشة مع AI', 1, 1, 'ai');
    ");

} catch(PDOException $e) {
    die("خطأ في قاعدة البيانات: " . $e->getMessage());
}
?>