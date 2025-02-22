<?php
session_start();
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $fullname = $_POST['fullname'];
    $username = $_POST['username'];
    $password = password_hash($_POST['password'], PASSWORD_DEFAULT);
    
    try {
        $stmt = $db->prepare("INSERT INTO users (fullname, username, password) VALUES (?, ?, ?)");
        $stmt->execute([$fullname, $username, $password]);
        
        header("Location: login.php");
        exit();
    } catch(PDOException $e) {
        $error = "اسم المستخدم موجود مسبقاً";
    }
}
?>
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>إنشاء حساب - موقع الدردشة</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="auth-container">
        <div class="auth-box">
            <h2>إنشاء حساب جديد</h2>
            <?php if (isset($error)): ?>
                <div class="error"><?php echo $error; ?></div>
            <?php endif; ?>
            <form method="POST">
                <div class="form-group">
                    <label>الاسم الكامل</label>
                    <input type="text" name="fullname" required>
                </div>
                <div class="form-group">
                    <label>اسم المستخدم</label>
                    <input type="text" name="username" required>
                </div>
                <div class="form-group">
                    <label>كلمة المرور</label>
                    <input type="password" name="password" required>
                </div>
                <button type="submit" class="gradient-btn">إنشاء الحساب</button>
            </form>
            <div class="auth-links">
                <a href="login.php">تسجيل الدخول</a>
            </div>
        </div>
    </div>
</body>
</html>