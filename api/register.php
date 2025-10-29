<?php
require_once '../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit();
}

// Obtener datos del POST
$data = json_decode(file_get_contents('php://input'), true);

$fullName = sanitizeInput($data['fullName'] ?? '');
$email = sanitizeInput($data['email'] ?? '');
$password = $data['password'] ?? '';
$phone = sanitizeInput($data['phone'] ?? '');
$address = sanitizeInput($data['address'] ?? '');

// Validaciones
if (empty($fullName) || empty($email) || empty($password)) {
    echo json_encode(['success' => false, 'message' => 'Todos los campos obligatorios deben completarse']);
    exit();
}

if (!isValidEmail($email)) {
    echo json_encode(['success' => false, 'message' => 'Email inválido']);
    exit();
}

if (strlen($password) < 6) {
    echo json_encode(['success' => false, 'message' => 'La contraseña debe tener al menos 6 caracteres']);
    exit();
}

try {
    $conn = getDBConnection();
    
    // Verificar si el email ya existe
    $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    
    if ($stmt->fetch()) {
        echo json_encode(['success' => false, 'message' => 'El email ya está registrado']);
        exit();
    }
    
    // Hashear contraseña
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    
    // Insertar nuevo usuario
    $stmt = $conn->prepare("INSERT INTO users (full_name, email, password, phone, address) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([$fullName, $email, $hashedPassword, $phone, $address]);
    
    $userId = $conn->lastInsertId();
    
    // Iniciar sesión automáticamente
    $_SESSION['user_id'] = $userId;
    $_SESSION['user_name'] = $fullName;
    $_SESSION['user_email'] = $email;
    $_SESSION['is_admin'] = 0;
    
    echo json_encode([
        'success' => true,
        'message' => 'Registro exitoso',
        'user' => [
            'id' => $userId,
            'name' => $fullName,
            'email' => $email,
            'isAdmin' => false
        ]
    ]);
    
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al registrar usuario']);
}