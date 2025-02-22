<?php
require_once '../config/config.php';
require_once '../config/database.php';

if (!isLoggedIn()) {
    http_response_code(401);
    die(json_encode(['success' => false, 'message' => 'غير مصرح']));
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die(json_encode(['success' => false, 'message' => 'طريقة غير مسموح بها']));
}

try {
    if (!isset($_FILES['file']) || !isset($_POST['room_id'])) {
        throw new Exception('البيانات المطلوبة غير مكتملة');
    }

    $file = $_FILES['file'];
    $roomId = (int)$_POST['room_id'];
    
    // Validate file
    $errors = validateFile($file);
    if (!empty($errors)) {
        throw new Exception(implode(', ', $errors));
    }
    
    // Create secure filename and move file
    $fileName = generateSecureFileName($file['name'], $file['type']);
    $uploadPath = UPLOAD_DIR . $fileName;
    
    if (!is_dir(UPLOAD_DIR)) {
        mkdir(UPLOAD_DIR, 0777, true);
    }
    
    if (!move_uploaded_file($file['tmp_name'], $uploadPath)) {
        throw new Exception('فشل في رفع الملف');
    }
    
    // Save to database
    $stmt = $db->prepare("
        INSERT INTO messages (room_id, user_id, content, file_path, file_type, original_name, file_size)
        VALUES (?, ?, NULL, ?, ?, ?, ?)
    ");
    
    $stmt->execute([
        $roomId,
        $_SESSION['user_id'],
        'uploads/' . $fileName,
        $file['type'],
        $file['name'],
        $file['size']
    ]);
    
    echo json_encode([
        'success' => true,
        'file' => [
            'path' => 'uploads/' . $fileName,
            'type' => $file['type'],
            'name' => $file['name'],
            'size' => $file['size']
        ]
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>