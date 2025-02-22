<?php
session_start();
require_once '../config/database.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    die(json_encode(['error' => 'غير مصرح']));
}

if (!isset($_FILES['file']) || !isset($_POST['room_id'])) {
    http_response_code(400);
    die(json_encode(['error' => 'بيانات غير مكتملة']));
}

$file = $_FILES['file'];
$room_id = $_POST['room_id'];

// التحقق من نوع الملف
$allowed_types = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'video/mp4',
    'audio/mpeg',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

if (!in_array($file['type'], $allowed_types)) {
    http_response_code(400);
    die(json_encode(['error' => 'نوع الملف غير مسموح به']));
}

// إنشاء مجلد التحميلات إذا لم يكن موجوداً
$upload_dir = __DIR__ . '/../uploads';
if (!file_exists($upload_dir)) {
    mkdir($upload_dir, 0777, true);
}

// إنشاء اسم فريد للملف
$file_extension = pathinfo($file['name'], PATHINFO_EXTENSION);
$file_name = uniqid() . '.' . $file_extension;
$file_path = 'uploads/' . $file_name;

if (move_uploaded_file($file['tmp_name'], __DIR__ . '/../' . $file_path)) {
    try {
        $stmt = $db->prepare("
            INSERT INTO messages (room_id, user_id, content, file_path, file_type) 
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $room_id,
            $_SESSION['user_id'],
            $file['name'],
            $file_