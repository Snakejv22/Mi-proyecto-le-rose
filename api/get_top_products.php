<?php
require_once '../config.php';

// Solo permitir método GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit();
}

// Solo para administradores
if (!isLoggedIn() || !isAdmin()) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Acceso no autorizado']);
    exit();
}

try {
    $conn = getDBConnection();

    // Consulta para obtener los 5 productos más vendidos por cantidad
    $stmt = $conn->query("
        SELECT
            p.id,
            p.name,
            p.category,
            p.price,
            p.image,
            SUM(oi.quantity) as total_sold
        FROM order_items oi
        INNER JOIN products p ON oi.product_id = p.id
        -- Opcional: Podrías filtrar por estado de orden si quieres contar solo ventas completadas
        -- INNER JOIN orders o ON oi.order_id = o.id WHERE o.status = 'completed'
        GROUP BY p.id, p.name, p.category, p.price, p.image
        ORDER BY total_sold DESC
        LIMIT 5
    ");

    $topProducts = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'topProducts' => $topProducts
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    // Loguear error $e->getMessage() en un entorno de producción
    echo json_encode(['success' => false, 'message' => 'Error al obtener los productos más vendidos']);
}
?>