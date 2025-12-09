<?php
// api/data.php - TO'LIQ VA XAVFSIZ VERSIYA

header('Content-Type: application/json');
$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? '';
$user_id = $input['user_id'] ?? null;

$db_file = '../db/app.sqlite3';

// Barcha amallar uchun user_id majburiy
if (!$user_id) {
     http_response_code(401);
     echo json_encode(['success' => false, 'message' => 'Avtorizatsiya xatosi. Foydalanuvchi ID si topilmadi.']);
     exit;
}

try {
    $pdo = new PDO('sqlite:' . $db_file);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => "DB xatosi: Ulanish xatosi."]);
    exit;
}


switch ($action) {
    case 'save_entry':
        $food_name = $input['food_name'] ?? 'Noma\'lum';
        $calories = (float)($input['calories'] ?? 0);
        $protein = (float)($input['protein'] ?? 0);
        $fat = (float)($input['fat'] ?? 0);
        $carbs = (float)($input['carbs'] ?? 0);
        $fiber = (float)($input['fiber'] ?? 0);

        // log_date sukut bo'yicha (DEFAULT) 'Y-m-d' formatida joriy sanani qo'yadi
        $stmt = $pdo->prepare("INSERT INTO history (user_id, food_name, calories, protein, fat, carbs, fiber) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$user_id, $food_name, $calories, $protein, $fat, $carbs, $fiber]);
        
        echo json_encode(['success' => true, 'message' => '✅ Mahsulot tarixi muvaffaqiyatli saqlandi.']);
        break;

    case 'get_history':
        // Oxirgi 30 kunlik ma'lumotlarni olish
        // Tartiblash: log_date DESC (eng yangi kun yuqorida), id DESC (shu kundagi eng yangi kiritma yuqorida)
        $stmt = $pdo->prepare("SELECT id, food_name, calories, protein, fat, carbs, fiber, log_date FROM history WHERE user_id = ? AND log_date >= date('now', '-30 days') ORDER BY log_date DESC, id DESC");
        $stmt->execute([$user_id]);
        $history = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Raqamli qiymatlarni float ga o'tkazish
        foreach ($history as &$item) {
             $item['calories'] = (float)$item['calories'];
             $item['protein'] = (float)$item['protein'];
             $item['fat'] = (float)$item['fat'];
             $item['carbs'] = (float)$item['carbs'];
             $item['fiber'] = (float)$item['fiber'];
        }
        
        echo json_encode(['success' => true, 'history' => $history]);
        break;
        
    case 'clear_history':
        // Xavfsiz o'chirish
        $stmt = $pdo->prepare("DELETE FROM history WHERE user_id = ?");
        $stmt->execute([$user_id]);
        
        echo json_encode(['success' => true, 'message' => '✅ Tarix muvaffaqiyatli tozalandi.']);
        break;
        
    default: 
        http_response_code(400); 
        echo json_encode(['success' => false, 'message' => 'Notoʻgʻri amal: ' . $action]);
        break;
}
?>