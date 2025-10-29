import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useApp } from '../context/AppContext';
import { API_URL, CATEGORIES } from '../config';

const Products = ({ onShowAuth }) => {
  const { user, addToCart } = useApp();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState({});

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
      } else {
        toast.error('Error al cargar productos');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;
    
    // Filtrar por categoría
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
    
    // Filtrar por búsqueda
    if (searchTerm.trim()) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredProducts(filtered);
  };

  const handleAddToCart = async (productId) => {
    if (!user) {
      onShowAuth();
      return;
    }

    setAddingToCart(prev => ({ ...prev, [productId]: true }));
    await addToCart(productId);
    setAddingToCart(prev => ({ ...prev, [productId]: false }));
  };

  if (loading) {
    return (
      <section id="products" className="py-5">
        <div className="container">
          <div className="spinner-container">
            <div className="spinner"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="products" className="py-5">
      <div className="container">
        <div className="text-center mb-5 fade-in-up">
          <h2 className="display-5 mb-3">Nuestro Catálogo</h2>
          <p className="lead text-muted">
            Explora nuestra colección de flores y arreglos florales
          </p>
        </div>

        {/* Buscador */}
        <div className="row justify-content-center mb-4">
          <div className="col-lg-6">
            <div className="input-group input-group-lg">
              <span className="input-group-text bg-white">
                <i className="fas fa-search text-primary"></i>
              </span>
              <input 
                type="text"
                className="form-control"
                placeholder="Buscar flores, ramos, arreglos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  className="btn btn-outline-secondary"
                  onClick={() => setSearchTerm('')}
                  title="Limpiar búsqueda"
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Contador de resultados */}
        {searchTerm && (
          <div className="text-center mb-3">
            <small className="text-muted">
              {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''}
              {searchTerm && ` para "${searchTerm}"`}
            </small>
          </div>
        )}

        {/* Filtros de Categoría */}
        <div className="d-flex justify-content-center flex-wrap gap-2 mb-5">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className={`btn ${selectedCategory === cat.id ? 'btn-primary' : 'btn-outline-primary'} rounded-pill`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Grid de Productos */}
        <div className="row g-4">
          {filteredProducts.length === 0 ? (
            <div className="col-12 text-center py-5">
              <i className="fas fa-search" style={{fontSize: '4rem', color: '#ddd', marginBottom: '1rem'}}></i>
              <p className="text-muted">
                {searchTerm 
                  ? `No se encontraron productos para "${searchTerm}"` 
                  : 'No hay productos en esta categoría'}
              </p>
              {searchTerm && (
                <button 
                  className="btn btn-primary-custom mt-3"
                  onClick={() => setSearchTerm('')}
                >
                  Limpiar búsqueda
                </button>
              )}
            </div>
          ) : (
            filteredProducts.map((product, index) => (
              <div 
                key={product.id} 
                className="col-md-6 col-lg-4 fade-in-up"
                style={{animationDelay: `${index * 0.1}s`}}
              >
                <div className="product-card">
                  <div style={{position: 'relative', overflow: 'hidden'}}>
                    <img 
                      src={product.image 
                        ? `/images/products/${product.image}` 
                        : "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400"
                      }
                      alt={product.name}
                      className="product-image"
                      onError={(e) => {
                        e.target.src = "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400";
                      }}
                    />
                  </div>
                  
                  <div className="p-3">
                    {/* Badges */}
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <span className="badge bg-primary">{product.category}</span>
                      
                      {/* Indicador de Stock */}
                      {product.stock < 10 && product.stock > 0 && (
                        <span className="badge bg-warning text-dark">
                          <i className="fas fa-exclamation-triangle me-1"></i>
                          Últimas {product.stock}
                        </span>
                      )}
                      
                      {product.stock === 0 && (
                        <span className="badge bg-danger">
                          <i className="fas fa-times-circle me-1"></i>
                          Agotado
                        </span>
                      )}
                    </div>

                    <h5 className="mb-2">{product.name}</h5>
                    
                    <p 
                      className="text-muted small mb-3" 
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                      title={product.description}
                    >
                      {product.description}
                    </p>
                    
                    <h4 className="text-primary mb-3">
                      S/ {parseFloat(product.price).toFixed(2)}
                    </h4>
                    
                    <button 
                      className="btn-add-cart"
                      onClick={() => handleAddToCart(product.id)}
                      disabled={addingToCart[product.id] || product.stock === 0}
                    >
                      {addingToCart[product.id] ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Agregando...
                        </>
                      ) : product.stock === 0 ? (
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
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default Products;