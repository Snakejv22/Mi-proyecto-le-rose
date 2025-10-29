import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useApp } from '../../context/AppContext';
import { API_URL } from '../../config';

const CheckoutModal = ({ show, onHide, onOrderCreated }) => {
  const { loadCartCount } = useApp();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    deliveryAddress: '',
    notes: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.deliveryAddress.trim()) {
      toast.error('La dirección de entrega es requerida');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/create_order.php`,
        formData,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        toast.success('¡Pedido creado exitosamente!');
        loadCartCount();
        onHide();
        onOrderCreated(response.data.orderId, response.data.total);
        setFormData({ deliveryAddress: '', notes: '' });
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error('Error al crear el pedido');
      console.error('Checkout error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <>
      <div className="modal fade show modal-custom" style={{display: 'block'}} tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="fas fa-clipboard-check me-2"></i>
                Completar Pedido
              </h5>
              <button type="button" className="btn-close btn-close-white" onClick={onHide}></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-bold">
                    <i className="fas fa-map-marker-alt me-2"></i>
                    Dirección de Entrega
                  </label>
                  <textarea 
                    className="form-control" 
                    rows="3"
                    placeholder="Ingresa tu dirección completa..."
                    value={formData.deliveryAddress}
                    onChange={(e) => setFormData({...formData, deliveryAddress: e.target.value})}
                    required
                    disabled={loading}
                  ></textarea>
                  <small className="text-muted">
                    Incluye referencias, número de casa/depto, distrito, etc.
                  </small>
                </div>
                
                <div className="mb-3">
                  <label className="form-label fw-bold">
                    <i className="fas fa-comment me-2"></i>
                    Notas Adicionales (Opcional)
                  </label>
                  <textarea 
                    className="form-control" 
                    rows="2"
                    placeholder="Instrucciones especiales, mensaje para la tarjeta, etc."
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    disabled={loading}
                  ></textarea>
                </div>
                
                <button 
                  type="submit" 
                  className="btn btn-primary-custom w-100"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Procesando...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check-circle me-2"></i>
                      Confirmar Pedido
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </>
  );
};

export default CheckoutModal;