<?php
// إعدادات التطبيق
define('APP_NAME', 'نظام الدردشة');
define('APP_URL', 'http://localhost/chat-system');
define('UPLOAD_DIR', __DIR__ . '/../uploads/');
define('MAX_FILE_SIZE', 5 * 1024 * 1024); // 5 MB

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