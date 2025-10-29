<?php
require_once '../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit();
}

try {
    $conn = getDBConnection();
    
    // Obtener filtro de categoría si existe
    $category = isset($_GET['category']) ? sanitizeInput($_GET['category']) : null;
    
    if ($category && $category !== 'all') {
        $stmt = $conn->prepare("SELECT id, name, description, price, image, category, stock FROM products WHERE category = ? ORDER BY created_at DESC");
        $stmt->execute([$category]);
    } else {
        $stmt = $conn->query("SELECT id, name, description, price, image, category, stock FROM products ORDER BY created_at DESC");
    }
    
    $products = $stmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'products' => $products
    ]);
    
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al obtener productos']);
}