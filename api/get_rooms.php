<?php
require_once '../config/config.php';
require_once '../config/database.php';

if (!isLoggedIn()) {
    http_response_code(401);
    die(json_encode(['error' => 'غير مصرح']));
}

try {
    $stmt = $db->prepare("
        SELECT 
            r.*,
            u.fullname as creator_name,
            (SELECT COUNT(*) FROM messages WHERE room_id = r.id) as message_count
        FROM rooms r
        LEFT JOIN users u ON r.creator_id = u.id
        ORDER BY r.is_public DESC, r.created_at DESC
    ");
    $stmt->execute();
    
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch(PDOException $e) {
    http_response_code(500);
    die(json_encode(['error' => 'خطأ في تحميل الغرف']));
}