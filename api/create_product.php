<?php
/**
 * API para crear un nuevo producto
 * Solo accesible para administradores
 */
require_once '../config.php';

// Verificar método POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit();
}

// Verificar autenticación
if (!isLoggedIn()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Debes iniciar sesión']);
    exit();
}

// Verificar permisos de administrador
if (!isAdmin()) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'No tienes permisos de administrador']);
    exit();
}

// Obtener datos del producto
$data = json_decode(file_get_contents('php://input'), true);

$name = sanitizeInput($data['name'] ?? '');
$description = sanitizeInput($data['description'] ?? '');
$price = $data['price'] ?? 0;
$category = sanitizeInput($data['category'] ?? 'ramos');
$stock = $data['stock'] ?? 0;
$image = sanitizeInput($data['image'] ?? '');

// Validaciones
if (empty($name)) {
    echo json_encode(['success' => false, 'message' => 'El nombre del producto es requerido']);
    exit();
}

if (empty($description)) {
    echo json_encode(['success' => false, 'message' => 'La descripción es requerida']);
    exit();
}

if (!is_numeric($price) || $price <= 0) {
    echo json_encode(['success' => false, 'message' => 'El precio debe ser un número mayor a 0']);
    exit();
}

if (!is_numeric($stock) || $stock < 0) {
    echo json_encode(['success' => false, 'message' => 'El stock debe ser un número no negativo']);
    exit();
}

// Validar categoría
$valid_categories = ['ramos', 'arreglos', 'plantas', 'premium', 'packs'];
if (!in_array($category, $valid_categories)) {
    echo json_encode(['success' => false, 'message' => 'Categoría inválida']);
    exit();
}

try {
    $conn = getDBConnection();

    // Insertar producto
    $stmt = $conn->prepare("
        INSERT INTO products (name, description, price, category, stock, image, created_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW())
    ");

    $stmt->execute([
        $name,
        $description,
        $price,
        $category,
        $stock,
        $image
    ]);

    $productId = $conn->lastInsertId();

    echo json_encode([
        'success' => true,
        'message' => 'Producto creado exitosamente',
        'productId' => $productId
    ]);

} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al crear el producto: ' . $e->getMessage()
    ]);
}
