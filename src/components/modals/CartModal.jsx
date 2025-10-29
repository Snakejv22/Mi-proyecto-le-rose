import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useApp } from '../../context/AppContext';
import { API_URL } from '../../config';

const CartModal = ({ show, onHide, onCheckout }) => {
  const { loadCartCount } = useApp();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (show) {
      loadCart();
    }
  }, [show]);

  const loadCart = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/get_cart.php`, {
        withCredentials: true
      });
      
      if (response.data.success) {
        setCartItems(response.data.items);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      toast.error('Error al cargar el carrito');
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (cartId) => {
    try {
      const response = await axios.delete(`${API_URL}/remove_from_cart.php`, {
        data: { cartId },
        withCredentials: true
      });
      
      if (response.data.success) {
        toast.success('Producto eliminado');
        loadCart();
        loadCartCount();
      }
    } catch (error) {
      toast.error('Error al eliminar producto');
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + parseFloat(item.subtotal), 0).toFixed(2);
  };

  if (!show) return null;

  return (
    <>
      <div className="modal fade show modal-custom" style={{display: 'block'}} tabIndex="-1">
        <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="fas fa-shopping-cart me-2"></i>
                Mi Carrito
              </h5>
              <button type="button" className="btn-close btn-close-white" onClick={onHide}></button>
            </div>
            <div className="modal-body">
              {loading ? (
                <div className="spinner-container">
                  <div className="spinner"></div>
                </div>
              ) : cartItems.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-shopping-cart" style={{fontSize: '4rem', color: '#ddd', marginBottom: '1rem'}}></i>
                  <p className="text-muted mb-0">Tu carrito está vacío</p>
                </div>
              ) : (
                <>
                  {cartItems.map(item => (
                    <div key={item.cart_id} className="d-flex align-items-center mb-3 pb-3 border-bottom">
                      <img 
                        src="https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=100" 
                        alt={item.name}
                        style={{width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px'}}
                      />
                      <div className="flex-grow-1 ms-3">
                        <h6 className="mb-1">{item.name}</h6>
                        <p className="text-muted small mb-1">Cantidad: {item.quantity}</p>
                        <p className="text-primary fw-bold mb-0">S/ {parseFloat(item.subtotal).toFixed(2)}</p>
                      </div>
                      <button 
                        className="btn btn-sm btn-danger"
                        onClick={() => removeItem(item.cart_id)}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  ))}
                  
                  <div className="mt-4 pt-3 border-top">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="mb-0">Total:</h5>
                      <h4 className="mb-0 text-primary">S/ {calculateTotal()}</h4>
                    </div>
                    <button 
                      className="btn btn-primary-custom w-100"
                      onClick={() => {
                        onHide();
                        onCheckout();
                      }}
                    >
                      <i className="fas fa-credit-card me-2"></i>
                      Proceder al Pago
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </>
  );
};

export default CartModal;