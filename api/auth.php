<?php
// api/auth.php - TO'LIQ ISHLAYDIGAN VA JSON BAZASIGA O'TKAZILGAN VERSIYA

header('Content-Type: application/json');

// --- JSON YORDAMCHI FUNKSIYALAR ---

$users_file = '../db/users.json';
$db_dir = dirname($users_file);

if (!is_dir($db_dir)) {
    mkdir($db_dir, 0777, true);
}
if (!file_exists($users_file)) {
    file_put_contents($users_file, json_encode([]));
}

function load_users() {
    global $users_file;
    $json_data = file_get_contents($users_file);
    return json_decode($json_data, true) ?? [];
}

function save_users($users) {
    global $users_file;
    file_put_contents($users_file, json_encode($users, JSON_PRETTY_PRINT));
}

// -----------------------------------

$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? '';

try {
    $users = load_users();

    switch ($action) {
        case 'register':
            $username = strtolower(trim($input['username'] ?? ''));
            $password = trim($input['password'] ?? '');
            
            if (empty($username) || empty($password) || strlen($password) < 6) {
                 http_response_code(400); 
                 echo json_encode(['success' => false, 'message' => 'Foydalanuvchi nomi majburiy va parol kamida 6 belgi boʻlishi kerak.']); 
                 exit; 
            }

            // Foydalanuvchi mavjudligini tekshirish
            foreach ($users as $user) {
                if ($user['username'] === $username) {
                    http_response_code(409); // Conflict
                    echo json_encode(['success' => false, 'message' => 'Bu foydalanuvchi nomi band. Boshqasini tanlang.']); 
                    exit; 
                }
            }

            // Yangi ID yaratish (mavjud eng katta ID + 1)
            $new_id = empty($users) ? 1 : max(array_column($users, 'id')) + 1;
            $passwordHash = password_hash($password, PASSWORD_DEFAULT);

            $new_user = [
                'id' => $new_id,
                'username' => $username,
                'password_hash' => $passwordHash,
                'created_at' => date('Y-m-d H:i:s')
            ];

            $users[] = $new_user;
            save_users($users);

            http_response_code(201); // Created
            echo json_encode([
                'success' => true, 
                'message' => '✅ Muvaffaqiyatli roʻyxatdan oʻtdingiz!', 
                'user' => ['id' => $new_id, 'username' => $username]
            ]);
            break;
            
        case 'login':
            $username = strtolower(trim($input['username'] ?? ''));
            $password = trim($input['password'] ?? '');
            
            if (empty($username) || empty($password)) {
                 http_response_code(400); 
                 echo json_encode(['success' => false, 'message' => 'Foydalanuvchi nomi va parol majburiy!']); 
                 exit; 
            }

            $found_user = null;
            foreach ($users as $user) {
                if ($user['username'] === $username) {
                    $found_user = $user;
                    break;
                }
            }

            if ($found_user && password_verify($password, $found_user['password_hash'])) {
                echo json_encode([
                    'success' => true, 
                    'message' => '✅ Tizimga muvaffaqiyatli kirdingiz!', 
                    'user' => ['id' => $found_user['id'], 'username' => $found_user['username']]
                ]);
            } else {
                http_response_code(401); // Unauthorized
                echo json_encode(['success' => false, 'message' => 'Foydalanuvchi nomi yoki parol notoʻgʻri.']);
            }
            break;
            
        case 'change_password':
            $user_id = $input['user_id'] ?? null;
            $current_password = trim($input['current_password'] ?? '');
            $new_password = trim($input['new_password'] ?? '');

            if (!$user_id || empty($current_password) || empty($new_password) || strlen($new_password) < 6) {
                 http_response_code(400); 
                 echo json_encode(['success' => false, 'message' => 'Parol kamida 6 belgidan iborat boʻlishi kerak.']); 
                 exit; 
            }

            $found = false;
            foreach ($users as $key => $user) {
                if ($user['id'] == $user_id) {
                    $found = true;
                    if (!password_verify($current_password, $user['password_hash'])) { 
                        http_response_code(401); 
                        echo json_encode(['success' => false, 'message' => 'Joriy parol notoʻgʻri kiritilgan.']); 
                        exit; 
                    }

                    $newPasswordHash = password_hash($new_password, PASSWORD_DEFAULT);
                    $users[$key]['password_hash'] = $newPasswordHash;
                    save_users($users);

                    echo json_encode(['success' => true, 'message' => '✅ Parolingiz muvaffaqiyatli almashtirildi!']);
                    exit;
                }
            }

            if (!$found) { 
                http_response_code(404); 
                echo json_encode(['success' => false, 'message' => 'Foydalanuvchi topilmadi.']); 
            }
            break;
            
        default: 
            http_response_code(400); 
            echo json_encode(['success' => false, 'message' => 'Notoʻgʻri amal: ' . $action]);
            break;
    }

} catch (Exception $e) {
     http_response_code(500); 
     echo json_encode(['success' => false, 'message' => '❌ Serverda kutilmagan xato roʻy berdi: ' . $e->getMessage()]);
}
?>