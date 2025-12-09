<?php
// api/auth.php - TO'LIQ ISHLAYDIGAN VERSIYA (USERNAME ORQALI)

header('Content-Type: application/json');

try {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';
    $db_file = '../db/app.sqlite3';
    
    // DB katalogini yaratish
    if (!file_exists(dirname($db_file))) { mkdir(dirname($db_file), 0777, true); }
    
    $pdo = new PDO('sqlite:' . $db_file);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    switch ($action) {
        case 'register':
            $username = strtolower(trim($input['username'] ?? ''));
            $password = trim($input['password'] ?? '');
            
            if (empty($username) || empty($password)) { echo json_encode(['success' => false, 'message' => 'Foydalanuvchi nomi va parol majburiy!']); exit; }
            if (strlen($password) < 6) { echo json_encode(['success' => false, 'message' => 'Parol kamida 6 belgidan iborat boʻlishi kerak.']); exit; }

            $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
            $stmt->execute([$username]);
            if ($stmt->fetch()) { echo json_encode(['success' => false, 'message' => 'Bu foydalanuvchi nomi allaqachon band qilingan.']); exit; }

            $passwordHash = password_hash($password, PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)");
            $stmt->execute([$username, $passwordHash]);
            $user_id = $pdo->lastInsertId();
            
            // Ro'yxatdan o'tgandan so'ng darhol kirish ma'lumotlarini qaytarish
            echo json_encode(['success' => true, 'message' => '✅ Roʻyxatdan muvaffaqiyatli oʻtdingiz!', 'user' => ['id' => $user_id, 'username' => $username]]);
            break;

        case 'login':
            $username = strtolower(trim($input['username'] ?? ''));
            $password = trim($input['password'] ?? '');

            if (empty($username) || empty($password)) { echo json_encode(['success' => false, 'message' => 'Foydalanuvchi nomi yoki parol boʻsh boʻlmasligi kerak.']); exit; }

            $stmt = $pdo->prepare("SELECT id, username, password_hash FROM users WHERE username = ?");
            $stmt->execute([$username]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$user || !password_verify($password, $user['password_hash'])) {
                echo json_encode(['success' => false, 'message' => 'Notoʻgʻri foydalanuvchi nomi yoki parol.']);
                exit;
            }
            
            echo json_encode(['success' => true, 'message' => '✅ Muvaffaqiyatli kirdingiz!', 'user' => ['id' => $user['id'], 'username' => $user['username']]]);
            break;
            
        case 'get_user_info':
            $user_id = $input['user_id'] ?? null;
            if (!$user_id) { http_response_code(401); echo json_encode(['success' => false, 'message' => 'Avtorizatsiya xatosi.']); exit; }
            
            $stmt = $pdo->prepare("SELECT username FROM users WHERE id = ?");
            $stmt->execute([$user_id]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$user) { http_response_code(404); echo json_encode(['success' => false, 'message' => 'Foydalanuvchi topilmadi.']); exit; }
            
            echo json_encode(['success' => true, 'user' => $user]);
            break;

        case 'change_password':
            $user_id = $input['user_id'] ?? null;
            $current_password = trim($input['current_password'] ?? '');
            $new_password = trim($input['new_password'] ?? '');
            
            if (!$user_id) { http_response_code(401); echo json_encode(['success' => false, 'message' => 'Avtorizatsiya xatosi.']); exit; }
            if (strlen($new_password) < 6) { echo json_encode(['success' => false, 'message' => 'Yangi parol kamida 6 belgidan iborat boʻlishi kerak.']); exit; }

            $stmt = $pdo->prepare("SELECT password_hash FROM users WHERE id = ?");
            $stmt->execute([$user_id]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$user) { http_response_code(404); echo json_encode(['success' => false, 'message' => 'Foydalanuvchi topilmadi.']); exit; }
            if (!password_verify($current_password, $user['password_hash'])) { echo json_encode(['success' => false, 'message' => 'Joriy parol notoʻgʻri kiritilgan.']); exit; }

            $newPasswordHash = password_hash($new_password, PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
            $stmt->execute([$newPasswordHash, $user_id]);

            echo json_encode(['success' => true, 'message' => '✅ Parolingiz muvaffaqiyatli almashtirildi!']);
            break;
            
        default: 
            http_response_code(400); 
            echo json_encode(['success' => false, 'message' => 'Notoʻgʻri amal: ' . $action]);
            break;
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => "DB xatosi: " . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => "Kutilmagan xato: " . $e->getMessage()]);
}