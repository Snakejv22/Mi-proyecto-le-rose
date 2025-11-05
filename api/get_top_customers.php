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

    // Consulta para obtener los 5 clientes con más pedidos y su gasto total
    $stmt = $conn->query("
        SELECT
            u.id,
            u.full_name,
            u.email,
            COUNT(o.id) as total_orders,
            SUM(o.total) as total_spent
        FROM orders o
        INNER JOIN users u ON o.user_id = u.id
        -- Opcional: Podrías filtrar por estado de orden si quieres contar solo pedidos completados
        -- WHERE o.status = 'completed'
        GROUP BY u.id, u.full_name, u.email
        ORDER BY total_orders DESC, total_spent DESC -- Ordenar primero por pedidos, luego por gasto
        LIMIT 5
    ");

    $topCustomers = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'topCustomers' => $topCustomers
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    // Loguear error $e->getMessage() en un entorno de producción
    echo json_encode(['success' => false, 'message' => 'Error al obtener los clientes frecuentes']);
}
?>