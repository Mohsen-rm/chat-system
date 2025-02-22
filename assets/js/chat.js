// متغيرات عامة
let currentRoom = 1;
let lastMessageId = 0;
let messageUpdateInterval;
let userUpdateInterval;

document.addEventListener('DOMContentLoaded', () => {
    initializeChat();
    setupEventListeners();
    startPeriodicUpdates();
});

function initializeChat() {
    loadRooms();
    loadUsers();
    joinRoom(currentRoom);
}

function setupEventListeners() {
    const messageForm = document.getElementById('message-form');
    const fileUpload = document.getElementById('file-upload');
    const createRoomBtn = document.getElementById('create-room-btn');

    if (messageForm) {
        messageForm.addEventListener('submit', handleMessageSubmit);
    }

    if (fileUpload) {
        fileUpload.addEventListener('change', handleFileUpload);
    }

    if (createRoomBtn) {
        createRoomBtn.addEventListener('click', createNewRoom);
    }

    // مراقبة تمرير الماوس للرسائل
    const messagesContainer = document.getElementById('messages');
    if (messagesContainer) {
        messagesContainer.addEventListener('scroll', handleScroll);
    }
}

function startPeriodicUpdates() {
    messageUpdateInterval = setInterval(loadMessages, 3000);
    userUpdateInterval = setInterval(loadUsers, 10000);
}

