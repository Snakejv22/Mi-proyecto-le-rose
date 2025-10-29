import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom'; // Importar useNavigate
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_URL, ORDER_STATUS, CATEGORIES } from '../config'; // Importar CATEGORIES
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './Admin.css';

const Admin = () => {
  const { user, logout, loading: contextLoading } = useApp(); // Usar loading del contexto
  const navigate = useNavigate(); // Hook para navegación
  const [activeTab, setActiveTab] = useState('dashboard');
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true); // Loading local para carga de datos del panel
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

  // Hook de efecto para seguridad y carga de datos
  useEffect(() => {
    // Solo proceder si el contexto ha terminado de cargar
    if (!contextLoading) {
      if (!user || !user.isAdmin) {
        toast.error('Acceso denegado. Debes ser administrador.');
        navigate('/');
      } else {
        // Si es admin, cargar datos iniciales
        loadData();
      }
    }
  }, [user, contextLoading, navigate]); // Depender de 'user' y 'contextLoading'

  const loadData = async () => {
    setLoading(true); // Iniciar carga local
    try {
      // Cargar pedidos y productos en paralelo
      const [ordersRes, productsRes] = await Promise.all([
        axios.get(`${API_URL}/get_orders.php`, { withCredentials: true }),
        axios.get(`${API_URL}/get_products.php`)
      ]);

      let ordersData = [];
      let productsData = [];

      if (ordersRes.data.success) {
        ordersData = ordersRes.data.orders;
        setOrders(ordersData);
      } else {
        toast.error('Error al cargar pedidos: ' + (ordersRes.data.message || 'Error desconocido'));
      }

      if (productsRes.data.success) {
        productsData = productsRes.data.products;
        setProducts(productsData);
      } else {
        toast.error('Error al cargar productos: ' + (productsRes.data.message || 'Error desconocido'));
      }

      // Calcular estadísticas con los datos frescos
      calculateStats(ordersData, productsData);

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar datos del panel. Revisa la consola.');
    } finally {
      setLoading(false); // Finalizar carga local
    }
  };

  // Función para recargar solo los pedidos
  const loadOrders = async () => {
    try {
      const response = await axios.get(`${API_URL}/get_orders.php`, {
        withCredentials: true
      });
      if (response.data.success) {
        setOrders(response.data.orders);
        calculateStats(response.data.orders, products); // Recalcular con productos existentes
      } else {
         toast.error('Error al recargar pedidos: ' + (response.data.message || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Error al recargar pedidos. Revisa la consola.');
    }
  };

  // Función para recargar solo los productos
  const loadProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/get_products.php`);
      if (response.data.success) {
        setProducts(response.data.products);
        calculateStats(orders, response.data.products); // Recalcular con pedidos existentes
      } else {
        toast.error('Error al recargar productos: ' + (response.data.message || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Error al recargar productos. Revisa la consola.');
    }
  };

  const calculateStats = (ordersData, productsData) => {
    if (!Array.isArray(ordersData) || !Array.isArray(productsData)) return;

    const totalOrders = ordersData.length;
    const pendingOrders = ordersData.filter(o => o.status === 'pending' || o.status === 'processing').length;
    const completedOrders = ordersData.filter(o => o.status === 'completed').length;
    const totalRevenue = ordersData.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);
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

  // --- Gráficos (Datos REALES basados en los pedidos cargados) ---

  const getChartData = () => {
    // Objeto para almacenar pedidos e ingresos por día (últimos 7 días)
    const dailyData = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Establecer a medianoche para comparar fechas

    // Inicializar los últimos 7 días
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dayKey = date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
      dailyData[dayKey] = { name: dayKey, pedidos: 0, ingresos: 0 };
    }

    // Procesar pedidos
    orders.forEach(order => {
      try {
        const orderDate = new Date(order.created_at);
        if (isNaN(orderDate)) return; // Saltar si la fecha no es válida
        orderDate.setHours(0, 0, 0, 0);

        // Calcular diferencia en milisegundos y convertir a días
        const diffTime = today.getTime() - orderDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); // Usar floor para días completos pasados

        // Si el pedido está dentro de los últimos 7 días (0 a 6 días atrás)
        if (diffDays >= 0 && diffDays <= 6) {
          const dayKey = orderDate.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
          if (dailyData[dayKey]) {
            dailyData[dayKey].pedidos += 1;
            dailyData[dayKey].ingresos += parseFloat(order.total || 0);
          }
        }
      } catch (e) {
        console.error("Error procesando fecha de pedido:", order.created_at, e);
      }
    });

     // Convertir el objeto a un array ordenado por fecha
    return Object.values(dailyData).sort((a, b) => {
        try{
            // Convertir '01 Ene' a fecha para ordenar correctamente
             const currentYear = new Date().getFullYear(); // Asegurar el año correcto
             const dateA = new Date(a.name.replace(/ /g,'-') + `-${currentYear}`);
             const dateB = new Date(b.name.replace(/ /g,'-') + `-${currentYear}`);
             // Simple fix si las fechas cruzan el año nuevo (ej. Dic vs Ene)
             if (dateA.getMonth() === 11 && dateB.getMonth() === 0) return -1;
             if (dateA.getMonth() === 0 && dateB.getMonth() === 11) return 1;
             return dateA - dateB;
        } catch(e) {
            console.error("Error sorting daily chart data:", a.name, b.name, e);
            return 0;
        }
    });
  };

  const getMonthlySalesData = () => {
    const monthlyData = {};

    orders.forEach(order => {
      try {
        const orderDate = new Date(order.created_at);
        if (isNaN(orderDate)) return; // Saltar si fecha inválida

        // Formato: 'Ene 2025'
        const monthKey = orderDate.toLocaleDateString('es-PE', { month: 'short', year: 'numeric' });

        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { name: monthKey, pedidos: 0, ingresos: 0 };
        }
        monthlyData[monthKey].pedidos += 1;
        monthlyData[monthKey].ingresos += parseFloat(order.total || 0);
      } catch (e) {
         console.error("Error procesando fecha para gráfico mensual:", order.created_at, e);
      }
    });

     // Convertir el objeto a un array y ordenar por fecha
    return Object.values(monthlyData).sort((a, b) => {
       try {
           // Intenta parsear directamente 'Ene 2025'
           const dateA = new Date(a.name.replace(' ', ' 1, '));
           const dateB = new Date(b.name.replace(' ', ' 1, '));
           return dateA - dateB;
       } catch (e) {
           console.error("Error sorting monthly chart data:", a.name, b.name, e);
           return 0;
       }
    });
  };


  const getCategoryData = () => {
    const categoriesCount = {};
    products.forEach(p => {
      const categoryName = CATEGORIES.find(cat => cat.id === p.category)?.name || p.category; // Usar nombre legible
      categoriesCount[categoryName] = (categoriesCount[categoryName] || 0) + 1;
    });

    return Object.keys(categoriesCount).map(key => ({
      name: key,
      value: categoriesCount[key]
    }));
  };

  const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a'];

  // --- Gestión de Productos ---
  const handleProductSubmit = async (e) => {
    e.preventDefault();

    // Validar campos
    if (!productForm.name || !productForm.description || !productForm.price || !productForm.stock) {
        toast.error('Por favor completa todos los campos obligatorios (*)');
        return;
    }
    if (isNaN(parseFloat(productForm.price)) || parseFloat(productForm.price) <= 0) {
        toast.error('El precio debe ser un número positivo.');
        return;
    }
     if (isNaN(parseInt(productForm.stock)) || parseInt(productForm.stock) < 0) {
        toast.error('El stock debe ser un número entero no negativo.');
        return;
    }

    try {
      // Determinar si es creación o edición
      // ¡ASEGÚRATE DE TENER ESTOS ENDPOINTS EN TU CARPETA API!
      const endpoint = editingProduct
        ? `${API_URL}/update_product.php` // Necesitas crear api/update_product.php
        : `${API_URL}/create_product.php`; // Necesitas crear api/create_product.php

      const payload = {
          ...productForm,
          id: editingProduct ? editingProduct.id : undefined // Enviar ID solo si se está editando
      };

      const response = await axios.post(endpoint, payload, { // Enviar como JSON
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' } // Indicar que es JSON
      });

      if (response.data.success) {
        toast.success(editingProduct ? 'Producto actualizado' : 'Producto creado');
        setShowProductModal(false);
        resetProductForm();
        loadProducts(); // Recargar productos
      } else {
        toast.error(response.data.message || 'Error al guardar producto');
      }
    } catch (error) {
       console.error("Error guardando producto:", error);
      toast.error('Error al guardar producto. Revisa la consola.');
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
    if (!window.confirm('¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer.')) return;

    try {
      // ¡ASEGÚRATE DE TENER ESTE ENDPOINT EN TU CARPETA API!
      const response = await axios.post(`${API_URL}/delete_product.php`, // Necesitas crear api/delete_product.php
        { id: productId },
        {
          withCredentials: true,
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (response.data.success) {
        toast.success('Producto eliminado');
        loadProducts(); // Recargar productos
      } else {
        toast.error(response.data.message || 'Error al eliminar');
      }
    } catch (error) {
      console.error("Error eliminando producto:", error);
      toast.error('Error al eliminar producto. Revisa la consola.');
    }
  };


  const resetProductForm = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      description: '',
      price: '',
      category: CATEGORIES.find(c => c.id !== 'all')?.id || 'ramos', // Valor por defecto válido
      stock: '',
      image: ''
    });
  };

  // --- Gestión de Pedidos ---
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await axios.post(`${API_URL}/update_order_status.php`,
        { order_id: orderId, status: newStatus },
        {
          withCredentials: true,
          headers: { 'Content-Type': 'application/json' } // Especificar JSON
         }
      );

      if (response.data.success) {
        toast.success('Estado actualizado');
        loadOrders(); // Recargar pedidos
        // Actualizar el estado en el modal si está abierto
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({...selectedOrder, status: newStatus});
        }
      } else {
        toast.error(response.data.message || 'Error al actualizar estado');
      }
    } catch (error) {
      console.error("Error actualizando estado:", error);
      // Mostrar mensaje de error más específico si el servidor lo envía
      const errorMsg = error.response?.data?.message || 'Error de conexión al actualizar estado.';
      toast.error(errorMsg);
    }
  };


  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };


  // --- Renderizado ---
  const getStatusBadge = (status) => {
    const statusInfo = ORDER_STATUS[status] || { label: status, color: 'secondary' }; // Fallback
    return <span className={`badge bg-${statusInfo.color} status-badge`}>{statusInfo.label}</span>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha inválida';
    try {
        const date = new Date(dateString);
         if (isNaN(date)) return 'Fecha inválida';
        return date.toLocaleString('es-PE', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
    } catch (e) {
        return 'Fecha inválida';
    }
  };

  // Renderizado del Spinner de carga inicial o si no es admin
  if (contextLoading || loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner"></div>
      </div>
    );
  }

  // Renderizado principal del panel
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
                         {/* Puedes añadir lógica para comparar con datos anteriores si los tienes */}
                        {/* <small className="text-success"><i className="fas fa-arrow-up me-1"></i>+X%</small> */}
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
                         {/* Puedes añadir lógica para comparar con datos anteriores */}
                       {/* <small className="text-success"><i className="fas fa-arrow-up me-1"></i>+Y%</small> */}
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
                         {stats.lowStock > 0 ? (
                            <small className="text-danger">
                            <i className="fas fa-exclamation-triangle me-1"></i>
                            {stats.lowStock} con poco stock
                            </small>
                         ) : (
                            <small className="text-muted">Stock OK</small>
                         )}
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
                    {orders.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={getChartData()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis yAxisId="left" />
                          <YAxis yAxisId="right" orientation="right" />
                          <Tooltip formatter={(value, name) => name === 'ingresos' ? `S/ ${value.toFixed(2)}` : value} />
                          <Legend />
                          <Line yAxisId="left" type="monotone" dataKey="pedidos" stroke="#667eea" strokeWidth={3} name="Pedidos" />
                          <Line yAxisId="right" type="monotone" dataKey="ingresos" stroke="#43e97b" strokeWidth={3} name="Ingresos (S/)" />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (<p className='text-center text-muted'>No hay suficientes datos de pedidos recientes.</p>)}
                  </div>
                </div>

                <div className="col-lg-4">
                  <div className="chart-container">
                    <h5 className="mb-4">
                      <i className="fas fa-chart-pie me-2 text-primary"></i>
                      Productos por Categoría
                    </h5>
                     {products.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={getCategoryData()}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {getCategoryData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => `${value} producto(s)`}/>
                           <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                     ) : (<p className='text-center text-muted'>No hay productos para mostrar categorías.</p>)}
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
                 {orders.length > 0 ? (
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
                            <td className="fw-bold text-success">S/ {parseFloat(order.total || 0).toFixed(2)}</td>
                            <td>{getStatusBadge(order.status)}</td>
                            <td className="text-muted small">{formatDate(order.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  ) : (<p className='text-center text-muted p-3'>Aún no hay pedidos registrados.</p>)}
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
                    {/* Funcionalidad de exportar requiere lógica adicional (ej. librería CSV) */}
                    <button className="btn btn-sm btn-success me-2" disabled>
                      <i className="fas fa-file-excel me-2"></i>
                      Exportar (Próximamente)
                    </button>
                    <button className="btn btn-sm btn-primary" onClick={loadOrders}>
                      <i className="fas fa-sync-alt me-2"></i>
                      Actualizar
                    </button>
                  </div>
                </div>
                <div className="content-card-body">
                 {orders.length > 0 ? (
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
                            <td>{order.customer_name || 'N/A'}</td>
                            <td className="text-muted">{order.customer_email || 'N/A'}</td>
                            <td>{order.customer_phone || 'N/A'}</td>
                            <td className="fw-bold text-success">S/ {parseFloat(order.total || 0).toFixed(2)}</td>
                            <td>{getStatusBadge(order.status)}</td>
                            <td>
                              {order.receipt_image ? (
                                <img
                                  // Asumiendo que 'uploads' está en public o servido estáticamente
                                  src={`/uploads/receipts/${order.receipt_image}`}
                                  alt="Comprobante"
                                  className="receipt-img"
                                  onClick={() => window.open(`/uploads/receipts/${order.receipt_image}`, '_blank')}
                                  onError={(e) => { e.target.style.display='none'; /* Ocultar si hay error */ }}
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
                                title="Ver Detalles"
                              >
                                <i className="fas fa-eye"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  ) : (<p className='text-center text-muted p-3'>No hay pedidos para mostrar.</p>)}
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
                 {products.length > 0 ? (
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
                                src={product.image ? `/images/products/${product.image}` : 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=100'}
                                alt={product.name}
                                className="product-img-thumb"
                                onError={(e) => {
                                  e.target.src = "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=100";
                                }}
                              />
                            </td>
                            <td>
                              <strong>{product.name}</strong>
                              <br />
                              <small className="text-muted" title={product.description}>{product.description?.substring(0, 50)}{product.description?.length > 50 ? '...' : ''}</small>
                            </td>
                            <td>
                               {/* Mostrar nombre legible de categoría */}
                              <span className="badge bg-info">{CATEGORIES.find(c=>c.id === product.category)?.name || product.category}</span>
                            </td>
                            <td className="fw-bold text-success">S/ {parseFloat(product.price || 0).toFixed(2)}</td>
                            <td>
                              <span className={`badge ${product.stock < 10 ? 'bg-warning text-dark' : 'bg-secondary'}`}>
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
                                title="Editar"
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-danger btn-action"
                                onClick={() => handleDeleteProduct(product.id)}
                                title="Eliminar"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  ) : (<p className='text-center text-muted p-3'>No hay productos registrados.</p>)}
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
                     {orders.length > 0 ? (
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={getMonthlySalesData()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis yAxisId="left" />
                          <YAxis yAxisId="right" orientation="right" />
                          <Tooltip formatter={(value, name) => name === 'ingresos' ? `S/ ${value.toFixed(2)}` : value} />
                          <Legend />
                          <Bar yAxisId="left" dataKey="pedidos" fill="#667eea" name="Pedidos"/>
                          <Bar yAxisId="right" dataKey="ingresos" fill="#43e97b" name="Ingresos (S/)"/>
                        </BarChart>
                      </ResponsiveContainer>
                     ) : (<p className='text-center text-muted'>No hay datos suficientes para el análisis mensual.</p>)}
                  </div>
                </div>
              </div>

              <div className="row g-4">
                {/* Lógica de "Más Vendidos" y "Clientes Frecuentes" requiere más datos/backend */}
                <div className="col-lg-6">
                  <div className="content-card">
                    <div className="content-card-header">
                      <h5 className="mb-0">
                        <i className="fas fa-star me-2"></i>
                        Productos Más Vendidos (Ejemplo)
                      </h5>
                    </div>
                    <div className="content-card-body">
                     {products.length > 0 ? (
                      <div className="list-group list-group-flush">
                        {/* Datos simulados, reemplazar con lógica real si es posible */}
                        {[...products].sort(() => 0.5 - Math.random()).slice(0, 5).map((product, index) => (
                          <div key={product.id} className="list-group-item d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center">
                              <div className="rank-badge me-3">{index + 1}</div>
                              <div>
                                <strong>{product.name}</strong>
                                <br />
                                <small className="text-muted">{CATEGORIES.find(c=>c.id === product.category)?.name || product.category}</small>
                              </div>
                            </div>
                            <div className="text-end">
                              <div className="fw-bold text-success">S/ {parseFloat(product.price || 0).toFixed(2)}</div>
                              {/* Ventas simuladas */}
                              <small className="text-muted">{Math.floor(Math.random() * 50) + 5} ventas</small>
                            </div>
                          </div>
                        ))}
                      </div>
                      ) : (<p className='text-center text-muted p-3'>No hay productos.</p>)}
                    </div>
                  </div>
                </div>

                <div className="col-lg-6">
                  <div className="content-card">
                    <div className="content-card-header">
                      <h5 className="mb-0">
                        <i className="fas fa-users me-2"></i>
                        Clientes Frecuentes (Ejemplo)
                      </h5>
                    </div>
                     <div className="content-card-body">
                      {orders.length > 0 ? (
                      <div className="list-group list-group-flush">
                         {/* Datos simulados, requiere agrupar por cliente en backend */}
                        {Object.values(orders.reduce((acc, order) => {
                            acc[order.customer_email] = acc[order.customer_email] || { ...order, count: 0, totalSpent: 0 };
                            acc[order.customer_email].count++;
                            acc[order.customer_email].totalSpent += parseFloat(order.total || 0);
                            return acc;
                        }, {})).sort((a,b) => b.count - a.count).slice(0, 5).map((order, index) => (
                          <div key={order.id + '-' + index} className="list-group-item d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center">
                              <div className="rank-badge me-3">{index + 1}</div>
                              <div>
                                <strong>{order.customer_name || 'N/A'}</strong>
                                <br />
                                <small className="text-muted">{order.customer_email || 'N/A'}</small>
                              </div>
                            </div>
                            <div className="text-end">
                              <div className="fw-bold text-primary">{order.count} pedido(s)</div>
                              <small className="text-muted">S/ {order.totalSpent.toFixed(2)}</small>
                            </div>
                          </div>
                        ))}
                      </div>
                      ) : (<p className='text-center text-muted p-3'>No hay pedidos.</p>)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* --- MODALES --- */}

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
                      {/* Cargar categorías desde config.js, excluyendo 'all' */}
                      {CATEGORIES.filter(cat => cat.id !== 'all').map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Precio (S/) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01" // Precio mínimo
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
                      min="0" // Stock mínimo
                      step="1" // Solo enteros
                      className="form-control"
                      value={productForm.stock}
                      onChange={(e) => setProductForm({...productForm, stock: e.target.value})}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Nombre de Imagen</label>
                    <input
                      type="text"
                      className="form-control"
                      value={productForm.image}
                      onChange={(e) => setProductForm({...productForm, image: e.target.value})}
                      placeholder="ejemplo.jpg"
                    />
                     <small className="text-muted">Solo el nombre (ej. rosas.jpg). Sube la imagen a /public/images/products/</small>
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
                  <div className="info-card h-100"> {/* h-100 para igualar altura */}
                    <h6 className="mb-3">
                      <i className="fas fa-user me-2 text-primary"></i>
                      Información del Cliente
                    </h6>
                    <div className="info-item">
                      <span className="info-label">Nombre:</span>
                      <span className="info-value">{selectedOrder.customer_name || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Email:</span>
                      <span className="info-value">{selectedOrder.customer_email || 'N/A'}</span>
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
                   <div className="info-card h-100"> {/* h-100 para igualar altura */}
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
                        S/ {parseFloat(selectedOrder.total || 0).toFixed(2)}
                      </span>
                    </div>
                    {/* Quitado Método de Pago ya que no está en la API get_orders */}
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
                          style={{maxHeight: '400px', cursor: 'pointer', border: '1px solid #ddd'}}
                          onClick={() => window.open(`/uploads/receipts/${selectedOrder.receipt_image}`, '_blank')}
                           onError={(e) => { e.target.alt='Error al cargar imagen'; e.target.style.display='none';}}
                        />
                        <p className="text-muted small mt-2 mb-0">
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
                    {/* Verificar si hay items */}
                    {selectedOrder.items && selectedOrder.items.length > 0 ? (
                      <div className="table-responsive">
                        <table className="table table-sm mb-0">
                          <thead>
                            <tr>
                              <th>Producto</th>
                              <th className='text-center'>Cantidad</th>
                              <th className='text-end'>Precio Unit.</th>
                              <th className='text-end'>Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedOrder.items.map((item, index) => (
                              <tr key={index}>
                                <td>{item.name}</td>
                                <td className='text-center'>{item.quantity}</td>
                                <td className='text-end'>S/ {parseFloat(item.price || 0).toFixed(2)}</td>
                                <td className="fw-bold text-end">S/ {((item.quantity || 0) * (item.price || 0)).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="table-light">
                              <td colSpan="3" className="text-end fw-bold">TOTAL:</td>
                              <td className="fw-bold text-success text-end">S/ {parseFloat(selectedOrder.total || 0).toFixed(2)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    ) : (
                      <p className="text-muted text-center mb-0">No se encontraron los detalles de los productos para este pedido.</p>
                    )}
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
                      <p className="mb-0 fst-italic">"{selectedOrder.notes}"</p>
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
                    <div className="d-flex gap-2 flex-wrap justify-content-center">
                       {/* Iterar sobre los estados definidos en config.js */}
                       {Object.entries(ORDER_STATUS).map(([statusKey, statusInfo]) => (
                            <button
                                key={statusKey}
                                className={`btn btn-sm btn-${statusInfo.color}`}
                                onClick={() => handleUpdateOrderStatus(selectedOrder.id, statusKey)}
                                // Deshabilitar si es el estado actual o si es completado/cancelado (estados finales)
                                disabled={selectedOrder.status === statusKey || ['completed', 'cancelled'].includes(selectedOrder.status)}
                            >
                                <i className={`fas ${
                                    statusKey === 'pending' ? 'fa-clock' :
                                    statusKey === 'processing' ? 'fa-cog' :
                                    statusKey === 'completed' ? 'fa-check-circle' :
                                    statusKey === 'cancelled' ? 'fa-times-circle' : 'fa-question-circle' // Icono por defecto
                                } me-2`}></i>
                                {statusInfo.label}
                            </button>
                       ))}
                    </div>
                     {/* Mensaje si el pedido ya está en estado final */}
                     {['completed', 'cancelled'].includes(selectedOrder.status) && (
                        <p className='text-muted text-center small mt-3 mb-0'>El pedido ya ha sido {selectedOrder.status === 'completed' ? 'completado' : 'cancelado'} y no se puede cambiar su estado.</p>
                     )}
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