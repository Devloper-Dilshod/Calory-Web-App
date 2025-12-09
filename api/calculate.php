<?php
// api/calculate.php - TO'LIQ VA ISHONCHLI VERSIYA

// PHP xatolarini yashirish va faqat JSON chiqishi uchun MUHIM:
error_reporting(0); 
ini_set('display_errors', 0);

header('Content-Type: application/json');

// !!! 1-QADAM: SHAXSIY OPENROUTER KALITINGIZNI KIRITING !!!
// Bu kalitni haqiqiy OpenRouter API kalitingiz bilan almashtiring.
const OPENROUTER_API_KEY = "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"; // BU QIYMATNI ALMASHTIRING!
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// YANGI MODEL: amazon/nova-2-lite-v1 (rasmlarga tushunadi)
const MODEL_NAME = "amazon/nova-2-lite-v1"; 

// Plaseholder kalitini tekshirish (agar almashtirilmagan bo'lsa, xato beradi)
const PLACEHOLDER_KEY = "sk-or-v1-94aea9775d2bd0136db1b78beae592771969e3524975afbe4e55638d6b2af30";

// Asosiy tekshiruv
if (OPENROUTER_API_KEY === PLACEHOLDER_KEY) {
    http_response_code(500);
    echo json_encode(['error' => '❌ AI kaliti kiritilmagan. Iltimos, api/calculate.php faylidagi OPENROUTER_API_KEY ni almashtiring.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$prompt = $input['prompt'] ?? '';
$image_data = $input['image_data'] ?? null;

if (empty($prompt)) {
    http_response_code(400);
    echo json_encode(['error' => 'Soʻrov matni boʻsh boʻlishi mumkin emas.']);
    exit;
}

$content = [
    ['type' => 'text', 'text' => $prompt]
];

if ($image_data) {
    // Rasm datasi uchun Mantiq
    $mimeType = 'image/jpeg'; 
    $imageData = str_replace('data:image/jpeg;base64,', '', $image_data);
    $imageData = str_replace('data:image/png;base64,', '', $imageData);
    
    array_push($content, [
        'type' => 'image_url',
        'image_url' => [
            'url' => "data:{$mimeType};base64,{$imageData}"
        ]
    ]);
}

$data = [
    'model' => MODEL_NAME,
    'messages' => [
        [
            'role' => 'user',
            'content' => $content
        ]
    ],
    'max_tokens' => 1000, // JSON hajmi uchun yetarli
    'stream' => false,
    'temperature' => 0.0, // Natija doimo JSON bo'lishi uchun past qilindi
];


// cURL ni ishlatish
$ch = curl_init(OPENROUTER_URL);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . OPENROUTER_API_KEY,
    'Content-Type: application/json',
    'HTTP-Referer: http://localhost', 
    'X-Title: AI Calorie Tracker'
]);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($curlError) {
    http_response_code(500);
    echo json_encode(['error' => 'cURL xatosi: ' . $curlError]);
    exit;
}

if ($httpCode !== 200) {
    http_response_code($httpCode);
    
    $errorDetails = json_decode($response, true);
    if (json_last_error() === JSON_ERROR_NONE && isset($errorDetails['error'])) {
        $message = $errorDetails['error']['message'] ?? 'Noma\'lum xato.';
        echo json_encode(['error' => "AI serveri xatosi (Status: $httpCode): $message"]);
    } else {
        echo json_encode(['error' => "AI serveri xatosi: Status $httpCode. Kontent: " . (strlen($response) > 200 ? substr($response, 0, 200) . '...' : $response)]);
    }
    exit;
}

// AI javobini tahlil qilish
$responseData = json_decode($response, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(500);
    echo json_encode(['error' => 'AI dan JSON formatida javob kelmadi. To\'liq javob: ' . $response]);
    exit;
}

// !!! ENGIN ASOSIY TUZATISH: AI ning matnli javobini olish !!!
$ai_response_text = $responseData['choices'][0]['message']['content'] ?? null;

// Matn mavjudligini tekshirish
if (!$ai_response_text || trim($ai_response_text) === '') {
    http_response_code(500);
    echo json_encode(['error' => 'AI serveri javobining kontent qismi bo\'sh. Bu JSON formatidagi ma\'lumotni qaytara olmaganini anglatadi.']);
    exit;
}

// Natijani JS ga yuborish
echo json_encode(['text' => $ai_response_text]);
?>