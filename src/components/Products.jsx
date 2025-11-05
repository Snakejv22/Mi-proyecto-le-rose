import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useApp } from '../context/AppContext';
import { API_URL, CATEGORIES } from '../config';

// 🚀 Importación del archivo CSS externo
import './Products.css'; 

const Products = ({ onShowAuth }) => {
  const { user, addToCart } = useApp();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [selectedCategory, products, searchTerm]);

  const loadProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/get_products.php`);
      if (response.data.success) {
        setProducts(response.data.products);
        setFilteredProducts(response.data.products);
      }
    } catch (error) {
      toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
    if (searchTerm.trim()) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredProducts(filtered);
  };

  const handleAddToCart = async (productId, e) => {
    e.stopPropagation();
    if (!user) {
      onShowAuth();
      return;
    }
    setAddingToCart(prev => ({ ...prev, [productId]: true }));
    await addToCart(productId);
    setAddingToCart(prev => ({ ...prev, [productId]: false }));
  };

  const handleViewDetails = (product) => {
    setSelectedProduct(product);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setTimeout(() => setSelectedProduct(null), 300);
  };

  if (loading) {
    return (
      <section id="products" className="products-section">
        <div className="container">
          <div className="spinner-container">
            <div className="spinner"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section id="products" className="products-section">
        <div className="container">
          {/* Header */}
          <div className="section-header text-center mb-5">
            <span className="section-eyebrow">Nuestra Colección</span>
            <h2 className="section-title">Catálogo Floral Premium</h2>
            <p className="section-subtitle">
              Descubre nuestra selección de flores frescas y arreglos únicos
            </p>
          </div>

          {/* Search Bar */}
          <div className="search-bar-container mb-4">
            <div className="search-bar">
              <i className="fas fa-search search-icon"></i>
              <input 
                type="text"
                className="search-input"
                placeholder="Buscar flores, ramos, arreglos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  className="search-clear"
                  onClick={() => setSearchTerm('')}
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
          </div>

          {/* Category Filters */}
          <div className="category-filters mb-5">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                className={`category-chip ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.name}
                {selectedCategory === cat.id && (
                  <span className="chip-count">
                    {filteredProducts.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-search"></i>
              <p>No se encontraron productos</p>
              {searchTerm && (
                <button 
                  className="btn btn-primary-custom"
                  onClick={() => setSearchTerm('')}
                >
                  Limpiar búsqueda
                </button>
              )}
            </div>
          ) : (
            <div className="products-grid">
              {filteredProducts.map((product) => (
                <div 
                  key={product.id} 
                  className="product-card-modern"
                  onClick={() => handleViewDetails(product)}
                >
                  {/* Image Container */}
                  <div className="product-image-container">
                    <img 
                      src={product.image 
                        ? `/images/products/${product.image}` 
                        : "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800"
                      }
                      alt={product.name}
                      className="product-image-modern"
                      onError={(e) => {
                        e.target.src = "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800";
                      }}
                    />
                    
                    {/* Overlay Actions */}
                    <div className="product-overlay">
                      <button 
                        className="btn-quick-view"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(product);
                        }}
                      >
                        <i className="fas fa-eye"></i>
                        Ver Detalles
                      </button>
                    </div>

                    {/* Badges */}
                    <div className="product-badges">
                      <span className="badge-category">
                        {CATEGORIES.find(c => c.id === product.category)?.name}
                      </span>
                      {product.stock < 10 && product.stock > 0 && (
                        <span className="badge-stock warning">
                          ¡Últimas {product.stock}!
                        </span>
                      )}
                      {product.stock === 0 && (
                        <span className="badge-stock danger">
                          Agotado
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="product-info-modern">
                    <h3 className="product-name-modern">{product.name}</h3>
                    <p className="product-description-modern">{product.description}</p>
                    
                    <div className="product-footer-modern">
                      <div className="product-price-modern">
                        <span className="price-label">Desde</span>
                        <span className="price-amount">
                          S/ {parseFloat(product.price).toFixed(2)}
                        </span>
                      </div>
                      
                      <button 
                        className={`btn-add-modern ${product.stock === 0 ? 'disabled' : ''}`}
                        onClick={(e) => handleAddToCart(product.id, e)}
                        disabled={addingToCart[product.id] || product.stock === 0}
                      >
                        {addingToCart[product.id] ? (
                          <span className="spinner-border spinner-border-sm"></span>
                        ) : product.stock === 0 ? (
                          <i className="fas fa-times"></i>
                        ) : (
                          <i className="fas fa-cart-plus"></i>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Product Detail Modal */}
      {showModal && selectedProduct && (
        <div className={`product-modal-overlay ${showModal ? 'show' : ''}`} onClick={closeModal}>
          <div className="product-modal-container" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={closeModal}>
              <i className="fas fa-times"></i>
            </button>

            <div className="modal-content-grid">
              {/* Image Gallery */}
              <div className="modal-image-section">
                <div className="modal-main-image">
                  <img 
                    src={selectedProduct.image 
                      ? `/images/products/${selectedProduct.image}` 
                      : "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800"
                    }
                    alt={selectedProduct.name}
                    onError={(e) => {
                      e.target.src = "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800";
                    }}
                  />
                </div>
                
                {/* Thumbnail Gallery - Simulado */}
                <div className="modal-thumbnails">
                  {[1, 2, 3].map((_, index) => (
                    <div key={index} className="thumbnail-item">
                      <img 
                        src={selectedProduct.image 
                          ? `/images/products/${selectedProduct.image}` 
                          : `https://images.unsplash.com/photo-149075096786${index}-88aa4486c946?w=200`
                        }
                        alt={`Vista ${index + 1}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Product Details */}
              <div className="modal-details-section">
                <div className="modal-header-info">
                  <span className="modal-category-badge">
                    {CATEGORIES.find(c => c.id === selectedProduct.category)?.name}
                  </span>
                  <h2 className="modal-product-title">{selectedProduct.name}</h2>
                </div>

                <div className="modal-price-section">
                  <div className="modal-price-main">
                    S/ {parseFloat(selectedProduct.price).toFixed(2)}
                  </div>
                  <div className="modal-stock-info">
                    {selectedProduct.stock > 10 ? (
                      <span className="stock-available">
                        <i className="fas fa-check-circle"></i> En Stock
                      </span>
                    ) : selectedProduct.stock > 0 ? (
                      <span className="stock-low">
                        <i className="fas fa-exclamation-circle"></i> Últimas {selectedProduct.stock} unidades
                      </span>
                    ) : (
                      <span className="stock-out">
                        <i className="fas fa-times-circle"></i> Agotado
                      </span>
                    )}
                  </div>
                </div>

                <div className="modal-description">
                  <h3>Descripción</h3>
                  <p>{selectedProduct.description}</p>
                </div>

                <div className="modal-features">
                  <h3>Características</h3>
                  <ul>
                    <li><i className="fas fa-flower"></i> Flores frescas de temporada</li>
                    <li><i className="fas fa-leaf"></i> Follaje natural seleccionado</li>
                    <li><i className="fas fa-truck"></i> Entrega el mismo día disponible</li>
                    <li><i className="fas fa-gift"></i> Incluye tarjeta personalizada</li>
                  </ul>
                </div>

                <div className="modal-actions">
                  <button 
                    className="btn-add-to-cart-modal"
                    onClick={(e) => {
                      handleAddToCart(selectedProduct.id, e);
                      if (user) closeModal();
                    }}
                    disabled={addingToCart[selectedProduct.id] || selectedProduct.stock === 0}
                  >
                    {addingToCart[selectedProduct.id] ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Agregando...
                      </>
                    ) : selectedProduct.stock === 0 ? (
                      <>
                        <i className="fas fa-times-circle me-2"></i>
                        Agotado
                      </>
                    ) : (
                      <>
                        <i className="fas fa-cart-plus me-2"></i>
                        Agregar al Carrito
                      </>
                    )}
                  </button>
                  
                  <a 
                    href="https://wa.me/51943123456" 
                    className="btn-whatsapp-modal"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <i className="fab fa-whatsapp me-2"></i>
                    Consultar por WhatsApp
                  </a>
                </div>

                <div className="modal-info-cards">
                  <div className="info-card-mini">
                    <i className="fas fa-shield-alt"></i>
                    <div>
                      <strong>Garantía de Frescura</strong>
                      <span>7 días</span>
                    </div>
                  </div>
                  <div className="info-card-mini">
                    <i className="fas fa-sync-alt"></i>
                    <div>
                      <strong>Cambios</strong>
                      <span>24 horas</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Products;