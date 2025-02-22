<?php
require_once '../config/config.php';
require_once '../config/database.php';

if (isLoggedIn()) {
    redirect('index.php');
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $fullname = $_POST['fullname'] ?? '';
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';
    
    if (empty($fullname) || empty($username) || empty($password)) {
        $error = 'جميع الحقول مطلوبة';
    } else {
        try {
            // التحقق من وجود اسم المستخدم
            $stmt = $db->prepare("SELECT COUNT(*) FROM users WHERE username = ?");
            $stmt->execute([$username]);
            if ($stmt->fetchColumn() > 0) {
                $error = 'اسم المستخدم موجود مسبقاً';
            } else {
                // إنشاء المستخدم الجديد
                $stmt = $db->prepare("INSERT INTO users (fullname, username, password) VALUES (?, ?, ?)");
                $stmt->execute([
                    $fullname,
                    $username,
                    password_hash($password, PASSWORD_DEFAULT)
                ]);
                
                redirect('login.php');
            }
        } catch(PDOException $e) {
            $error = 'حدث خطأ في النظام';
        }
    }
}
?>
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>إنشاء حساب - <?php echo APP_NAME; ?></title>
    <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>
    <div class="auth-container">
        <div class="auth-form">
            <h2>إنشاء حساب جديد</h2>
            <?php if ($error): ?>
                <div class="error"><?php echo $error; ?></div>
            <?php endif; ?>
            
            <form method="POST">
                <div class="form-group">
                    <label for="fullname">الاسم الكامل</label>
                    <input type="text" id="fullname" name="fullname" required>
                </div>
                
                <div class="form-group">
                    <label for="username">اسم المستخدم</label>
                    <input type="text" id="username" name="username" required>
                </div>
                
                <div class="form-group">
                    <label for="password">كلمة المرور</label>
                    <input type="password" id="password" name="password" required>
                </div>
                
                <button type="submit" class="btn-primary">إنشاء الحساب</button>
            </form>
            
            <div class="auth-links">
                <a href="login.php">تسجيل الدخول</a>
            </div>
        </div>
    </div>
</body>
</html>