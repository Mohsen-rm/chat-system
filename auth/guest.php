<?php
require_once '../config/config.php';
require_once '../config/database.php';

if (isLoggedIn()) {
    redirect('index.php');
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $fullname = $_POST['fullname'] ?? '';
    
    if (empty($fullname)) {
        $error = 'الرجاء إدخال اسمك';
    } else {
        try {
            // إنشاء حساب زائر
            $username = 'guest_' . time();
            $password = bin2hex(random_bytes(8));
            
            $stmt = $db->prepare("INSERT INTO users (fullname, username, password, is_guest) VALUES (?, ?, ?, 1)");
            $stmt->execute([
                $fullname,
                $username,
                password_hash($password, PASSWORD_DEFAULT)
            ]);
            
            $user_id = $db->lastInsertId();
            
            $_SESSION['user_id'] = $user_id;
            $_SESSION['username'] = $username;
            $_SESSION['fullname'] = $fullname;
            $_SESSION['is_guest'] = true;
            
            redirect('index.php');
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
    <title>دخول كزائر - <?php echo APP_NAME; ?></title>
    <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>
    <div class="auth-container">
        <div class="auth-form">
            <h2>دخول كزائر</h2>
            <?php if ($error): ?>
                <div class="error"><?php echo $error; ?></div>
            <?php endif; ?>
            
            <form method="POST">
                <div class="form-group">
                    <label for="fullname">الاسم</label>
                    <input type="text" id="fullname" name="fullname" required>
                </div>
                
                <button type="submit" class="btn-primary">دخول</button>
            </form>
            
            <div class="auth-links">
                <a href="login.php">تسجيل الدخول</a>
                <a href="register.php">إنشاء حساب</a>
            </div>
        </div>
    </div>
</body>
</html>