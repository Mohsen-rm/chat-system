<?php
session_start();
require_once 'config/database.php';

if (!isset($_SESSION['user_id'])) {
    header('Location: auth/login.php');
    exit;
}
?>
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>نظام الدردشة</title>
    <link rel="stylesheet" href="assets/css/style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</head>
<body>
    <div class="app-container">
        <!-- Sidebar -->
        <aside class="sidebar">
            <!-- User Profile -->
            <div class="user-profile">
                <div class="user-avatar">
                    <span><?php echo substr($_SESSION['fullname'], 0, 2); ?></span>
                </div>
                <div class="user-info">
                    <h3><?php echo htmlspecialchars($_SESSION['fullname']); ?></h3>
                    <span class="user-status">متصل</span>
                </div>
            </div>

            <!-- Online Users -->
            <div class="section-container">
                <h4 class="section-title">
                    <i class="fas fa-users"></i>
                    المتصلون الآن
                </h4>
                <div id="online-users" class="users-list"></div>
            </div>

            <!-- Chat Rooms -->
            <div class="section-container">
                <div class="section-header">
                    <h4 class="section-title">
                        <i class="fas fa-comments"></i>
                        غرف الدردشة
                    </h4>
                    <button id="create-room-btn" class="btn-create">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <div id="rooms-list" class="rooms-list"></div>
            </div>

            <!-- Logout Button -->
            <div class="sidebar-footer">
                <a href="auth/logout.php" class="btn-logout">
                    <i class="fas fa-sign-out-alt"></i>
                    تسجيل الخروج
                </a>
            </div>
        </aside>

        <!-- Main Chat Area -->
        <main class="chat-area">
            <!-- Chat Header -->
            <header class="chat-header">
                <div id="current-room-info">
                    <h2>الغرفة العامة</h2>
                    <span class="room-status">0 متصلين</span>
                </div>
            </header>

            <!-- Messages Area -->
            <div id="messages" class="messages-container"></div>

            <!-- Message Input -->
            <div class="message-input-container">
                <form id="message-form" class="message-form">
                    <div class="message-attachments">
                        <input type="file" id="file-upload" hidden 
                               accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt">
                        <button type="button" class="btn-attachment">
                            <i class="fas fa-paperclip"></i>
                        </button>
                    </div>
                    <input type="text" id="message-input" 
                           placeholder="اكتب رسالتك هنا..."
                           autocomplete="off">
                    <button type="submit" class="btn-send">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </form>
            </div>
        </main>
    </div>

    <script>
        const currentUser = {
            id: <?php echo $_SESSION['user_id']; ?>,
            name: "<?php echo $_SESSION['fullname']; ?>",
            isGuest: <?php echo isset($_SESSION['is_guest']) ? 'true' : 'false'; ?>
        };
    </script>
    <script src="assets/js/chat.js"></script>
</body>
</html>