class AIChat {
    constructor() {
        this.isAIRoom = false;
        this.isProcessing = false; // إضافة متغير لتتبع حالة المعالجة
    }

    async sendToAI(message) {
        // منع الإرسال المتكرر أثناء المعالجة
        if (this.isProcessing) {
            return;
        }

        try {
            this.isProcessing = true;

            const response = await fetch('api/ai_chat.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    room_id: currentRoom
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            if (result.success && result.response) {
                return result.response;
            } else {
                throw new Error(result.message || 'فشل في الحصول على رد من AI');
            }
        } catch (error) {
            console.error('AI Chat Error:', error);
            throw error;
        } finally {
            this.isProcessing = false;
        }
    }

    setIsAIRoom(value) {
        this.isAIRoom = value;
    }
}

// تصدير الكلاس
window.aiChat = new AIChat();