<?php
session_start();
require_once '../config/database.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    die(json_encode(['error' => 'غير مصرح']));
}

$room_id = $_GET['room_id'] ?? 1;
$last_id = $_GET['last_id'] ?? 0;

try {
    $stmt = $db->prepare("
        SELECT 
            m.id,
            m.content,
            m.file_path,
            m.file_type,
            m.created_at,
            m.user_id,
            u.fullname as user_name
        FROM messages m
        JOIN users u ON m.user_id = u.id
        WHERE m.room_id = ? AND m.id > ?
        ORDER BY m.created_at ASC
    ");
    $stmt->execute([$room_id, $last_id]);
    
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch(PDOException $e) {
    http_response_code(500);
    die(json_encode(['error' => 'خطأ في تحميل الرسائل']));
}
?>