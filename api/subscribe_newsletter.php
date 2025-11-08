<?php
require_once '../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit();
}

// Obtener datos del POST
$data = json_decode(file_get_contents('php://input'), true);
$email = sanitizeInput($data['email'] ?? '');

// Validaciones
if (empty($email)) {
    echo json_encode(['success' => false, 'message' => 'El correo electrónico es requerido']);
    exit();
}

if (!isValidEmail($email)) {
    echo json_encode(['success' => false, 'message' => 'Formato de correo electrónico inválido']);
    exit();
}

try {
    $conn = getDBConnection();
    
    // Verificar si el email ya existe
    $stmt = $conn->prepare("SELECT id, is_active FROM newsletter_subscribers WHERE email = ?");
    $stmt->execute([$email]);
    $existing = $stmt->fetch();
    
    if ($existing) {
        if ($existing['is_active']) {
            echo json_encode(['success' => false, 'message' => 'Este correo electrónico ya está suscrito']);
        } else {
            // Reactivar suscripción
            $stmt = $conn->prepare("UPDATE newsletter_subscribers SET is_active = 1, subscription_date = CURRENT_TIMESTAMP WHERE email = ?");
            $stmt->execute([$email]);
            echo json_encode(['success' => true, 'message' => '¡Gracias por suscribirte a nuestro boletín!']);
        }
    } else {
        // Insertar nuevo suscriptor
        $stmt = $conn->prepare("INSERT INTO newsletter_subscribers (email) VALUES (?)");
        $stmt->execute([$email]);
        echo json_encode(['success' => true, 'message' => '¡Gracias por suscribirte a nuestro boletín!']);
    }
    
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al procesar la suscripción. Por favor, intenta más tarde.']);
}

