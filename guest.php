<?php
session_start();
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $fullname = $_POST['fullname'];
    $username = "guest_" . time();
    $password = password_hash(uniqid(), PASSWORD_DEFAULT);
    
    try {
        $stmt = $db->prepare("INSERT INTO users (fullname, username, password, is_temporary) VALUES (?, ?, ?, 1)");
        $stmt->execute([$fullname, $username, $password]);
        
        $user_id = $db->lastInsertId();
        $_SESSION['user_id'] = $user_id;
        $_SESSION['username'] = $username;
        $_SESSION['fullname'] = $fullname;
        
        header("Location: index.php");
        exit();
    } catch(PDOException $e) {
        $error = "حدث خطأ، الرجاء المحاولة مرة أخرى";
    }
}
?>
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>دخول كزائر - موقع الدردشة</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="auth-container">
        <div class="auth-box">
            <h2>دخول كزائر</h2>
            <?php if (isset($error)): ?>
                <div class="error"><?php echo $error; ?></div>
            <?php endif; ?>
            <form method="POST">
                <div class="form-group">
                    <label>الاسم</label>
                    <input type="text" name="fullname" required>
                </div>
                <button type="submit" class="gradient-btn">دخول</button>
            </form>
            <div class="auth-links">
                <a href="login.php">تسجيل الدخول</a>
                <a href="register.php">إنشاء حساب</a>
            </div>
        </div>
    </div>
</body>
</html>