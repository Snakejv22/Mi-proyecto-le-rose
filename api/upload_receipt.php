<?php
require_once '../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit();
}

if (!isLoggedIn()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Debes iniciar sesión']);
    exit();
}

$orderId = intval($_POST['orderId'] ?? 0);

if ($orderId <= 0) {
    echo json_encode(['success' => false, 'message' => 'ID de orden inválido']);
    exit();
}

// Verificar que se envió un archivo
if (!isset($_FILES['receipt']) || $_FILES['receipt']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['success' => false, 'message' => 'No se recibió ningún archivo o hubo un error']);
    exit();
}

$file = $_FILES['receipt'];
$allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
$maxSize = 5 * 1024 * 1024; // 5MB

// Validar tipo de archivo
if (!in_array($file['type'], $allowedTypes)) {
    echo json_encode(['success' => false, 'message' => 'Solo se permiten imágenes (JPG, PNG, WEBP)']);
    exit();
}

// Validar tamaño
if ($file['size'] > $maxSize) {
    echo json_encode(['success' => false, 'message' => 'El archivo es demasiado grande (máximo 5MB)']);
    exit();
}

try {
    $conn = getDBConnection();
    $userId = getCurrentUserId();
    
    // Verificar que la orden pertenece al usuario
    $stmt = $conn->prepare("SELECT id, status FROM orders WHERE id = ? AND user_id = ?");
    $stmt->execute([$orderId, $userId]);
    $order = $stmt->fetch();
    
    if (!$order) {
        echo json_encode(['success' => false, 'message' => 'Orden no encontrada']);
        exit();
    }
    
    // Crear directorio si no existe
    $uploadDir = '../uploads/receipts/';
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }
    
    // Generar nombre único para el archivo
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = 'receipt_' . $orderId . '_' . time() . '.' . $extension;
    $filepath = $uploadDir . $filename;
    
    // Mover archivo
    if (!move_uploaded_file($file['tmp_name'], $filepath)) {
        echo json_encode(['success' => false, 'message' => 'Error al guardar el archivo']);
        exit();
    }
    
    // Actualizar orden con la ruta del comprobante
    $stmt = $conn->prepare("UPDATE orders SET receipt_image = ?, status = 'processing' WHERE id = ?");
    $stmt->execute([$filename, $orderId]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Comprobante subido exitosamente',
        'filename' => $filename
    ]);
    
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al procesar el comprobante']);
}