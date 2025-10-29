import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_URL, ORDER_STATUS } from '../config';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './Admin.css';

const Admin = () => {
  const { user, logout } = useApp();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'ramos',
    stock: '',
    image: ''
  });
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    lowStock: 0
  });

  useEffect(() => {
    if (!user || !user.isAdmin) {
      window.location.href = '/';
      return;
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    await Promise.all([loadOrders(), loadProducts()]);
    setLoading(false);
  };

  const loadOrders = async () => {
    try {
      const response = await axios.get(`${API_URL}/get_orders.php`, {
        withCredentials: true
      });
      if (response.data.success) {
        setOrders(response.data.orders);
        calculateStats(response.data.orders, products);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Error al cargar pedidos');
    }
  };

  const loadProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/get_products.php`);
      if (response.data.success) {
        setProducts(response.data.products);
        calculateStats(orders, response.data.products);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Error al cargar productos');
    }
  };

  const calculateStats = (ordersData, productsData) => {
    const totalOrders = ordersData.length;
    const pendingOrders = ordersData.filter(o => o.status === 'pending' || o.status === 'processing').length;
    const completedOrders = ordersData.filter(o => o.status === 'completed').length;
    const totalRevenue = ordersData.reduce((sum, o) => sum + parseFloat(o.total), 0);
    const lowStock = productsData.filter(p => p.stock < 10).length;
    
    setStats({
      totalOrders,
      pendingOrders,
      completedOrders,
      totalRevenue: totalRevenue.toFixed(2),
      totalProducts: productsData.length,
      lowStock
    });
  };

  const getChartData = () => {
    const last7Days = [...Array(7)].map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
    });

    const ordersByDay = last7Days.map(day => ({
      name: day,
      pedidos: Math.floor(Math.random() * 10) + 1,
      ingresos: Math.floor(Math.random() * 500) + 100
    }));

    return ordersByDay;
  };

  const getCategoryData = () => {
    const categories = {};
    products.forEach(p => {
      categories[p.category] = (categories[p.category] || 0) + 1;
    });

    return Object.keys(categories).map(key => ({
      name: key,
      value: categories[key]
    }));
  };

  const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a'];

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const endpoint = editingProduct 
        ? `${API_URL}/update_product.php`
        : `${API_URL}/create_product.php`;
      
      const formData = new FormData();
      Object.keys(productForm).forEach(key => {
        formData.append(key, productForm[key]);
      });
      
      if (editingProduct) {
        formData.append('id', editingProduct.id);
      }

      const response = await axios.post(endpoint, formData, {
        withCredentials: true
      });

      if (response.data.success) {
        toast.success(editingProduct ? 'Producto actualizado' : 'Producto creado');
        setShowProductModal(false);
        resetProductForm();
        loadProducts();
      } else {
        toast.error(response.data.message || 'Error al guardar producto');
      }
    } catch (error) {
      toast.error('Error al guardar producto');
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      stock: product.stock,
      image: product.image || ''
    });
    setShowProductModal(true);
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('¿Estás seguro de eliminar este producto?')) return;
    
    try {
      const response = await axios.post(`${API_URL}/delete_product.php`, 
        { id: productId },
        { withCredentials: true }
      );

      if (response.data.success) {
        toast.success('Producto eliminado');
        loadProducts();
      } else {
        toast.error(response.data.message || 'Error al eliminar');
      }
    } catch (error) {
      toast.error('Error al eliminar producto');
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await axios.post(`${API_URL}/update_order_status.php`, 
        { order_id: orderId, status: newStatus },
        { withCredentials: true }
      );

      if (response.data.success) {
        toast.success('Estado actualizado');
        loadOrders();
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({...selectedOrder, status: newStatus});
        }
      } else {
        toast.error(response.data.message || 'Error al actualizar');
      }
    } catch (error) {
      toast.error('Error al actualizar estado');
    }
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const resetProductForm = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      description: '',
      price: '',
      category: 'ramos',
      stock: '',
      image: ''
    });
  };

  const getStatusBadge = (status) => {
    const statusInfo = ORDER_STATUS[status] || ORDER_STATUS.pending;
    return <span className={`badge bg-${statusInfo.color} status-badge`}>{statusInfo.label}</span>;
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

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner"></div>
      </div>
    );
  }

  return (
    <div className="admin-wrapper">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <h4>
            <i className="fas fa-rose me-2"></i>
            Le Rose Admin
          </h4>
          <p className="small mb-0 mt-2 opacity-75">Panel de Administración</p>
        </div>

        <nav className="admin-nav">
          <div 
            className={`admin-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <i className="fas fa-chart-line"></i>
            Dashboard
          </div>

          <div 
            className={`admin-nav-item ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <i className="fas fa-shopping-bag"></i>
            Pedidos
            {stats.pendingOrders > 0 && (
              <span className="badge bg-danger">{stats.pendingOrders}</span>
            )}
          </div>

          <div 
            className={`admin-nav-item ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <i className="fas fa-box"></i>
            Productos
            {stats.lowStock > 0 && (
              <span className="badge bg-warning text-dark">{stats.lowStock}</span>
            )}
          </div>

          <div 
            className={`admin-nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <i className="fas fa-chart-pie"></i>
            Estadísticas
          </div>

          <hr style={{borderColor: 'rgba(255,255,255,0.1)', margin: '1rem 0'}} />

          <a href="/" className="admin-nav-item">
            <i className="fas fa-home"></i>
            Ir al Sitio
          </a>

          <div className="admin-nav-item" onClick={logout}>
            <i className="fas fa-sign-out-alt"></i>
            Cerrar Sesión
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        {/* Topbar */}
        <div className="admin-topbar">
          <div>
            <h4 className="mb-0">
              {activeTab === 'dashboard' && 'Dashboard'}
              {activeTab === 'orders' && 'Gestión de Pedidos'}
              {activeTab === 'products' && 'Gestión de Productos'}
              {activeTab === 'analytics' && 'Estadísticas y Análisis'}
            </h4>
          </div>
          <div className="d-flex align-items-center gap-3">
            <span className="text-muted">
              <i className="far fa-calendar-alt me-2"></i>
              {new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            <div className="vr"></div>
            <div>
              <i className="fas fa-user-shield me-2"></i>
              <strong>{user?.name}</strong>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="admin-content">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div>
              {/* Stats Cards */}
              <div className="row g-4 mb-4">
                <div className="col-lg-3 col-md-6">
                  <div className="stat-card">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <p className="text-muted mb-1 small">Total Pedidos</p>
                        <h2 className="mb-0 fw-bold">{stats.totalOrders}</h2>
                        <small className="text-success">
                          <i className="fas fa-arrow-up me-1"></i>
                          +12% vs mes anterior
                        </small>
                      </div>
                      <div className="stat-icon blue">
                        <i className="fas fa-shopping-cart"></i>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-lg-3 col-md-6">
                  <div className="stat-card">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <p className="text-muted mb-1 small">Pendientes</p>
                        <h2 className="mb-0 fw-bold">{stats.pendingOrders}</h2>
                        <small className="text-warning">
                          <i className="fas fa-clock me-1"></i>
                          Requieren atención
                        </small>
                      </div>
                      <div className="stat-icon orange">
                        <i className="fas fa-hourglass-half"></i>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-lg-3 col-md-6">
                  <div className="stat-card">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <p className="text-muted mb-1 small">Ingresos Totales</p>
                        <h2 className="mb-0 fw-bold">S/ {stats.totalRevenue}</h2>
                        <small className="text-success">
                          <i className="fas fa-arrow-up me-1"></i>
                          +8% vs mes anterior
                        </small>
                      </div>
                      <div className="stat-icon green">
                        <i className="fas fa-dollar-sign"></i>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-lg-3 col-md-6">
                  <div className="stat-card">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <p className="text-muted mb-1 small">Productos</p>
                        <h2 className="mb-0 fw-bold">{stats.totalProducts}</h2>
                        <small className="text-danger">
                          <i className="fas fa-exclamation-triangle me-1"></i>
                          {stats.lowStock} con poco stock
                        </small>
                      </div>
                      <div className="stat-icon purple">
                        <i className="fas fa-box"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="row g-4 mb-4">
                <div className="col-lg-8">
                  <div className="chart-container">
                    <h5 className="mb-4">
                      <i className="fas fa-chart-line me-2 text-primary"></i>
                      Pedidos e Ingresos (Últimos 7 días)
                    </h5>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={getChartData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="pedidos" stroke="#667eea" strokeWidth={3} />
                        <Line type="monotone" dataKey="ingresos" stroke="#43e97b" strokeWidth={3} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="col-lg-4">
                  <div className="chart-container">
                    <h5 className="mb-4">
                      <i className="fas fa-chart-pie me-2 text-primary"></i>
                      Productos por Categoría
                    </h5>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={getCategoryData()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => entry.name}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {getCategoryData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Recent Orders */}
              <div className="content-card">
                <div className="content-card-header">
                  <h5 className="mb-0">
                    <i className="fas fa-clock me-2"></i>
                    Pedidos Recientes
                  </h5>
                  <button 
                    className="btn btn-sm btn-primary"
                    onClick={() => setActiveTab('orders')}
                  >
                    Ver Todos
                  </button>
                </div>
                <div className="content-card-body">
                  <div className="table-responsive">
                    <table className="table table-custom">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Cliente</th>
                          <th>Total</th>
                          <th>Estado</th>
                          <th>Fecha</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.slice(0, 5).map(order => (
                          <tr key={order.id}>
                            <td className="fw-bold">#{order.id}</td>
                            <td>{order.customer_name}</td>
                            <td className="fw-bold text-success">S/ {parseFloat(order.total).toFixed(2)}</td>
                            <td>{getStatusBadge(order.status)}</td>
                            <td className="text-muted small">{formatDate(order.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div>
              <div className="content-card">
                <div className="content-card-header">
                  <h5 className="mb-0">
                    <i className="fas fa-shopping-bag me-2"></i>
                    Todos los Pedidos ({orders.length})
                  </h5>
                  <div>
                    <button className="btn btn-sm btn-success me-2">
                      <i className="fas fa-file-excel me-2"></i>
                      Exportar
                    </button>
                    <button className="btn btn-sm btn-primary" onClick={loadOrders}>
                      <i className="fas fa-sync-alt me-2"></i>
                      Actualizar
                    </button>
                  </div>
                </div>
                <div className="content-card-body">
                  <div className="table-responsive">
                    <table className="table table-custom">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Cliente</th>
                          <th>Email</th>
                          <th>Teléfono</th>
                          <th>Total</th>
                          <th>Estado</th>
                          <th>Comprobante</th>
                          <th>Fecha</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map(order => (
                          <tr key={order.id}>
                            <td className="fw-bold">#{order.id}</td>
                            <td>{order.customer_name}</td>
                            <td className="text-muted">{order.customer_email}</td>
                            <td>{order.customer_phone || 'N/A'}</td>
                            <td className="fw-bold text-success">S/ {parseFloat(order.total).toFixed(2)}</td>
                            <td>{getStatusBadge(order.status)}</td>
                            <td>
                              {order.receipt_image ? (
                                <img 
                                  src={`/uploads/receipts/${order.receipt_image}`}
                                  alt="Comprobante"
                                  className="receipt-img"
                                  onClick={() => window.open(`/uploads/receipts/${order.receipt_image}`, '_blank')}
                                />
                              ) : (
                                <span className="text-muted small">Sin comprobante</span>
                              )}
                            </td>
                            <td className="text-muted small">{formatDate(order.created_at)}</td>
                            <td>
                              <button 
                                className="btn btn-sm btn-info btn-action"
                                onClick={() => handleViewOrder(order)}
                              >
                                <i className="fas fa-eye"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <div>
              <div className="content-card">
                <div className="content-card-header">
                  <h5 className="mb-0">
                    <i className="fas fa-box me-2"></i>
                    Gestión de Productos ({products.length})
                  </h5>
                  <div>
                    <button 
                      className="btn btn-sm btn-success me-2"
                      onClick={() => {
                        resetProductForm();
                        setShowProductModal(true);
                      }}
                    >
                      <i className="fas fa-plus me-2"></i>
                      Nuevo Producto
                    </button>
                    <button className="btn btn-sm btn-primary" onClick={loadProducts}>
                      <i className="fas fa-sync-alt me-2"></i>
                      Actualizar
                    </button>
                  </div>
                </div>
                <div className="content-card-body">
                  <div className="table-responsive">
                    <table className="table table-custom">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Imagen</th>
                          <th>Nombre</th>
                          <th>Categoría</th>
                          <th>Precio</th>
                          <th>Stock</th>
                          <th>Estado</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map(product => (
                          <tr key={product.id}>
                            <td className="fw-bold">#{product.id}</td>
                            <td>
                              <img 
                                src={product.image ? `/images/products/${product.image}` : '/images/placeholder.jpg'}
                                alt={product.name}
                                className="product-img-thumb"
                              />
                            </td>
                            <td>
                              <strong>{product.name}</strong>
                              <br />
                              <small className="text-muted">{product.description?.substring(0, 50)}...</small>
                            </td>
                            <td>
                              <span className="badge bg-info">{product.category}</span>
                            </td>
                            <td className="fw-bold text-success">S/ {parseFloat(product.price).toFixed(2)}</td>
                            <td>
                              <span className={`badge ${product.stock < 10 ? 'bg-danger' : 'bg-success'}`}>
                                {product.stock} unidades
                              </span>
                            </td>
                            <td>
                              {product.stock > 0 ? (
                                <span className="badge bg-success">Disponible</span>
                              ) : (
                                <span className="badge bg-danger">Agotado</span>
                              )}
                            </td>
                            <td>
                              <button 
                                className="btn btn-sm btn-warning btn-action me-1"
                                onClick={() => handleEditProduct(product)}
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              <button 
                                className="btn btn-sm btn-danger btn-action"
                                onClick={() => handleDeleteProduct(product.id)}
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div>
              <div className="row g-4 mb-4">
                <div className="col-lg-12">
                  <div className="chart-container">
                    <h5 className="mb-4">
                      <i className="fas fa-chart-bar me-2 text-primary"></i>
                      Análisis de Ventas por Mes
                    </h5>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={getChartData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="pedidos" fill="#667eea" />
                        <Bar dataKey="ingresos" fill="#43e97b" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="row g-4">
                <div className="col-lg-6">
                  <div className="content-card">
                    <div className="content-card-header">
                      <h5 className="mb-0">
                        <i className="fas fa-star me-2"></i>
                        Productos Más Vendidos
                      </h5>
                    </div>
                    <div className="content-card-body">
                      <div className="list-group list-group-flush">
                        {products.slice(0, 5).map((product, index) => (
                          <div key={product.id} className="list-group-item d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center">
                              <div className="rank-badge me-3">{index + 1}</div>
                              <div>
                                <strong>{product.name}</strong>
                                <br />
                                <small className="text-muted">{product.category}</small>
                              </div>
                            </div>
                            <div className="text-end">
                              <div className="fw-bold text-success">S/ {parseFloat(product.price).toFixed(2)}</div>
                              <small className="text-muted">{Math.floor(Math.random() * 50)} ventas</small>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-lg-6">
                  <div className="content-card">
                    <div className="content-card-header">
                      <h5 className="mb-0">
                        <i className="fas fa-users me-2"></i>
                        Clientes Frecuentes
                      </h5>
                    </div>
                    <div className="content-card-body">
                      <div className="list-group list-group-flush">
                        {orders.slice(0, 5).map((order, index) => (
                          <div key={order.id} className="list-group-item d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center">
                              <div className="rank-badge me-3">{index + 1}</div>
                              <div>
                                <strong>{order.customer_name}</strong>
                                <br />
                                <small className="text-muted">{order.customer_email}</small>
                              </div>
                            </div>
                            <div className="text-end">
                              <div className="fw-bold text-primary">{Math.floor(Math.random() * 10) + 1} pedidos</div>
                              <small className="text-muted">S/ {(Math.random() * 1000 + 500).toFixed(2)}</small>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal de Producto */}
      {showProductModal && (
        <div className="modal-overlay" onClick={() => setShowProductModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h5 className="mb-0">
                <i className="fas fa-box me-2"></i>
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
              </h5>
              <button 
                className="btn-close-modal"
                onClick={() => setShowProductModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleProductSubmit}>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label">Nombre del Producto *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={productForm.name}
                      onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                      required
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label">Descripción *</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={productForm.description}
                      onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Categoría *</label>
                    <select
                      className="form-select"
                      value={productForm.category}
                      onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                      required
                    >
                      <option value="ramos">Ramos</option>
                      <option value="arreglos">Arreglos</option>
                      <option value="coronas">Coronas</option>
                      <option value="cajas">Cajas</option>
                      <option value="centros">Centros de Mesa</option>
                      <option value="eventos">Para Eventos</option>
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Precio (S/) *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={productForm.price}
                      onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Stock *</label>
                    <input
                      type="number"
                      className="form-control"
                      value={productForm.stock}
                      onChange={(e) => setProductForm({...productForm, stock: e.target.value})}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">URL de Imagen</label>
                    <input
                      type="text"
                      className="form-control"
                      value={productForm.image}
                      onChange={(e) => setProductForm({...productForm, image: e.target.value})}
                      placeholder="ejemplo.jpg"
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowProductModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <i className="fas fa-save me-2"></i>
                  {editingProduct ? 'Actualizar' : 'Crear'} Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Detalle de Pedido */}
      {showOrderModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowOrderModal(false)}>
          <div className="modal-container modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h5 className="mb-0">
                <i className="fas fa-shopping-bag me-2"></i>
                Detalle del Pedido #{selectedOrder.id}
              </h5>
              <button 
                className="btn-close-modal"
                onClick={() => setShowOrderModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="row g-4">
                {/* Información del Cliente */}
                <div className="col-md-6">
                  <div className="info-card">
                    <h6 className="mb-3">
                      <i className="fas fa-user me-2 text-primary"></i>
                      Información del Cliente
                    </h6>
                    <div className="info-item">
                      <span className="info-label">Nombre:</span>
                      <span className="info-value">{selectedOrder.customer_name}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Email:</span>
                      <span className="info-value">{selectedOrder.customer_email}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Teléfono:</span>
                      <span className="info-value">{selectedOrder.customer_phone || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Dirección:</span>
                      <span className="info-value">{selectedOrder.delivery_address || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Información del Pedido */}
                <div className="col-md-6">
                  <div className="info-card">
                    <h6 className="mb-3">
                      <i className="fas fa-info-circle me-2 text-primary"></i>
                      Información del Pedido
                    </h6>
                    <div className="info-item">
                      <span className="info-label">Fecha:</span>
                      <span className="info-value">{formatDate(selectedOrder.created_at)}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Estado:</span>
                      <span className="info-value">{getStatusBadge(selectedOrder.status)}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Total:</span>
                      <span className="info-value fw-bold text-success">
                        S/ {parseFloat(selectedOrder.total).toFixed(2)}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Método de Pago:</span>
                      <span className="info-value">{selectedOrder.payment_method === 'transfer' ? 'Transferencia' : 'Efectivo'}</span>
                    </div>
                  </div>
                </div>

                {/* Comprobante */}
                {selectedOrder.receipt_image && (
                  <div className="col-12">
                    <div className="info-card">
                      <h6 className="mb-3">
                        <i className="fas fa-receipt me-2 text-primary"></i>
                        Comprobante de Pago
                      </h6>
                      <div className="text-center">
                        <img 
                          src={`/uploads/receipts/${selectedOrder.receipt_image}`}
                          alt="Comprobante"
                          className="img-fluid rounded"
                          style={{maxHeight: '400px', cursor: 'pointer'}}
                          onClick={() => window.open(`/uploads/receipts/${selectedOrder.receipt_image}`, '_blank')}
                        />
                        <p className="text-muted small mt-2">
                          <i className="fas fa-search-plus me-1"></i>
                          Click para ver en tamaño completo
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Productos */}
                <div className="col-12">
                  <div className="info-card">
                    <h6 className="mb-3">
                      <i className="fas fa-box me-2 text-primary"></i>
                      Productos del Pedido
                    </h6>
                    <div className="table-responsive">
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            <th>Producto</th>
                            <th>Cantidad</th>
                            <th>Precio Unit.</th>
                            <th>Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedOrder.items && JSON.parse(selectedOrder.items).map((item, index) => (
                            <tr key={index}>
                              <td>{item.name}</td>
                              <td>{item.quantity}</td>
                              <td>S/ {parseFloat(item.price).toFixed(2)}</td>
                              <td className="fw-bold">S/ {(item.quantity * item.price).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="table-active">
                            <td colspan="3" className="text-end fw-bold">TOTAL:</td>
                            <td className="fw-bold text-success">S/ {parseFloat(selectedOrder.total).toFixed(2)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Notas */}
                {selectedOrder.notes && (
                  <div className="col-12">
                    <div className="info-card">
                      <h6 className="mb-3">
                        <i className="fas fa-sticky-note me-2 text-primary"></i>
                        Notas del Cliente
                      </h6>
                      <p className="mb-0">{selectedOrder.notes}</p>
                    </div>
                  </div>
                )}

                {/* Acciones de Estado */}
                <div className="col-12">
                  <div className="info-card">
                    <h6 className="mb-3">
                      <i className="fas fa-tasks me-2 text-primary"></i>
                      Actualizar Estado
                    </h6>
                    <div className="d-flex gap-2 flex-wrap">
                      <button 
                        className="btn btn-warning"
                        onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'pending')}
                        disabled={selectedOrder.status === 'pending'}
                      >
                        <i className="fas fa-clock me-2"></i>
                        Pendiente
                      </button>
                      <button 
                        className="btn btn-info"
                        onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'processing')}
                        disabled={selectedOrder.status === 'processing'}
                      >
                        <i className="fas fa-cog me-2"></i>
                        En Proceso
                      </button>
                      <button 
                        className="btn btn-primary"
                        onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'shipped')}
                        disabled={selectedOrder.status === 'shipped'}
                      >
                        <i className="fas fa-shipping-fast me-2"></i>
                        Enviado
                      </button>
                      <button 
                        className="btn btn-success"
                        onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'completed')}
                        disabled={selectedOrder.status === 'completed'}
                      >
                        <i className="fas fa-check-circle me-2"></i>
                        Completado
                      </button>
                      <button 
                        className="btn btn-danger"
                        onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'cancelled')}
                        disabled={selectedOrder.status === 'cancelled'}
                      >
                        <i className="fas fa-times-circle me-2"></i>
                        Cancelado
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setShowOrderModal(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;