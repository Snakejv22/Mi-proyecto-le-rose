<?php
require_once '../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit();
}

if (!isLoggedIn()) {
    echo json_encode(['success' => true, 'items' => [], 'total' => 0]);
    exit();
}

try {
    $conn = getDBConnection();
    $userId = getCurrentUserId();
    
    $stmt = $conn->prepare("
        SELECT 
            c.id as cart_id,
            c.quantity,
            p.id as product_id,
            p.name,
            p.description,
            p.price,
            p.image,
            (c.quantity * p.price) as subtotal
        FROM cart c
        INNER JOIN products p ON c.product_id = p.id
        WHERE c.user_id = ?
        ORDER BY c.added_at DESC
    ");
    $stmt->execute([$userId]);
    $items = $stmt->fetchAll();
    
    $total = 0;
    foreach ($items as $item) {
        $total += $item['subtotal'];
    }
    
    echo json_encode([
        'success' => true,
        'items' => $items,
        'total' => number_format($total, 2, '.', '')
    ]);
    
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al obtener carrito']);
}