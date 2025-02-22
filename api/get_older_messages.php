<?php
session_start();
require_once '../config/database.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    die(json_encode(['error' => 'غير مصرح']));
}

$room_id = $_GET['room_id'] ?? 1;
$before_id = $_GET['before_id'] ?? PHP_INT_MAX;
$limit = 20; // عدد الرسائل في كل تحميل

try {
    $stmt = $db->prepare("
        SELECT 
            m.id,
            m.content,
            m.file_path,
            m.file_type,
            m.original_name,
            m.created_at,
            m.user_id,
            u.fullname as user_name
        FROM messages m
        JOIN users u ON m.user_id = u.id
        WHERE m.room_id = ? AND m.id < ?
        ORDER BY m.id DESC
        LIMIT ?
    ");
    
    $stmt->execute([$room_id, $before_id, $limit]);
    $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode($messages);
} catch(PDOException $e) {
    http_response_code(500);
    die(json_encode(['error' => 'خطأ في تحميل الرسائل']));
}
?>