-- Base de datos para Le Rose Boutique Floral
CREATE DATABASE IF NOT EXISTS le_rose_boutique CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE le_rose_boutique;

-- Tabla de usuarios
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    is_admin TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla de productos
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image VARCHAR(255),
    category VARCHAR(50),
    stock INT DEFAULT 100,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla del carrito
CREATE TABLE cart (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT DEFAULT 1,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla de pedidos
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    receipt_image VARCHAR(255),
    delivery_address TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla de detalles del pedido
CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insertar usuario administrador por defecto
-- Contraseña: admin123 (hasheada con password_hash)
INSERT INTO users (full_name, email, password, is_admin) 
VALUES ('Administrador', 'admin@lerose.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1);

-- Insertar productos de ejemplo
INSERT INTO products (name, description, price, image, category, stock) VALUES
('Ramo de Rosas Rojas', 'Hermoso ramo de 12 rosas rojas frescas, ideal para expresar amor y pasión', 89.90, 'rosas-rojas.jpg', 'ramos', 50),
('Arreglo Primaveral', 'Colorido arreglo con flores de temporada en canasta artesanal', 120.00, 'arreglo-primaveral.jpg', 'arreglos', 30),
('Orquídeas Blancas', 'Elegante planta de orquídea blanca en maceta decorativa', 150.00, 'orquidea-blanca.jpg', 'plantas', 20),
('Ramo de Girasoles', 'Alegre ramo de 10 girasoles con follaje verde', 75.00, 'girasoles.jpg', 'ramos', 40),
('Caja de Rosas Rosadas', 'Caja premium con 24 rosas rosadas preservadas', 199.00, 'caja-rosas.jpg', 'premium', 15),
('Arreglo Romántico', 'Arreglo con rosas, lisianthus y eucalipto en jarrón de cristal', 135.00, 'arreglo-romantico.jpg', 'arreglos', 25),
('Tulipanes Mixtos', 'Ramo de 15 tulipanes en colores variados', 95.00, 'tulipanes.jpg', 'ramos', 35),
('Pack Celebración', 'Incluye ramo de flores, globo metálico y tarjeta personalizada', 180.00, 'pack-celebracion.jpg', 'packs', 20),
('Lirios Blancos', 'Elegante ramo de 6 lirios blancos aromáticos', 110.00, 'lirios.jpg', 'ramos', 30),
('Suculentas Decorativas', 'Set de 3 suculentas en macetas de cerámica pintadas a mano', 65.00, 'suculentas.jpg', 'plantas', 50),
('Arreglo Corporativo', 'Imponente arreglo floral para oficinas y eventos empresariales', 250.00, 'corporativo.jpg', 'premium', 10),
('Ramo de Gerberas', 'Vibrante ramo de 12 gerberas multicolor', 85.00, 'gerberas.jpg', 'ramos', 45);

-- Tabla de suscriptores al newsletter
CREATE TABLE newsletter_subscribers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    subscription_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Índices para mejorar rendimiento
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_cart_user ON cart(user_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX idx_newsletter_active ON newsletter_subscribers(is_active);