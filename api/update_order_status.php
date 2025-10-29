<?php
require_once '../config.php';

// 1. Verificar Método POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit();
}

// 2. Verificar si es Admin
if (!isLoggedIn() || !isAdmin()) {
    http_response_code(403); // Forbidden
    echo json_encode(['success' => false, 'message' => 'Acceso no autorizado']);
    exit();
}

// 3. Obtener y Validar Datos de Entrada
$data = json_decode(file_get_contents('php://input'), true);
$orderId = intval($data['order_id'] ?? 0);
$newStatus = sanitizeInput($data['status'] ?? '');

// Lista de estados válidos (basada en tu config.js y Admin.jsx corregido)
$validStatuses = ['pending', 'processing', 'completed', 'cancelled'];

if ($orderId <= 0) {
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'message' => 'ID de orden inválido']);
    exit();
}

if (empty($newStatus) || !in_array($newStatus, $validStatuses)) {
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'message' => 'Estado inválido proporcionado']);
    exit();
}

// 4. Actualizar en la Base de Datos
try {
    $conn = getDBConnection();

    // Preparar la consulta SQL para actualizar el estado
    $stmt = $conn->prepare("UPDATE orders SET status = ? WHERE id = ?");

    // Ejecutar la consulta con los datos recibidos
    $success = $stmt->execute([$newStatus, $orderId]);

    // 5. Enviar Respuesta
    if ($success && $stmt->rowCount() > 0) {
        // Si se actualizó al menos una fila
        echo json_encode([
            'success' => true,
            'message' => 'Estado del pedido actualizado correctamente a ' . $newStatus
        ]);
    } elseif ($success && $stmt->rowCount() === 0) {
        // Si la consulta se ejecutó pero no encontró la orden (o el estado ya era el mismo)
        http_response_code(404); // Not Found (o podría ser 200 con mensaje específico)
        echo json_encode(['success' => false, 'message' => 'Pedido no encontrado o el estado ya era el mismo']);
    } else {
        // Si hubo un error en la ejecución de la consulta
        http_response_code(500); // Internal Server Error
        echo json_encode(['success' => false, 'message' => 'Error al actualizar el estado en la base de datos']);
    }

} catch (PDOException $e) {
    http_response_code(500); // Internal Server Error
    // En producción, sería mejor loguear el error $e->getMessage() en lugar de mostrarlo
    echo json_encode(['success' => false, 'message' => 'Error de base de datos al actualizar estado']);
}

?>