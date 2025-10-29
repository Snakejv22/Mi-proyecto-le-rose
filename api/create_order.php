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

$data = json_decode(file_get_contents('php://input'), true);
$deliveryAddress = sanitizeInput($data['deliveryAddress'] ?? '');
$notes = sanitizeInput($data['notes'] ?? '');

if (empty($deliveryAddress)) {
    echo json_encode(['success' => false, 'message' => 'La dirección de entrega es requerida']);
    exit();
}

try {
    $conn = getDBConnection();
    $userId = getCurrentUserId();
    
    // Obtener items del carrito
    $stmt = $conn->prepare("
        SELECT c.product_id, c.quantity, p.price, p.stock
        FROM cart c
        INNER JOIN products p ON c.product_id = p.id
        WHERE c.user_id = ?
    ");
    $stmt->execute([$userId]);
    $cartItems = $stmt->fetchAll();
    
    if (empty($cartItems)) {
        echo json_encode(['success' => false, 'message' => 'El carrito está vacío']);
        exit();
    }
    
    // Calcular total
    $total = 0;
    foreach ($cartItems as $item) {
        $total += $item['price'] * $item['quantity'];
    }
    
    // Iniciar transacción
    $conn->beginTransaction();
    
    // Crear orden
    $stmt = $conn->prepare("
        INSERT INTO orders (user_id, total, delivery_address, notes, status)
        VALUES (?, ?, ?, ?, 'pending')
    ");
    $stmt->execute([$userId, $total, $deliveryAddress, $notes]);
    $orderId = $conn->lastInsertId();
    
    // Insertar items de la orden
    $stmt = $conn->prepare("
        INSERT INTO order_items (order_id, product_id, quantity, price)
        VALUES (?, ?, ?, ?)
    ");
    
    foreach ($cartItems as $item) {
        $stmt->execute([
            $orderId,
            $item['product_id'],
            $item['quantity'],
            $item['price']
        ]);
    }
    
    // Vaciar carrito
    $stmt = $conn->prepare("DELETE FROM cart WHERE user_id = ?");
    $stmt->execute([$userId]);
    
    // Confirmar transacción
    $conn->commit();
    
    echo json_encode([
        'success' => true,
        'message' => 'Pedido creado exitosamente',
        'orderId' => $orderId,
        'total' => number_format($total, 2, '.', '')
    ]);
    
} catch(PDOException $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al crear el pedido']);
}