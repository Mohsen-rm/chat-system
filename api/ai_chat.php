<?php
session_start();
require_once '../config/config.php';
require_once '../config/database.php';

class GeminiAI {
    private $apiKey = 'AIzaSyD7pakxprGXgh31G1_LRO6BJMZFRjwb-bc';
    private $apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
    
    public function generateResponse($message) {
        $data = [
            'contents' => [
                [
                    'parts' => [
                        ['text' => $message]
                    ]
                ]
            ],
            'safetySettings' => [
                [
                    'category' => 'HARM_CATEGORY_HARASSMENT',
                    'threshold' => 'BLOCK_NONE'
                ]
            ]
        ];

        $ch = curl_init();
        
        curl_setopt_array($ch, [
            CURLOPT_URL => $this->apiUrl . '?key=' . $this->apiKey,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($data),
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Accept: application/json'
            ],
            CURLOPT_SSL_VERIFYPEER => false, // تعطيل التحقق من SSL للتجربة
            CURLOPT_VERBOSE => false
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_errno($ch);
        
        if ($curlError) {
            $error = [
                'error' => true,
                'message' => curl_error($ch),
                'code' => $curlError
            ];
            curl_close($ch);
            return $error;
        }
        
        curl_close($ch);
        
        $result = json_decode($response, true);
        
        if ($httpCode !== 200) {
            return [
                'error' => true,
                'message' => $result['error']['message'] ?? 'خطأ غير معروف في API',
                'code' => $httpCode
            ];
        }
        
        if (!isset($result['candidates'][0]['content']['parts'][0]['text'])) {
            return [
                'error' => true,
                'message' => 'استجابة AI غير صالحة',
                'response' => $response
            ];
        }
        
        return [
            'error' => false,
            'text' => $result['candidates'][0]['content']['parts'][0]['text']
        ];
    }
}

// تأكد من أن المخرجات نظيفة
ob_clean();
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'طريقة طلب غير مسموح بها']);
    exit;
}

try {
    if (!isset($_SESSION['user_id'])) {
        throw new Exception('جلسة غير مصرح بها');
    }

    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!$data || empty($data['message']) || !isset($data['room_id'])) {
        throw new Exception('بيانات غير صالحة');
    }

    $ai = new GeminiAI();
    $result = $ai->generateResponse($data['message']);
    
    if ($result['error']) {
        throw new Exception($result['message']);
    }
    
    $aiResponse = $result['text'];
    
    // حفظ في قاعدة البيانات
    $db->beginTransaction();
    
    try {
        // حفظ في جدول ai_messages
        $stmt = $db->prepare("
            INSERT INTO ai_messages (room_id, user_id, message, ai_response) 
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([$data['room_id'], $_SESSION['user_id'], $data['message'], $aiResponse]);

        // حفظ في جدول messages
        $stmt = $db->prepare("
            INSERT INTO messages (room_id, user_id, content) 
            VALUES (?, ?, ?), (?, 0, ?)
        ");
        $stmt->execute([
            $data['room_id'], $_SESSION['user_id'], $data['message'],
            $data['room_id'], $aiResponse
        ]);

        $db->commit();
        
        echo json_encode([
            'success' => true,
            'response' => $aiResponse
        ]);
        
    } catch (Exception $e) {
        $db->rollBack();
        throw $e;
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>