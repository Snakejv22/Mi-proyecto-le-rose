import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useApp } from '../context/AppContext';
import { API_URL, CATEGORIES } from '../config';
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
  const carouselRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

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

  // Carousel Navigation
  const scroll = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = carouselRef.current.offsetWidth * 0.8;
      const newScrollLeft = direction === 'left' 
        ? carouselRef.current.scrollLeft - scrollAmount
        : carouselRef.current.scrollLeft + scrollAmount;
      
      carouselRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  // Touch/Mouse Drag
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - carouselRef.current.offsetLeft);
    setScrollLeft(carouselRef.current.scrollLeft);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    carouselRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
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

  // Get selected category name for display
  const selectedCategoryName = CATEGORIES.find(cat => cat.id === selectedCategory)?.name || 'Todos';

  return (
    <>
      <section id="products" className="products-section">
        <div className="container-fluid px-3 px-lg-5">
          {/* Header */}
          <div className="section-header text-center mb-5">
            <span className="section-eyebrow">Nuestra Colección</span>
            <h2 className="section-title">Catálogo Floral Premium</h2>
            <p className="section-subtitle">
              Descubre nuestra selección de flores frescas y arreglos únicos
            </p>
          </div>

          {/* Search & Filters */}
          <div className="row mb-5">
            <div className="col-lg-8 mx-auto">
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
              <div className="category-filters">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    className={`category-chip ${selectedCategory === cat.id ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    {cat.name}
                    {selectedCategory === cat.id && filteredProducts.length > 0 && (
                      <span className="chip-count">{filteredProducts.length}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Empty State */}
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
            <>
              {/* Single Product Carousel */}
              <div className="carousel-section mb-5">
                <div className="carousel-header">
                  <div>
                    <h3 className="carousel-title">
                      <i className="fas fa-flower me-2"></i>
                      {searchTerm 
                        ? `Resultados de búsqueda: "${searchTerm}"`
                        : selectedCategoryName === 'Todos'
                        ? 'Todos los Productos'
                        : selectedCategoryName
                      }
                    </h3>
                    <p className="carousel-subtitle">
                      {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''} disponible{filteredProducts.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="carousel-nav-buttons d-none d-md-flex">
                    <button 
                      className="carousel-nav-btn prev"
                      onClick={() => scroll('left')}
                      aria-label="Anterior"
                    >
                      <i className="fas fa-chevron-left"></i>
                    </button>
                    <button 
                      className="carousel-nav-btn next"
                      onClick={() => scroll('right')}
                      aria-label="Siguiente"
                    >
                      <i className="fas fa-chevron-right"></i>
                    </button>
                  </div>
                </div>

                <div 
                  className="products-carousel"
                  ref={carouselRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  {filteredProducts.map((product) => (
                    <div 
                      key={product.id} 
                      className="carousel-card"
                      onClick={() => handleViewDetails(product)}
                    >
                      {/* Image */}
                      <div className="carousel-card-image">
                        <img 
                          src={product.image 
                            ? `/images/products/${product.image}` 
                            : "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=600"
                          }
                          alt={product.name}
                          onError={(e) => {
                            e.target.src = "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=600";
                          }}
                        />
                        
                        {/* Quick View Overlay */}
                        <div className="carousel-card-overlay">
                          <button className="btn-quick-view-mini">
                            <i className="fas fa-eye"></i>
                          </button>
                        </div>

                        {/* Stock Badge */}
                        {product.stock < 10 && product.stock > 0 && (
                          <span className="stock-badge warning">
                            ¡Solo {product.stock}!
                          </span>
                        )}
                        {product.stock === 0 && (
                          <span className="stock-badge danger">
                            Agotado
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="carousel-card-body">
                        <h4 className="carousel-card-title">{product.name}</h4>
                        <p className="carousel-card-description">{product.description}</p>
                        
                        <div className="carousel-card-footer">
                          <div className="carousel-card-price">
                            <span className="price-label">Desde</span>
                            <span className="price-value">S/ {parseFloat(product.price).toFixed(2)}</span>
                          </div>
                          
                          <button 
                            className={`btn-add-carousel ${product.stock === 0 ? 'disabled' : ''}`}
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

                {/* Mobile Scroll Indicator */}
                <div className="scroll-indicator d-md-none">
                  <i className="fas fa-hand-point-right"></i>
                  <span>Desliza para ver más</span>
                </div>
              </div>
            </>
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
                    Consultar
                  </a>
                </div>

                <div className="modal-info-cards">
                  <div className="info-card-mini">
                    <i className="fas fa-shield-alt"></i>
                    <div>
                      <strong>Garantía</strong>
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