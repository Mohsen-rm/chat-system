<?php
session_start();
require_once '../config/database.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    die(json_encode(['success' => false, 'error' => 'غير مصرح']));
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['room_id']) || !isset($data['message']) || trim($data['message']) === '') {
    http_response_code(400);
    die(json_encode(['success' => false, 'error' => 'بيانات غير مكتملة']));
}

try {
    $stmt = $db->prepare("INSERT INTO messages (room_id, user_id, content, created_at) VALUES (?, ?, ?, datetime('now'))");
    $stmt->execute([
        (int)$data['room_id'],
        $_SESSION['user_id'],
        trim($data['message'])
    ]);
    
    $messageId = $db->lastInsertId();
    
    echo json_encode([
        'success' => true,
        'message_id' => $messageId,
        'message' => 'تم إرسال الرسالة بنجاح'
    ]);
} catch(PDOException $e) {
    error_log($e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'خطأ في إرسال الرسالة',
        'debug' => $e->getMessage()
    ]);
}
?>