async function loadRooms() {
    try {
        const response = await fetch('api/get_rooms.php');
        const rooms = await response.json();
        
        const roomsList = document.getElementById('rooms-list');
        if (roomsList) {
            roomsList.innerHTML = rooms.map(room => `
                <div class="room-item ${room.id === currentRoom ? 'active' : ''}" 
                     onclick="joinRoom(${room.id})">
                    <i class="fas ${room.is_public ? 'fa-hashtag' : 'fa-lock'}"></i>
                    <span>${room.name}</span>
                    ${room.creator_name ? `<small>منشئ بواسطة ${room.creator_name}</small>` : ''}
                    ${room.unread_count ? `<span class="unread-badge">${room.unread_count}</span>` : ''}
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading rooms:', error);
        showNotification('حدث خطأ في تحميل الغرف', 'error');
    }
}

async function joinRoom(roomId) {
    currentRoom = roomId;
    lastMessageId = 0;
    
    // تحديث الواجهة
    document.querySelectorAll('.room-item').forEach(room => {
        room.classList.remove('active');
    });
    
    const activeRoom = document.querySelector(`.room-item[onclick="joinRoom(${roomId})"]`);
    if (activeRoom) {
        activeRoom.classList.add('active');
    }
    
    // تنظيف منطقة الرسائل
    const messagesContainer = document.getElementById('messages');
    if (messagesContainer) {
        messagesContainer.innerHTML = '<div class="loading-messages">جاري تحميل الرسائل...</div>';
    }
    
    // تحديث معلومات الغرفة
    updateRoomInfo(roomId);
    
    // تحميل الرسائل
    await loadMessages();
}

async function updateRoomInfo(roomId) {
    try {
        const response = await fetch(`api/get_room_info.php?room_id=${roomId}`);
        const roomInfo = await response.json();
        
        const roomInfoElement = document.getElementById('current-room-info');
        if (roomInfoElement) {
            roomInfoElement.innerHTML = `
                <h2>${roomInfo.name}</h2>
                <span class="room-status">${roomInfo.online_count} متصلين</span>
            `;
        }
    } catch (error) {
        console.error('Error updating room info:', error);
    }
}

async function loadMessages() {
    try {
        const response = await fetch(`api/get_messages.php?room_id=${currentRoom}&last_id=${lastMessageId}`);
        const messages = await response.json();
        
        if (messages.length > 0) {
            const messagesContainer = document.getElementById('messages');
            const wasScrolledToBottom = isScrolledToBottom(messagesContainer);
            
            messages.forEach(message => {
                if (message.id > lastMessageId) {
                    appendMessage(message);
                    lastMessageId = message.id;
                }
            });
            
            // التمرير إلى أسفل فقط إذا كان المستخدم في الأسفل
            if (wasScrolledToBottom) {
                scrollToBottom();
            }
        }
    } catch (error) {
        console.error('Error loading messages:', error);
        showNotification('حدث خطأ في تحميل الرسائل', 'error');
    }
}

function appendMessage(message) {
    const messagesContainer = document.getElementById('messages');
    if (!messagesContainer) return;

    const isOutgoing = message.user_id === currentUser.id;
    const messageElement = document.createElement('div');
    messageElement.className = `message ${isOutgoing ? 'outgoing' : 'incoming'}`;
    messageElement.setAttribute('data-message-id', message.id);
    
    let messageContent = '';
    if (message.file_path) {
        messageContent = renderFile(message.file_path, message.file_type, message.original_name);
    } else {
        messageContent = `<p>${formatMessageText(message.content)}</p>`;
    }
    
    messageElement.innerHTML = `
        <div class="message-header">
            <div class="message-sender-info">
                <span class="user-avatar small">${getInitials(message.user_name)}</span>
                <span class="message-sender">${message.user_name}</span>
            </div>
            <span class="message-time" title="${formatFullDate(message.created_at)}">
                ${formatTime(message.created_at)}
            </span>
        </div>
        <div class="message-content">
            ${messageContent}
        </div>
        ${isOutgoing ? '<div class="message-status"><i class="fas fa-check"></i></div>' : ''}
    `;
    
    messagesContainer.appendChild(messageElement);
    
    // تحريك الصور عند تحميلها
    const images = messageElement.getElementsByTagName('img');
    Array.from(images).forEach(img => {
        img.addEventListener('load', () => {
            if (isScrolledToBottom(messagesContainer)) {
                scrollToBottom();
            }
        });
    });
}

async function handleMessageSubmit(e) {
    e.preventDefault();
    
    const input = document.getElementById('message-input');
    const sendButton = document.querySelector('.btn-send');
    const message = input.value.trim();
    
    if (message) {
        try {
            // تعطيل الإدخال أثناء الإرسال
            input.disabled = true;
            sendButton.disabled = true;
            
            const response = await fetch('api/send_message.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    room_id: currentRoom,
                    message: message
                })
            });
            
            if (response.ok) {
                input.value = '';
                await loadMessages();
                showNotification('تم إرسال الرسالة', 'success');
            } else {
                throw new Error('فشل إرسال الرسالة');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            showNotification('فشل إرسال الرسالة', 'error');
        } finally {
            // إعادة تفعيل الإدخال
            input.disabled = false;
            sendButton.disabled = false;
            input.focus();
        }
    }
}

async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // التحقق من حجم الملف (5MB كحد أقصى)
    if (file.size > 5 * 1024 * 1024) {
        showNotification('حجم الملف يتجاوز 5 ميجابايت', 'error');
        e.target.value = '';
        return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('room_id', currentRoom);
    
    const progressBar = document.createElement('div');
    progressBar.className = 'upload-progress';
    document.getElementById('message-form').prepend(progressBar);
    
    try {
        const response = await fetch('api/upload_file.php', {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            await loadMessages();
            showNotification('تم رفع الملف بنجاح', 'success');
        } else {
            throw new Error('فشل رفع الملف');
        }
    } catch (error) {
        console.error('Error uploading file:', error);
        showNotification('فشل رفع الملف', 'error');
    } finally {
        e.target.value = '';
        progressBar.remove();
    }
}

async function createNewRoom() {
    const roomName = prompt('أدخل اسم الغرفة الجديدة:');
    if (roomName) {
        try {
            const response = await fetch('api/create_room.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: roomName })
            });
            
            if (response.ok) {
                const data = await response.json();
                await loadRooms();
                joinRoom(data.room_id);
                showNotification('تم إنشاء الغرفة بنجاح', 'success');
            }
        } catch (error) {
            console.error('Error creating room:', error);
            showNotification('فشل إنشاء الغرفة', 'error');
        }
    }
}

async function loadUsers() {
    try {
        const response = await fetch('api/get_users.php');
        const users = await response.json();
        
        const usersList = document.getElementById('online-users');
        if (usersList) {
            usersList.innerHTML = users.map(user => `
                <div class="user-item">
                    <div class="user-item-avatar">
                        <span class="user-avatar small">${getInitials(user.fullname)}</span>
                        <span class="status-dot ${user.is_online ? 'online' : 'offline'}"></span>
                    </div>
                    <div class="user-item-info">
                        <span class="user-name">${user.fullname}</span>
                        ${user.is_guest ? '<span class="guest-badge">زائر</span>' : ''}
                        <span class="user-status">${user.is_online ? 'متصل' : 'غير متصل'}</span>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

function formatMessageText(text) {
    // تحويل الروابط إلى روابط قابلة للنقر
    text = text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
    
    // تحويل الإيموجي
    text = text.replace(/:\)/g, '😊')
               .replace(/:\(/g, '😢')
               .replace(/:D/g, '😃')
               .replace(/\<3/g, '❤️');
    
    return text;
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ar-SA', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

function formatFullDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getInitials(name) {
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
}

function renderFile(filePath, fileType, originalName) {
    if (fileType.startsWith('image/')) {
        return `
            <div class="image-container">
                <img src="${filePath}" alt="${originalName}" class="file-preview">
                <a href="${filePath}" download="${originalName}" class="download-btn">
                    <i class="fas fa-download"></i>
                </a>
            </div>
        `;
    } else if (fileType.startsWith('video/')) {
        return `
            <video controls class="file-preview">
                <source src="${filePath}" type="${fileType}">
                فيديو غير مدعوم
            </video>
        `;
    } else if (fileType.startsWith('audio/')) {
        return `
            <audio controls>
                <source src="${filePath}" type="${fileType}">
                ملف صوتي غير مدعوم
            </audio>
        `;
    } else {
        const icon = getFileIcon(fileType);
        return `
            <div class="file-message">
                <i class="fas ${icon}"></i>
                <a href="${filePath}" download="${originalName}">
                    ${originalName}
                </a>
            </div>
        `;
    }
}

function getFileIcon(fileType) {
    const icons = {
        'application/pdf': 'fa-file-pdf',
        'application/msword': 'fa-file-word',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'fa-file-word',
        'text/plain': 'fa-file-alt',
        'application/zip': 'fa-file-archive'
    };
    
    return icons[fileType] || 'fa-file';
}

function isScrolledToBottom(element) {
    return Math.abs(element.scrollHeight - element.clientHeight - element.scrollTop) < 1;
}

function scrollToBottom() {
    const messagesContainer = document.getElementById('messages');
    if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

function handleScroll(e) {
    const element = e.target;
    if (element.scrollTop === 0) {
        loadOlderMessages();
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }, 100);
}

async function loadOlderMessages() {
    const firstMessage = document.querySelector('.message');
    if (!firstMessage) return;
    
    const firstMessageId = firstMessage.getAttribute('data-message-id');
    
    try {
        const response = await fetch(`api/get_messages.php?room_id=${currentRoom}&before_id=${firstMessageId}`);
        const messages = await response.json();
        
        if (messages.length > 0) {
            const messagesContainer = document.getElementById('messages');
            const oldHeight = messagesContainer.scrollHeight;
            
            messages.reverse().forEach(message => {
                const messageElement = createMessageElement(message);
                messagesContainer.prepend(messageElement);
            });
            
            // الحفاظ على موضع التمرير
            messagesContainer.scrollTop = messagesContainer.scrollHeight - oldHeight;
        }
    } catch (error) {
        console.error('Error loading older messages:', error);
        showNotification('فشل تحميل الرسائل القديمة', 'error');
    }
}

function createMessageElement(message) {
    const isOutgoing = message.user_id === currentUser.id;
    const messageElement = document.createElement('div');
    messageElement.className = `message ${isOutgoing ? 'outgoing' : 'incoming'}`;
    messageElement.setAttribute('data-message-id', message.id);
    
    let messageContent = '';
    if (message.file_path) {
        messageContent = renderFile(message.file_path, message.file_type, message.original_name);
    } else {
        messageContent = `<p>${formatMessageText(message.content)}</p>`;
    }
    
    messageElement.innerHTML = `
        <div class="message-header">
            <div class="message-sender-info">
                <span class="user-avatar small">${getInitials(message.user_name)}</span>
                <span class="message-sender">${message.user_name}</span>
            </div>
            <span class="message-time" title="${formatFullDate(message.created_at)}">
                ${formatTime(message.created_at)}
            </span>
        </div>
        <div class="message-content">
            ${messageContent}
        </div>
        ${isOutgoing ? '<div class="message-status"><i class="fas fa-check"></i></div>' : ''}
    `;
    
    return messageElement;
}

// تنظيف عند مغادرة الصفحة
window.addEventListener('beforeunload', () => {
    clearInterval(messageUpdateInterval);
    clearInterval(userUpdateInterval);
});

// معالجة أخطاء الشبكة
window.addEventListener('online', () => {
    showNotification('تم استعادة الاتصال', 'success');
    loadMessages();
    loadUsers();
});

window.addEventListener('offline', () => {
    showNotification('انقطع الاتصال', 'error');
});

// إضافة دعم للكتابة باللمس
if ('ontouchstart' in window) {
    document.documentElement.classList.add('touch-device');
}

// دعم وضع الظلام
function toggleDarkMode() {
    document.documentElement.classList.toggle('dark-mode');
    const isDarkMode = document.documentElement.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
}

// تحميل تفضيل وضع الظلام
if (localStorage.getItem('darkMode') === 'true') {
    document.documentElement.classList.add('dark-mode');
}

// تصدير الدوال العامة
window.joinRoom = joinRoom;
window.createNewRoom = createNewRoom;
window.toggleDarkMode = toggleDarkMode;