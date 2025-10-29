<?php
require_once '../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit();
}

if (!isLoggedIn()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Debes iniciar sesión']);
    exit();
}

try {
    $conn = getDBConnection();
    $userId = getCurrentUserId();
    
    // Si es admin, obtener todas las órdenes, sino solo las del usuario
    if (isAdmin()) {
        $stmt = $conn->query("
            SELECT 
                o.id,
                o.total,
                o.status,
                o.receipt_image,
                o.delivery_address,
                o.notes,
                o.created_at,
                u.full_name as customer_name,
                u.email as customer_email,
                u.phone as customer_phone
            FROM orders o
            INNER JOIN users u ON o.user_id = u.id
            ORDER BY o.created_at DESC
        ");
    } else {
        $stmt = $conn->prepare("
            SELECT 
                o.id,
                o.total,
                o.status,
                o.receipt_image,
                o.delivery_address,
                o.notes,
                o.created_at
            FROM orders o
            WHERE o.user_id = ?
            ORDER BY o.created_at DESC
        ");
        $stmt->execute([$userId]);
    }
    
    $orders = $stmt->fetchAll();
    
    // Obtener items de cada orden
    foreach ($orders as &$order) {
        $stmt = $conn->prepare("
            SELECT 
                oi.quantity,
                oi.price,
                p.name,
                p.image
            FROM order_items oi
            INNER JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ?
        ");
        $stmt->execute([$order['id']]);
        $order['items'] = $stmt->fetchAll();
    }
    
    echo json_encode([
        'success' => true,
        'orders' => $orders,
        'isAdmin' => isAdmin()
    ]);
    
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al obtener pedidos']);
}