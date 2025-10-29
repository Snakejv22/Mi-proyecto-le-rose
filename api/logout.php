<?php
require_once '../config.php';

// Destruir sesión
session_destroy();
session_start();

echo json_encode([
    'success' => true,
    'message' => 'Sesión cerrada exitosamente'
]);