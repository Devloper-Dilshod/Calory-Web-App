<?php
// api/data.php - TO'LIQ VA JSON BAZASIGA O'TKAZILGAN VERSIYA

header('Content-Type: application/json');

// --- JSON YORDAMCHI FUNKSIYALAR ---

$history_file = '../db/history.json';
$db_dir = dirname($history_file);

if (!is_dir($db_dir)) {
    mkdir($db_dir, 0777, true);
}
if (!file_exists($history_file)) {
    file_put_contents($history_file, json_encode([]));
}

function load_history() {
    global $history_file;
    $json_data = file_get_contents($history_file);
    return json_decode($json_data, true) ?? [];
}

function save_history($history) {
    global $history_file;
    file_put_contents($history_file, json_encode($history, JSON_PRETTY_PRINT));
}

// -----------------------------------

$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? '';
$user_id = $input['user_id'] ?? null;

// Barcha amallar uchun user_id majburiy
if (!$user_id) {
     http_response_code(401);
     echo json_encode(['success' => false, 'message' => 'Avtorizatsiya xatosi. Foydalanuvchi ID si topilmadi.']);
     exit;
}

try {
    $all_history = load_history();
    $user_history = array_filter($all_history, fn($item) => $item['user_id'] == $user_id);

    switch ($action) {
        case 'save_entry':
            $food_name = $input['food_name'] ?? 'Noma\'lum';
            $calories = (float)($input['calories'] ?? 0);
            $protein = (float)($input['protein'] ?? 0);
            $fat = (float)($input['fat'] ?? 0);
            $carbs = (float)($input['carbs'] ?? 0);
            $fiber = (float)($input['fiber'] ?? 0);
            
            // Yangi ID yaratish
            $new_id = empty($all_history) ? 1 : max(array_column($all_history, 'id')) + 1;

            $new_entry = [
                'id' => $new_id,
                'user_id' => (int)$user_id,
                'food_name' => $food_name,
                'calories' => round($calories, 2),
                'protein' => round($protein, 2),
                'fat' => round($fat, 2),
                'carbs' => round($carbs, 2),
                'fiber' => round($fiber, 2),
                'log_date' => date('Y-m-d')
            ];

            $all_history[] = $new_entry;
            save_history($all_history);

            echo json_encode(['success' => true, 'message' => '✅ Tarix muvaffaqiyatli saqlandi.']);
            break;

        case 'get_history':
            $today = date('Y-m-d');
            $thirty_days_ago = date('Y-m-d', strtotime('-30 days'));

            // Oxirgi 30 kunlik ma'lumotlarni saralash (JSONda saralash)
            $filtered_history = array_filter($user_history, function($item) use ($thirty_days_ago, $today) {
                 return $item['log_date'] >= $thirty_days_ago;
            });

            // Sanasi bo'yicha teskari tartiblash (eng yangi yuqorida)
            usort($filtered_history, function($a, $b) {
                if ($a['log_date'] === $b['log_date']) {
                    return $b['id'] - $a['id']; // Shu kundagi eng yangi ID yuqorida
                }
                return $b['log_date'] <=> $a['log_date']; // Sanasi bo'yicha tartiblash
            });
            
            echo json_encode(['success' => true, 'history' => array_values($filtered_history)]);
            break;
            
        case 'clear_history':
            // Faqat shu foydalanuvchiga tegishli bo'lmagan ma'lumotlarni saqlash
            $cleaned_history = array_filter($all_history, fn($item) => $item['user_id'] != $user_id);
            save_history($cleaned_history);

            echo json_encode(['success' => true, 'message' => '✅ Tarix muvaffaqiyatli tozalandi.']);
            break;

        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Notoʻgʻri amal: ' . $action]);
            break;
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => "❌ Serverda kutilmagan xato: " . $e->getMessage()]);
}
?>