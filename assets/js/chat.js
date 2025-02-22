// متغيرات عامة
let currentRoom = 1;
let lastMessageId = 0;
let messageUpdateInterval;
let userUpdateInterval;
let isLoadingOlderMessages = false;
let hasReachedEnd = false;

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
        
        // ترتيب الغرف
        const sortedRooms = rooms.sort((a, b) => {
            if (a.room_type === 'general') return -1;
            if (b.room_type === 'general') return 1;
            if (a.room_type === 'ai') return -1;
            if (b.room_type === 'ai') return 1;
            return new Date(b.created_at) - new Date(a.created_at);
        });

        const roomsList = document.getElementById('rooms-list');
        if (roomsList) {
            roomsList.innerHTML = sortedRooms.map(room => `
                <div class="room-item ${room.id === currentRoom ? 'active' : ''}" 
                     onclick="joinRoom(${room.id})">
                    <i class="fas ${room.is_ai ? 'fa-robot' : room.is_public ? 'fa-hashtag' : 'fa-lock'}"></i>
                    <span>${room.name}</span>
                    ${room.creator_name ? `<small>منشئ بواسطة ${room.creator_name}</small>` : ''}
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading rooms:', error);
        showNotification('حدث خطأ في تحميل الغرف', 'error');
    }
}

// تحديث وظيفة joinRoom
async function joinRoom(roomId) {
    currentRoom = roomId;
    lastMessageId = 0;
    hasReachedEnd = false;
    isLoadingOlderMessages = false;
    
    // تحديث حالة غرفة AI
    const room = document.querySelector(`.room-item[onclick="joinRoom(${roomId})"]`);
    window.aiChat.setIsAIRoom(room && room.querySelector('i.fa-robot'));
    
    // تحديث الواجهة
    document.querySelectorAll('.room-item').forEach(room => {
        room.classList.remove('active');
    });
    
    const activeRoom = document.querySelector(`.room-item[onclick="joinRoom(${roomId})"]`);
    if (activeRoom) {
        activeRoom.classList.add('active');
    }
    
    // تنظيف منطقة الرسائل وإظهار مؤشر التحميل
    const messagesContainer = document.getElementById('messages');
    if (messagesContainer) {
        messagesContainer.innerHTML = '<div class="loading-message">جاري تحميل الرسائل...</div>';
    }
    
    // تحديث معلومات الغرفة
    await updateRoomInfo(roomId);
    
    // تحميل الرسائل
    await loadInitialMessages();
}

// إضافة وظيفة جديدة لتحميل الرسائل الأولية
async function loadInitialMessages() {
    try {
        const response = await fetch(`api/get_messages.php?room_id=${currentRoom}&last_id=0`);
        const messages = await response.json();
        
        const messagesContainer = document.getElementById('messages');
        if (!messagesContainer) return;

        // إزالة مؤشر التحميل
        messagesContainer.innerHTML = '';
        
        if (messages.length > 0) {
            messages.forEach(message => {
                appendMessage(message);
                lastMessageId = Math.max(lastMessageId, message.id);
            });
            scrollToBottom();
        } else {
            // إظهار رسالة عندما لا توجد رسائل
            const emptyStateElement = document.createElement('div');
            emptyStateElement.className = 'empty-state';
            emptyStateElement.innerHTML = `
                <div class="empty-state-icon">
                    <i class="fas fa-comments"></i>
                </div>
                <p>لا توجد رسائل في هذه الغرفة</p>
                <p class="empty-state-subtitle">كن أول من يبدأ المحادثة!</p>
            `;
            messagesContainer.appendChild(emptyStateElement);
        }
    } catch (error) {
        console.error('Error loading initial messages:', error);
        showNotification('حدث خطأ في تحميل الرسائل', 'error');
        
        // إظهار رسالة خطأ في منطقة الرسائل
        const messagesContainer = document.getElementById('messages');
        if (messagesContainer) {
            messagesContainer.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>حدث خطأ في تحميل الرسائل</p>
                    <button onclick="loadInitialMessages()" class="btn-retry">
                        <i class="fas fa-redo"></i> إعادة المحاولة
                    </button>
                </div>
            `;
        }
    }
}

