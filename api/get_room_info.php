<?php
session_start();
require_once '../config/database.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    die(json_encode(['success' => false, 'message' => 'غير مصرح']));
}

$room_id = $_GET['room_id'] ?? 1;

try {
    $stmt = $db->prepare("
        SELECT 
            r.*,
            u.fullname as creator_name,
            (
                SELECT COUNT(DISTINCT user_id) 
                FROM messages 
                WHERE room_id = r.id 
                AND created_at >= datetime('now', '-5 minutes')
            ) as online_count
        FROM rooms r
        LEFT JOIN users u ON r.creator_id = u.id
        WHERE r.id = ?
    ");
    
    $stmt->execute([$room_id]);
    $roomInfo = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($roomInfo) {
        echo json_encode([
            'success' => true,
            'name' => $roomInfo['name'],
            'is_public' => (bool)$roomInfo['is_public'],
            'creator_name' => $roomInfo['creator_name'],
            'online_count' => (int)$roomInfo['online_count']
        ]);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'الغرفة غير موجودة']);
    }
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'خطأ في تحميل معلومات الغرفة']);
}