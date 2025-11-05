<?php

/**

 * API para eliminar un producto

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

 

// Obtener ID del producto

$data = json_decode(file_get_contents('php://input'), true);

$id = $data['id'] ?? 0;

 

// Validaciones

if (empty($id) || !is_numeric($id)) {

    echo json_encode(['success' => false, 'message' => 'ID de producto inválido']);

    exit();

}

 

try {

    $conn = getDBConnection();

 

    // Verificar que el producto existe

    $stmt = $conn->prepare("SELECT id, name FROM products WHERE id = ?");

    $stmt->execute([$id]);

    $product = $stmt->fetch();

 

    if (!$product) {

        echo json_encode(['success' => false, 'message' => 'Producto no encontrado']);

        exit();

    }

 

    // Verificar si el producto está en carritos activos

    $stmt = $conn->prepare("SELECT COUNT(*) as count FROM cart WHERE product_id = ?");

    $stmt->execute([$id]);

    $cartCount = $stmt->fetch()['count'];

 

    if ($cartCount > 0) {

        echo json_encode([

            'success' => false,

            'message' => 'No se puede eliminar: El producto está en ' . $cartCount . ' carrito(s) activo(s)'

        ]);

        exit();

    }

 

    // Verificar si el producto está en pedidos (aunque estén en order_items, permitimos eliminar el producto)

    // Solo borramos el producto, los order_items mantienen la referencia histórica

 

    // Eliminar producto

    $stmt = $conn->prepare("DELETE FROM products WHERE id = ?");

    $stmt->execute([$id]);

 

    echo json_encode([

        'success' => true,

        'message' => 'Producto "' . $product['name'] . '" eliminado exitosamente'

    ]);

 

} catch(PDOException $e) {

    http_response_code(500);

    echo json_encode([

        'success' => false,

        'message' => 'Error al eliminar el producto: ' . $e->getMessage()

    ]);

}