async function updateRoomInfo(roomId) {
    try {
        const response = await fetch(`api/get_room_info.php?room_id=${roomId}`);
        const roomInfo = await response.json();
        
        const roomInfoElement = document.getElementById('current-room-info');
        if (roomInfoElement && roomInfo.success) {
            roomInfoElement.innerHTML = `
                <div class="room-header">
                    <h2>
                        <i class="fas ${roomInfo.is_public ? 'fa-hashtag' : 'fa-lock'}"></i>
                        ${roomInfo.name}
                    </h2>
                    <span class="room-status">
                        <i class="fas fa-circle"></i>
                        ${roomInfo.online_count} ${roomInfo.online_count === 1 ? 'متصل' : 'متصلين'}
                    </span>
                </div>
                ${roomInfo.creator_name ? `<div class="room-creator">منشئ بواسطة ${roomInfo.creator_name}</div>` : ''}
            `;
        }
    } catch (error) {
        console.error('Error updating room info:', error);
    }
}

// تحديث وظيفة loadMessages
async function loadMessages() {
    try {
        const response = await fetch(`api/get_messages.php?room_id=${currentRoom}&last_id=${lastMessageId}`);
        const messages = await response.json();
        
        if (messages.length > 0) {
            const messagesContainer = document.getElementById('messages');
            const wasScrolledToBottom = isScrolledToBottom(messagesContainer);
            
            // التحقق من عدم وجود الرسائل قبل إضافتها
            messages.forEach(message => {
                if (message.id > lastMessageId && !document.querySelector(`[data-message-id="${message.id}"]`)) {
                    appendMessage(message);
                    lastMessageId = message.id;
                }
            });
            
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
    const isAIMessage = message.user_id === 0;
    
    const messageElement = document.createElement('div');
    messageElement.className = `message ${isOutgoing ? 'outgoing' : 'incoming'} ${isAIMessage ? 'ai-message' : ''}`;
    messageElement.setAttribute('data-message-id', message.id);
    
    let messageContent = '';
    if (message.file_path) {
        messageContent = renderFile(message.file_path, message.file_type, message.original_name);
    } else {
        messageContent = `<div class="message-text">${formatMessageText(message.content)}</div>`;
    }
    
    messageElement.innerHTML = `
        <div class="message-header">
            <div class="message-sender-info">
                <span class="user-avatar small">${getInitials(message.user_name)}</span>
                <span class="message-sender">${message.user_name}</span>
                ${isAIMessage ? '<span class="ai-badge"><i class="fas fa-robot"></i></span>' : ''}
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

// تحديث وظيفة handleMessageSubmit
async function handleMessageSubmit(e) {
    e.preventDefault();
    
    const input = document.getElementById('message-input');
    const sendButton = document.querySelector('.btn-send');
    const message = input.value.trim();
    
    if (!message || sendButton.disabled) {
        return;
    }

    try {
        input.disabled = true;
        sendButton.disabled = true;
        
        if (window.aiChat.isAIRoom) {
            // تعطيل التحديث التلقائي للرسائل مؤقتاً
            clearInterval(messageUpdateInterval);
            
            // إظهار رسالة المستخدم فوراً
            const userMessage = {
                id: Date.now(),
                content: message,
                user_id: currentUser.id,
                user_name: currentUser.name,
                created_at: new Date().toISOString()
            };
            
            // حفظ الرسالة وتنظيف حقل الإدخال
            input.value = '';
            appendMessage(userMessage);
            scrollToBottom();

            // إظهار مؤشر الكتابة
            const typingIndicator = document.createElement('div');
            typingIndicator.className = 'message incoming typing-indicator';
            typingIndicator.id = 'ai-typing-indicator';
            typingIndicator.innerHTML = `
                <div class="message-header">
                    <span class="message-sender">AI Assistant</span>
                </div>
                <div class="message-content">
                    <div class="typing-dots">
                        <span></span><span></span><span></span>
                    </div>
                </div>
            `;
            document.getElementById('messages').appendChild(typingIndicator);
            scrollToBottom();

            try {
                const aiResponse = await window.aiChat.sendToAI(message);
                
                // إزالة مؤشر الكتابة
                const indicator = document.getElementById('ai-typing-indicator');
                if (indicator) {
                    indicator.remove();
                }

                if (aiResponse) {
                    const aiMessage = {
                        id: Date.now() + 1,
                        content: aiResponse,
                        user_id: 0,
                        user_name: 'AI Assistant',
                        created_at: new Date().toISOString()
                    };
                    appendMessage(aiMessage);
                    scrollToBottom();
                }
            } catch (error) {
                showNotification(error.message || 'فشل في الحصول على رد من AI', 'error');
            } finally {
                // إعادة تشغيل التحديث التلقائي
                messageUpdateInterval = setInterval(loadMessages, 3000);
            }
        } else {
            // إرسال رسالة عادية
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

            const result = await response.json();
            
            if (result.success) {
                // إضافة الرسالة مباشرة للعرض
                const newMessage = {
                    id: result.message_id,
                    content: message,
                    user_id: currentUser.id,
                    user_name: currentUser.name,
                    created_at: new Date().toISOString()
                };
                
                input.value = '';
                appendMessage(newMessage);
                scrollToBottom();
            } else {
                throw new Error(result.error || 'فشل في إرسال الرسالة');
            }
        }
    } catch (error) {
        console.error('Error sending message:', error);
        showNotification(error.message || 'فشل في إرسال الرسالة', 'error');
    } finally {
        input.disabled = false;
        sendButton.disabled = false;
        input.focus();
    }
}

// File upload handling
async function handleFileUpload(e) {
    const fileInput = document.getElementById('file-upload');
    const file = fileInput.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('room_id', currentRoom);
    
    try {
        showNotification('جاري رفع الملف...', 'info');
        
        const response = await fetch('api/upload_file.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('تم رفع الملف بنجاح', 'success');
            await loadMessages();
        } else {
            showNotification(result.message || 'فشل في رفع الملف', 'error');
        }
    } catch (error) {
        console.error('Upload error:', error);
        showNotification('حدث خطأ أثناء رفع الملف', 'error');
    } finally {
        fileInput.value = ''; // Reset file input
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
    if (!text) return '';

    // تحديد الأكواد المحاطة بعلامات الاقتباس ```
    text = text.replace(/```(\w*)\n?([\s\S]*?)```/g, function(match, language, code) {
        return `<pre class="code-block ${language}"><code>${escapeHtml(code.trim())}</code></pre>`;
    });

    // تحديد الأكواد المحاطة بعلامة اقتباس واحدة `
    text = text.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

    // الحفاظ على المسافات والأسطر الجديدة
    text = text.split('\n').map(line => {
        // تحويل الروابط إلى روابط قابلة للنقر
        line = line.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
        
        // تحويل الإيموجي
        line = line.replace(/:\)/g, '😊')
                  .replace(/:\(/g, '😢')
                  .replace(/:D/g, '😃')
                  .replace(/\<3/g, '❤️');
        
        // الحفاظ على المسافات المتعددة
        return line.replace(/  /g, '&nbsp;&nbsp;');
    }).join('<br>');

    return text;
}

// إضافة دالة مساعدة لتأمين النص HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
    if (element.scrollTop === 0 && !isLoadingOlderMessages && !hasReachedEnd) {
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

// تحديث وظيفة loadOlderMessages
async function loadOlderMessages() {
    const firstMessage = document.querySelector('.message');
    if (!firstMessage || isLoadingOlderMessages || hasReachedEnd) return;
    
    isLoadingOlderMessages = true;
    
    const firstMessageId = firstMessage.getAttribute('data-message-id');
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-message';
    loadingIndicator.textContent = 'جاري تحميل الرسائل السابقة...';
    
    const messagesContainer = document.getElementById('messages');
    if (!messagesContainer) return;

    try {
        // إزالة رسائل "لا توجد رسائل أقدم" السابقة
        const existingEndMessages = messagesContainer.querySelectorAll('.end-message');
        existingEndMessages.forEach(msg => msg.remove());
        
        // إضافة مؤشر التحميل
        messagesContainer.prepend(loadingIndicator);
        
        const response = await fetch(`api/get_older_messages.php?room_id=${currentRoom}&before_id=${firstMessageId}`);
        const messages = await response.json();
        
        // إزالة مؤشر التحميل
        loadingIndicator.remove();
        
        if (messages.length > 0) {
            const oldHeight = messagesContainer.scrollHeight;
            messages.reverse().forEach(message => {
                if (!document.querySelector(`[data-message-id="${message.id}"]`)) {
                    const messageElement = createMessageElement(message);
                    messagesContainer.prepend(messageElement);
                }
            });
            
            // الحفاظ على موضع التمرير
            messagesContainer.scrollTop = messagesContainer.scrollHeight - oldHeight;
            
            if (messages.length < 20) {
                hasReachedEnd = true;
                const endMessage = document.createElement('div');
                endMessage.className = 'end-message';
                endMessage.textContent = 'لا توجد رسائل أقدم';
                messagesContainer.prepend(endMessage);
            }
        } else {
            hasReachedEnd = true;
            const endMessage = document.createElement('div');
            endMessage.className = 'end-message';
            endMessage.textContent = 'لا توجد رسائل أقدم';
            messagesContainer.prepend(endMessage);
        }
    } catch (error) {
        console.error('Error loading older messages:', error);
        showNotification('فشل تحميل الرسائل القديمة', 'error');
    } finally {
        isLoadingOlderMessages = false;
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