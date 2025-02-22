<?php
require_once '../config/config.php';
require_once '../config/database.php';

if (!isLoggedIn()) {
    http_response_code(401);
    die(json_encode(['error' => 'غير مصرح']));
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['name']) || empty($data['name'])) {
    http_response_code(400);
    die(json_encode(['error' => 'اسم الغرفة مطلوب']));
}

try {
    $stmt = $db->prepare("INSERT INTO rooms (name, creator_id) VALUES (?, ?)");
    $stmt->execute([$data['name'], $_SESSION['user_id']]);
    
    echo json_encode([
        'success' => true,
        'room_id' => $db->lastInsertId()
    ]);
} catch(PDOException $e) {
    http_response_code(500);
    die(json_encode(['error' => 'خطأ في إنشاء الغرفة']));
}