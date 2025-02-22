<?php
session_start();
require_once '../config/database.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    die(json_encode(['error' => 'غير مصرح']));
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['room_id']) || !isset($data['message'])) {
    http_response_code(400);
    die(json_encode(['error' => 'بيانات غير مكتملة']));
}

try {
    $stmt = $db->prepare("INSERT INTO messages (room_id, user_id, content) VALUES (?, ?, ?)");
    $stmt->execute([$data['room_id'], $_SESSION['user_id'], $data['message']]);
    
    echo json_encode(['success' => true, 'message_id' => $db->lastInsertId()]);
} catch(PDOException $e) {
    http_response_code(500);
    die(json_encode(['error' => 'خطأ في إرسال الرسالة']));
}
?>