<?php
// api/calculate.php - SERVER XATOSINI BARTARAF ETUVCHI TOZA VERSIYA

// PHP xatolarini yashirish
error_reporting(0); 
ini_set('display_errors', 0);

header('Content-Type: application/json');

// !!! SIZNING HAQIQIY OPENROUTER KALITINGIZ !!!
const OPENROUTER_API_KEY = "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"; 

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL_NAME = "amazon/nova-2-lite-v1"; 

$input = json_decode(file_get_contents('php://input'), true);

$prompt = $input['prompt'] ?? null;
$imageData = $input['image_data'] ?? null; 

if (!$prompt) {
    http_response_code(400);
    echo json_encode(['error' => 'Soʻrov matni (prompt) majburiy!']);
    exit;
}

$messages = [];
$image_content = null;

if ($imageData) {
    $image_content = [
        "type" => "image_url",
        "image_url" => ["url" => $imageData]
    ];
}

$text_content = [
    "type" => "text",
    "text" => $prompt
];

$content = $image_content ? [$image_content, $text_content] : [$text_content];

$messages[] = [
    "role" => "user",
    "content" => $content
];


$data = [
    "model" => MODEL_NAME,
    "messages" => $messages,
    "temperature" => 0.0,
    "stream" => false,
    "response_format" => ["type" => "json_object"], 
    "max_tokens" => 4096 
];

$ch = curl_init(OPENROUTER_URL);

curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer " . OPENROUTER_API_KEY,
    "Content-Type: application/json"
]);

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
    echo json_encode(['error' => 'AI dan JSON formatida javob kelmadi. Toʻliq javob: ' . $response]);
    exit;
}

// AI ning matnli javobini olish
$aiTextResponse = $responseData['choices'][0]['message']['content'] ?? null;

if (!$aiTextResponse) {
    http_response_code(500);
    echo json_encode(['error' => 'AI javobida matn (content) topilmadi.']);
    exit;
}

// Markdown kod bloklarini tozalash
$aiTextResponse = trim($aiTextResponse);
$aiTextResponse = preg_replace('/^```json\s*|```\s*$/i', '', $aiTextResponse);
$aiTextResponse = trim($aiTextResponse);

// Muvaffaqiyatli tozalangan JSON javobni chiqarish
echo json_encode(['success' => true, 'text' => $aiTextResponse]);
?>