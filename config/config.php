<?php
// إعدادات التطبيق
define('APP_NAME', 'نظام الدردشة');

// تحديد URL التطبيق ديناميكياً
$protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https://' : 'http://';
$host = $_SERVER['HTTP_HOST'];
$baseDir = dirname(dirname($_SERVER['SCRIPT_NAME']));
$baseDir = rtrim($baseDir, '/');
define('APP_URL', $protocol . $host . $baseDir);

define('UPLOAD_DIR', __DIR__ . '/../uploads/');
define('MAX_FILE_SIZE', 500 * 1024 * 1024); // 500 MB

// إعدادات الجلسة
session_start();
date_default_timezone_set('Asia/Riyadh');

// دوال مساعدة
function isLoggedIn() {
    return isset($_SESSION['user_id']);
}

function redirect($path) {
    header("Location: " . APP_URL . "/" . $path);
    exit;
}

function sanitize($string) {
    return htmlspecialchars($string, ENT_QUOTES, 'UTF-8');
}

// File handling helper functions
function getAllowedFileTypes() {
    return [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/gif' => 'gif',
        'video/mp4' => 'mp4',
        'video/webm' => 'webm',
        'video/quicktime' => 'mov',
        'application/pdf' => 'pdf',
        'application/msword' => 'doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => 'docx',
        'text/plain' => 'txt'
    ];
}

function validateFile($file) {
    $errors = [];
    
    if ($file['size'] > MAX_FILE_SIZE) {
        $errors[] = 'حجم الملف يتجاوز الحد المسموح به';
    }
    
    if (!in_array($file['type'], array_keys(getAllowedFileTypes()))) {
        $errors[] = 'نوع الملف غير مسموح به';
    }
    
    return $errors;
}

function generateSecureFileName($originalName, $fileType) {
    $extension = getAllowedFileTypes()[$fileType];
    return uniqid() . '_' . time() . '.' . $extension;
}