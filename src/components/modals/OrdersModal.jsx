import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_URL, ORDER_STATUS } from '../../config';

const OrdersModal = ({ show, onHide }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (show) {
      loadOrders();
    }
  }, [show]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/get_orders.php`, {
        withCredentials: true
      });
      
      if (response.data.success) {
        setOrders(response.data.orders);
      } else {
        toast.error('Error al cargar pedidos');
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Error al cargar pedidos');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusInfo = ORDER_STATUS[status] || ORDER_STATUS.pending;
    return (
      <span className={`badge bg-${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('es-PE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!show) return null;

  return (
    <>
      <div className="modal fade show modal-custom" style={{display: 'block'}} tabIndex="-1">
        <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="fas fa-box me-2"></i>
                Mis Pedidos
              </h5>
              <button type="button" className="btn-close btn-close-white" onClick={onHide}></button>
            </div>
            <div className="modal-body">
              {loading ? (
                <div className="spinner-container">
                  <div className="spinner"></div>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-box-open" style={{fontSize: '4rem', color: '#ddd', marginBottom: '1rem'}}></i>
                  <p className="text-muted mb-0">No tienes pedidos aún</p>
                </div>
              ) : (
                <div className="row g-4">
                  {orders.map(order => (
                    <div key={order.id} className="col-12">
                      <div className="card">
                        <div className="card-body">
                          <div className="row">
                            <div className="col-md-8">
                              <h6 className="mb-2">
                                <i className="fas fa-hashtag me-1"></i>
                                Pedido #{order.id}
                              </h6>
                              
                              <p className="mb-1">
                                <strong>Total:</strong> 
                                <span className="text-primary ms-2">S/ {parseFloat(order.total).toFixed(2)}</span>
                              </p>
                              
                              <p className="mb-1">
                                <strong>Estado:</strong> 
                                <span className="ms-2">{getStatusBadge(order.status)}</span>
                              </p>
                              
                              <p className="mb-1">
                                <strong>Dirección:</strong> 
                                <span className="text-muted ms-2">{order.delivery_address}</span>
                              </p>
                              
                              {order.notes && (
                                <p className="mb-1">
                                  <strong>Notas:</strong> 
                                  <span className="text-muted ms-2">{order.notes}</span>
                                </p>
                              )}
                              
                              <p className="text-muted small mb-0">
                                <i className="far fa-calendar-alt me-1"></i>
                                {formatDate(order.created_at)}
                              </p>
                            </div>
                            
                            <div className="col-md-4 text-end">
                              {order.receipt_image && (
                                <div>
                                  <p className="small mb-2"><strong>Comprobante:</strong></p>
                                  <img 
                                    src={`uploads/receipts/${order.receipt_image}`} 
                                    alt="Comprobante"
                                    style={{
                                      width: '120px',
                                      borderRadius: '10px',
                                      cursor: 'pointer',
                                      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                                    }}
                                    onClick={() => window.open(`uploads/receipts/${order.receipt_image}`, '_blank')}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {order.items && order.items.length > 0 && (
                            <div className="mt-3 pt-3 border-top">
                              <strong className="d-block mb-2">Productos:</strong>
                              <ul className="list-unstyled mb-0">
                                {order.items.map((item, idx) => (
                                  <li key={idx} className="mb-1 text-muted small">
                                    • {item.name} x{item.quantity} - S/ {parseFloat(item.price).toFixed(2)}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </>
  );
};

export default OrdersModal;