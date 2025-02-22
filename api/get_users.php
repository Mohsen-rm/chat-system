<?php
session_start();
require_once '../config/database.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    die(json_encode(['error' => 'غير مصرح']));
}

try {
    $stmt = $db->prepare("
        SELECT 
            id,
            fullname,
            is_guest,
            (DATETIME('now') < DATETIME(last_seen, '+5 minutes')) as is_online
        FROM users
        ORDER BY is_online DESC, fullname ASC
    ");
    $stmt->execute();
    
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch(PDOException $e) {
    http_response_code(500);
    die(json_encode(['error' => 'خطأ في تحميل المستخدمين']));
}