import { useState, useEffect, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { API_URL, ORDER_STATUS, CATEGORIES } from "../config";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import "./Admin.css";

const Admin = () => {
  const { user, logout, loading: contextLoading } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);

  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "ramos",
    stock: "",
    image: "",
  });

  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    lowStock: 0,
  });

  useEffect(() => {
    if (!contextLoading) {
      if (!user || !user.isAdmin) {
        toast.error("Acceso denegado. Debes ser administrador.");
        navigate("/");
      } else {
        loadData();
      }
    }
  }, [user, contextLoading, navigate]);

  // Carga solo los datos esenciales: pedidos y productos
  const loadData = async () => {
    setLoading(true);
    try {
      const [ordersRes, productsRes] = await Promise.all([
        axios.get(`${API_URL}/get_orders.php`, { withCredentials: true }),
        axios.get(`${API_URL}/get_products.php`),
      ]);

      let ordersData = [];
      let productsData = [];

      if (ordersRes.data.success) {
        ordersData = ordersRes.data.orders;
        setOrders(ordersData);
      } else {
        toast.error(
          "Error al cargar pedidos: " +
            (ordersRes.data.message || "Error desconocido"),
        );
      }

      if (productsRes.data.success) {
        productsData = productsRes.data.products;
        setProducts(productsData);
      } else {
        toast.error(
          "Error al cargar productos: " +
            (productsRes.data.message || "Error desconocido"),
        );
      }

      calculateStats(ordersData, productsData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Error al cargar datos del panel. Revisa la consola.");
      calculateStats([], []); // Resetear stats en caso de error
    } finally {
      setLoading(false);
    }
  };

  // Función para recargar solo los pedidos
  const loadOrders = async () => {
    try {
      const response = await axios.get(`${API_URL}/get_orders.php`, {
        withCredentials: true,
      });
      if (response.data.success) {
        setOrders(response.data.orders);
        calculateStats(response.data.orders, products);
      } else {
        toast.error(
          "Error al recargar pedidos: " +
            (response.data.message || "Error desconocido"),
        );
      }
    } catch (error) {
      console.error("Error reloading orders:", error);
      toast.error("Error al recargar pedidos. Revisa la consola.");
    }
  };

  // Función para recargar solo los productos
  const loadProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/get_products.php`);
      if (response.data.success) {
        setProducts(response.data.products);
        calculateStats(orders, response.data.products);
      } else {
        toast.error(
          "Error al recargar productos: " +
            (response.data.message || "Error desconocido"),
        );
      }
    } catch (error) {
      console.error("Error reloading products:", error);
      toast.error("Error al recargar productos. Revisa la consola.");
    }
  };

  // Calcula las estadísticas generales
  const calculateStats = (ordersData, productsData) => {
    if (!Array.isArray(ordersData) || !Array.isArray(productsData)) {
      setStats({
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        totalRevenue: "0.00",
        totalProducts: 0,
        lowStock: 0,
      });
      return;
    }
    const totalOrders = ordersData.length;
    const pendingOrders = ordersData.filter(
      (o) => o.status === "pending" || o.status === "processing",
    ).length;
    const completedOrders = ordersData.filter(
      (o) => o.status === "completed",
    ).length;
    const totalRevenue = ordersData.reduce(
      (sum, o) => sum + parseFloat(o.total || 0),
      0,
    );
    const lowStock = productsData.filter((p) => (p.stock || 100) < 10).length;
    setStats({
      totalOrders,
      pendingOrders,
      completedOrders,
      totalRevenue: totalRevenue.toFixed(2),
      totalProducts: productsData.length,
      lowStock,
    });
  };

  // --- Funciones para preparar datos de Gráficos ---

  const getChartData = () => {
    // Gráfico de 7 días
    const dailyData = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dayKey = date.toISOString().split("T")[0];
      const displayName = date.toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "short",
      });
      dailyData[dayKey] = {
        name: displayName,
        dateKey: dayKey,
        pedidos: 0,
        ingresos: 0,
      };
    }
    orders.forEach((order) => {
      try {
        const orderDate = new Date(order.created_at);
        if (isNaN(orderDate)) return;
        orderDate.setHours(0, 0, 0, 0);
        const dayKey = orderDate.toISOString().split("T")[0];
        if (dailyData[dayKey]) {
          dailyData[dayKey].pedidos += 1;
          dailyData[dayKey].ingresos += parseFloat(order.total || 0);
        }
      } catch (e) {
        console.error(
          "Error procesando fecha (gráfico diario):",
          order.created_at,
          e,
        );
      }
    });
    return Object.values(dailyData).sort((a, b) =>
      a.dateKey.localeCompare(b.dateKey),
    );
  };

  const getMonthlySalesData = () => {
    // Gráfico mensual
    const monthlyData = {};
    orders.forEach((order) => {
      try {
        const orderDate = new Date(order.created_at);
        if (isNaN(orderDate)) return;
        const year = orderDate.getFullYear();
        const month = (orderDate.getMonth() + 1).toString().padStart(2, "0");
        const monthKeySortable = `${year}-${month}`;
        const displayName = orderDate.toLocaleDateString("es-PE", {
          month: "short",
          year: "numeric",
        });
        if (!monthlyData[monthKeySortable]) {
          monthlyData[monthKeySortable] = {
            name: displayName,
            dateKey: monthKeySortable,
            pedidos: 0,
            ingresos: 0,
          };
        }
        monthlyData[monthKeySortable].pedidos += 1;
        monthlyData[monthKeySortable].ingresos += parseFloat(order.total || 0);
      } catch (e) {
        console.error(
          "Error procesando fecha (gráfico mensual):",
          order.created_at,
          e,
        );
      }
    });
    return Object.values(monthlyData).sort((a, b) =>
      a.dateKey.localeCompare(b.dateKey),
    );
  };

  const getCategoryData = () => {
    // Gráfico de pie
    const categoriesCount = {};
    products.forEach((p) => {
      const categoryName =
        CATEGORIES.find((cat) => cat.id === p.category)?.name ||
        p.category ||
        "Sin Categoría";
      categoriesCount[categoryName] = (categoriesCount[categoryName] || 0) + 1;
    });
    return Object.keys(categoriesCount).map((key) => ({
      name: key,
      value: categoriesCount[key],
    }));
  };

  // Cálculo Frontend para "Productos Más Vendidos"
  const getTopProductsFrontend = () => {
    const productSales = {};
    orders.forEach((order) => {
      // Solo contar pedidos completados para más precisión
      if (order.status === "completed" && order.items) {
        order.items.forEach((item) => {
          const id = item.product_id; // Asumiendo que el item tiene product_id
          const name = item.name;
          const price = item.price;
          const category =
            products.find((p) => p.id === id)?.category || "desconocido";

          if (!productSales[id]) {
            productSales[id] = { id, name, category, price, total_sold: 0 };
          }
          productSales[id].total_sold += parseInt(item.quantity || 0);
        });
      }
    });
    // Convertir a array, ordenar por ventas y tomar los 5 primeros
    return Object.values(productSales)
      .sort((a, b) => b.total_sold - a.total_sold)
      .slice(0, 5);
  };

  // Cálculo Frontend para "Clientes Frecuentes"
  const getTopCustomersFrontend = () => {
    const customerData = {};
    orders.forEach((order) => {
      const email = order.customer_email;
      if (!email) return; // Saltar si no hay email

      if (!customerData[email]) {
        customerData[email] = {
          id: order.user_id,
          full_name: order.customer_name,
          email: order.customer_email,
          total_orders: 0,
          total_spent: 0,
        };
      }
      customerData[email].total_orders += 1;
      customerData[email].total_spent += parseFloat(order.total || 0);
    });
    // Convertir a array, ordenar por N° de pedidos y tomar los 5 primeros
    return Object.values(customerData)
      .sort((a, b) => b.total_orders - a.total_orders)
      .slice(0, 5);
  };

  const COLORS = [
    "#667eea",
    "#764ba2",
    "#f093fb",
    "#4facfe",
    "#43e97b",
    "#fa709a",
  ];

  const dailyChartData = useMemo(() => getChartData(), [orders]);
  const monthlySalesData = useMemo(() => getMonthlySalesData(), [orders]);
  const categoryData = useMemo(() => getCategoryData(), [products]);
  const topProducts = useMemo(
    () => getTopProductsFrontend(),
    [orders, products],
  );
  const topCustomers = useMemo(() => getTopCustomersFrontend(), [orders]);
  const latestMonthly = useMemo(
    () =>
      monthlySalesData.length
        ? monthlySalesData[monthlySalesData.length - 1]
        : null,
    [monthlySalesData],
  );
  const averageTicket = useMemo(() => {
    const revenue = parseFloat(stats.totalRevenue) || 0;
    return stats.totalOrders ? revenue / stats.totalOrders : 0;
  }, [stats.totalRevenue, stats.totalOrders]);
  const statusSummary = useMemo(() => {
    const total = orders.length || 1;
    const groups = [
      {
        key: "pending",
        statuses: ["pending"],
        label: "Pendientes",
        icon: "fa-clock",
        tone: "warning",
        footnote: "A la espera de confirmación.",
      },
      {
        key: "processing",
        statuses: ["processing"],
        label: "En proceso",
        icon: "fa-sync-alt",
        tone: "info",
        footnote: "Coordinando entrega.",
      },
      {
        key: "completed",
        statuses: ["completed"],
        label: "Entregados",
        icon: "fa-check-circle",
        tone: "success",
        footnote: "Pedidos completados.",
      },
      {
        key: "cancelled",
        statuses: ["cancelled"],
        label: "Cancelados",
        icon: "fa-times-circle",
        tone: "danger",
        footnote: "Pedidos anulados.",
      },
    ];
    return groups.map((group) => {
      const count = orders.filter((order) =>
        group.statuses.includes(order.status),
      ).length;
      const percentage = orders.length ? Math.round((count / total) * 100) : 0;
      return { ...group, count, percentage };
    });
  }, [orders]);

  // --- Gestión de Productos (Funciones CRUD) ---
  // (Estas funciones seguirán fallando hasta que crees los archivos PHP)
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    if (
      !productForm.name ||
      !productForm.description ||
      !productForm.price ||
      !productForm.stock
    ) {
      toast.error("Por favor completa todos los campos obligatorios (*)");
      return;
    }
    if (
      isNaN(parseFloat(productForm.price)) ||
      parseFloat(productForm.price) <= 0
    ) {
      toast.error("El precio debe ser un número positivo.");
      return;
    }
    if (isNaN(parseInt(productForm.stock)) || parseInt(productForm.stock) < 0) {
      toast.error("El stock debe ser un número entero no negativo.");
      return;
    }
    try {
      const endpoint = editingProduct
        ? `${API_URL}/update_product.php`
        : `${API_URL}/create_product.php`;
      const payload = {
        ...productForm,
        id: editingProduct ? editingProduct.id : undefined,
      };
      const response = await axios.post(endpoint, payload, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });
      if (response.data.success) {
        toast.success(
          editingProduct ? "Producto actualizado!" : "Producto creado!",
        );
        setShowProductModal(false);
        resetProductForm();
        loadData();
      } else {
        toast.error(
          response.data.message || "Error desconocido al guardar producto",
        );
      }
    } catch (error) {
      toast.error(
        "Error: No se pudo conectar al script (create/update_product.php). ¿Está creado?",
      );
      console.error("Error guardando producto:", error);
    }
  };
  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name || "",
      description: product.description || "",
      price: product.price || "",
      category: product.category || "ramos",
      stock: product.stock || "0",
      image: product.image || "",
    });
    setShowProductModal(true);
  };
  const handleDeleteProduct = async (productId) => {
    if (
      !window.confirm(
        "¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer.",
      )
    )
      return;
    try {
      const response = await axios.post(
        `${API_URL}/delete_product.php`,
        { id: productId },
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        },
      );
      if (response.data.success) {
        toast.success("Producto eliminado");
        loadData();
      } else {
        toast.error(response.data.message || "Error desconocido al eliminar");
      }
    } catch (error) {
      toast.error(
        "Error: No se pudo conectar al script (delete_product.php). ¿Está creado?",
      );
      console.error("Error eliminando producto:", error);
    }
  };
  const resetProductForm = () => {
    setEditingProduct(null);
    setProductForm({
      name: "",
      description: "",
      price: "",
      category: CATEGORIES.find((c) => c.id !== "all")?.id || "ramos",
      stock: "",
      image: "",
    });
  };

  // --- Gestión de Pedidos ---
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await axios.post(
        `${API_URL}/update_order_status.php`,
        { order_id: orderId, status: newStatus },
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        },
      );
      if (response.data.success) {
        toast.success("Estado del pedido actualizado!");
        loadOrders();
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
      } else {
        toast.error(response.data.message || "Error al actualizar estado");
      }
    } catch (error) {
      toast.error(
        "Error: No se pudo conectar al script (update_order_status.php). ¿Está creado?",
      );
      console.error("Error actualizando estado:", error);
    }
  };
  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  // --- Funciones de Utilidad ---
  const getStatusBadge = (status) => {
    const statusInfo = ORDER_STATUS[status] || {
      label: status || "Desconocido",
      color: "secondary",
    };
    return (
      <span className={`badge bg-${statusInfo.color} status-badge`}>
        {statusInfo.label}
      </span>
    );
  };
  const formatCurrency = (value) => {
    const amount = parseFloat(value ?? 0);
    return Number.isFinite(amount) ? `S/ ${amount.toFixed(2)}` : "S/ 0.00";
  };
  const formatDate = (dateString) => {
    if (!dateString) return "Fecha inválida";
    try {
      const date = new Date(dateString);
      if (isNaN(date)) return "Fecha inválida";
      return date.toLocaleString("es-PE", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      console.error("Error formateando fecha:", dateString, e);
      return "Fecha inválida";
    }
  };

  // --- Renderizado Principal ---
  if (contextLoading || loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner"></div>
      </div>
    );
  }
  if (!user || !user.isAdmin) {
    return (
      <div className="admin-loading">
        <p style={{ color: "white" }}>Acceso denegado.</p>
      </div>
    );
  }

  // --- JSX DEL COMPONENTE ---
  return (
    <div className="admin-wrapper">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <h4>
            <i className="fas fa-rose me-2"></i> Le Rose Admin
          </h4>
          <p className="small mb-0 mt-2 opacity-75">Panel de Administración</p>
        </div>
        <nav className="admin-nav">
          <div
            className={`admin-nav-item ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            <i className="fas fa-chart-line"></i> Dashboard
          </div>
          <div
            className={`admin-nav-item ${activeTab === "orders" ? "active" : ""}`}
            onClick={() => setActiveTab("orders")}
          >
            <i className="fas fa-shopping-bag"></i> Pedidos
            {stats.pendingOrders > 0 && (
              <span className="badge bg-danger">{stats.pendingOrders}</span>
            )}
          </div>
          <div
            className={`admin-nav-item ${activeTab === "products" ? "active" : ""}`}
            onClick={() => setActiveTab("products")}
          >
            <i className="fas fa-box"></i> Productos
            {stats.lowStock > 0 && (
              <span className="badge bg-warning text-dark">
                {stats.lowStock}
              </span>
            )}
          </div>
          <div
            className={`admin-nav-item ${activeTab === "analytics" ? "active" : ""}`}
            onClick={() => setActiveTab("analytics")}
          >
            <i className="fas fa-chart-pie"></i> Estadísticas
          </div>
          <hr
            style={{ borderColor: "rgba(255,255,255,0.1)", margin: "1rem 0" }}
          />
          <a href="/" className="admin-nav-item">
            <i className="fas fa-home"></i> Ir al Sitio
          </a>
          <div className="admin-nav-item" onClick={logout}>
            <i className="fas fa-sign-out-alt"></i> Cerrar Sesión
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        {/* Topbar */}
        <div className="admin-topbar">
          <div>
            <h4 className="mb-0">
              {activeTab === "dashboard" && "Dashboard"}
              {activeTab === "orders" && "Gestión de Pedidos"}
              {activeTab === "products" && "Gestión de Productos"}
              {activeTab === "analytics" && "Estadísticas y Análisis"}
            </h4>
          </div>
          <div className="d-flex align-items-center gap-3">
            <span className="text-muted">
              <i className="far fa-calendar-alt me-2"></i>
              {new Date().toLocaleDateString("es-PE", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
            <div className="vr"></div>
            <div>
              <i className="fas fa-user-shield me-2"></i>
              <strong>{user?.name || "Admin"}</strong>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="admin-content">
          {/* === Dashboard Tab === */}
          {activeTab === "dashboard" && (
            <div>
              {/* Stats Cards */}
              <div className="row g-4 mb-4">
                <div className="col-lg-3 col-md-6">
                  <div className="stat-card">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <p className="text-muted mb-1 small">Total Pedidos</p>
                        <h2 className="mb-0 fw-bold">{stats.totalOrders}</h2>
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
                          <i className="fas fa-clock me-1"></i>Requieren
                          revisión
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
                        <p className="text-muted mb-1 small">
                          Ingresos Totales
                        </p>
                        <h2 className="mb-0 fw-bold">
                          {formatCurrency(stats.totalRevenue)}
                        </h2>
                        <small className="text-success">
                          <i className="fas fa-arrow-trend-up me-1"></i>
                          Ticket promedio {formatCurrency(averageTicket)}
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
                        {stats.lowStock > 0 ? (
                          <small className="text-danger">
                            <i className="fas fa-exclamation-triangle me-1"></i>
                            {stats.lowStock} con poco stock
                          </small>
                        ) : (
                          <small className="text-muted">Stock estable</small>
                        )}
                      </div>
                      <div className="stat-icon purple">
                        <i className="fas fa-box"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="status-grid mb-4">
                {statusSummary.map((status) => (
                  <div className="status-card" key={status.key}>
                    <div className={`status-icon ${status.tone}`}>
                      <i className={`fas ${status.icon}`}></i>
                    </div>
                    <div className="status-body">
                      <p className="status-label mb-1">{status.label}</p>
                      <div className="d-flex align-items-baseline gap-2">
                        <strong className="status-value">{status.count}</strong>
                        <span className="status-percentage">
                          {status.percentage}%
                        </span>
                      </div>
                      <div className="status-progress">
                        <span
                          className="status-progress-bar"
                          style={{ width: `${status.percentage}%` }}
                        ></span>
                      </div>
                      <small className="status-footnote">
                        {status.footnote}
                      </small>
                    </div>
                  </div>
                ))}
              </div>

              {/* Charts */}
              <div className="row g-4 mb-4">
                <div className="col-lg-8">
                  <div className="chart-container">
                    <h5 className="mb-4">
                      <i className="fas fa-chart-line me-2 text-primary"></i>
                      Pedidos e Ingresos (Últimos 7 días)
                    </h5>
                    {dailyChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={dailyChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis
                            yAxisId="left"
                            label={{
                              value: "Pedidos",
                              angle: -90,
                              position: "insideLeft",
                            }}
                          />
                          <YAxis
                            yAxisId="right"
                            orientation="right"
                            label={{
                              value: "Ingresos (S/)",
                              angle: 90,
                              position: "insideRight",
                            }}
                          />
                          <Tooltip
                            formatter={(value, name) =>
                              name === "Ingresos (S/)"
                                ? `S/ ${value.toFixed(2)}`
                                : value
                            }
                          />
                          <Legend verticalAlign="top" height={36} />
                          <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="pedidos"
                            stroke="#667eea"
                            strokeWidth={3}
                            name="Pedidos"
                            dot={false}
                            activeDot={{ r: 6 }}
                          />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="ingresos"
                            stroke="#43e97b"
                            strokeWidth={3}
                            name="Ingresos (S/)"
                            dot={false}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-center text-muted p-5">
                        No hay datos recientes para mostrar.
                      </p>
                    )}
                  </div>
                </div>
                <div className="col-lg-4">
                  <div className="chart-container">
                    <h5 className="mb-4">
                      <i className="fas fa-chart-pie me-2 text-primary"></i>
                      Productos por Categoría
                    </h5>
                    {categoryData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) =>
                              `${name} ${(percent * 100).toFixed(0)}%`
                            }
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {categoryData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value) => `${value} producto(s)`}
                          />
                          <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-center text-muted p-5">
                        No hay productos.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Orders Table */}
              <div className="content-card">
                <div className="content-card-header">
                  <h5 className="mb-0">
                    <i className="fas fa-clock me-2"></i> Pedidos Recientes
                  </h5>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => setActiveTab("orders")}
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
                          {orders.slice(0, 5).map((order) => (
                            <tr key={order.id}>
                              <td className="fw-bold">#{order.id}</td>
                              <td>{order.customer_name || "N/A"}</td>
                              <td className="fw-bold text-success">
                                {formatCurrency(order.total)}
                              </td>
                              <td>{getStatusBadge(order.status)}</td>
                              <td className="text-muted small">
                                {formatDate(order.created_at)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-center text-muted p-3">
                      Aún no hay pedidos.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* === Orders Tab === */}
          {activeTab === "orders" && (
            <div className="content-card">
              <div className="content-card-header">
                <h5 className="mb-0">
                  <i className="fas fa-shopping-bag me-2"></i> Todos los Pedidos
                  ({orders.length})
                </h5>
                <div>
                  <button className="btn btn-sm btn-success me-2" disabled>
                    <i className="fas fa-file-excel me-2"></i> Exportar
                  </button>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={loadOrders}
                  >
                    <i className="fas fa-sync-alt me-2"></i> Actualizar
                  </button>
                </div>
              </div>
              <div className="content-card-body">
                {orders.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-custom table-hover">
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
                        {orders.map((order) => (
                          <tr key={order.id}>
                            <td className="fw-bold">#{order.id}</td>
                            <td>{order.customer_name || "N/A"}</td>
                            <td className="text-muted">
                              {order.customer_email || "N/A"}
                            </td>
                            <td>{order.customer_phone || "N/A"}</td>
                            <td className="fw-bold text-success">
                              {formatCurrency(order.total)}
                            </td>
                            <td>{getStatusBadge(order.status)}</td>
                            <td className="text-center">
                              {order.receipt_image ? (
                                <img
                                  src={`/uploads/receipts/${order.receipt_image}`}
                                  alt="Comprobante"
                                  className="receipt-img"
                                  onClick={() =>
                                    window.open(
                                      `/uploads/receipts/${order.receipt_image}`,
                                      "_blank",
                                    )
                                  }
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                  }}
                                />
                              ) : (
                                <span className="text-muted small fst-italic">
                                  N/A
                                </span>
                              )}
                            </td>
                            <td className="text-muted small">
                              {formatDate(order.created_at)}
                            </td>
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
                ) : (
                  <p className="text-center text-muted p-5">
                    No hay pedidos registrados.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* === Products Tab === */}
          {activeTab === "products" && (
            <div className="content-card">
              <div className="content-card-header">
                <h5 className="mb-0">
                  <i className="fas fa-box me-2"></i> Gestión de Productos (
                  {products.length})
                </h5>
                <div>
                  <button
                    className="btn btn-sm btn-success me-2"
                    onClick={() => {
                      resetProductForm();
                      setShowProductModal(true);
                    }}
                  >
                    <i className="fas fa-plus me-2"></i> Nuevo Producto
                  </button>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={loadProducts}
                  >
                    <i className="fas fa-sync-alt me-2"></i> Actualizar
                  </button>
                </div>
              </div>
              <div className="content-card-body">
                {products.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-custom table-hover">
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
                        {products.map((product) => (
                          <tr key={product.id}>
                            <td className="fw-bold">#{product.id}</td>
                            <td className="text-center">
                              <img
                                src={
                                  product.image
                                    ? `/images/products/${product.image}`
                                    : "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=100"
                                }
                                alt={product.name}
                                className="product-img-thumb"
                                onError={(e) => {
                                  e.target.src =
                                    "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=100";
                                }}
                              />
                            </td>
                            <td>
                              <strong>{product.name}</strong>
                              <br />
                              <small
                                className="text-muted"
                                title={product.description}
                              >
                                {product.description?.substring(0, 50)}
                                {product.description?.length > 50 ? "..." : ""}
                              </small>
                            </td>
                            <td>
                              <span className="badge bg-info">
                                {CATEGORIES.find(
                                  (c) => c.id === product.category,
                                )?.name || product.category}
                              </span>
                            </td>
                            <td className="fw-bold text-success">
                              {formatCurrency(product.price)}
                            </td>
                            <td>
                              <span
                                className={`badge ${parseInt(product.stock || 0) < 10 ? "bg-warning text-dark" : "bg-secondary"}`}
                              >
                                {product.stock || 0} unidades
                              </span>
                            </td>
                            <td>
                              {parseInt(product.stock || 0) > 0 ? (
                                <span className="badge bg-success">
                                  Disponible
                                </span>
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
                ) : (
                  <p className="text-center text-muted p-5">
                    No hay productos registrados.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* === Analytics Tab (Versión Frontend) === */}
          {activeTab === "analytics" && (
            <div>
              {/* Tarjetas KPI (NUEVO) */}
              {monthlySalesData.length > 0 ? (
                <div className="row g-4 mb-4">
                  <div className="col-md-4">
                    <div className="stat-card kpi-card">
                      <p className="text-muted mb-1 small">
                        Último Mes ({latestMonthly?.name})
                      </p>
                      <h3 className="mb-0 fw-bold">
                        {latestMonthly?.pedidos ?? 0}
                      </h3>
                      <small className="text-primary">
                        Pedidos Registrados
                      </small>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="stat-card kpi-card">
                      <p className="text-muted mb-1 small">Ingresos del Mes</p>
                      <h3 className="mb-0 fw-bold">
                        {formatCurrency(latestMonthly?.ingresos ?? 0)}
                      </h3>
                      <small className="text-success">Ingresos Generados</small>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="stat-card kpi-card">
                      <p className="text-muted mb-1 small">Ingreso Promedio</p>
                      <h3 className="mb-0 fw-bold">
                        {formatCurrency(averageTicket)}
                      </h3>
                      <small className="text-muted">Por Pedido (General)</small>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted">
                  No hay datos de ventas para mostrar KPIs.
                </p>
              )}

              {/* Gráfico de Líneas Mensual (MODIFICADO) */}
              <div className="row g-4 mb-4">
                <div className="col-lg-12">
                  <div className="chart-container">
                    <h5 className="mb-4">
                      <i className="fas fa-chart-line me-2 text-primary"></i>
                      Evolución de Ventas por Mes
                    </h5>
                    {monthlySalesData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={400}>
                        <LineChart
                          data={monthlySalesData}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis
                            yAxisId="left"
                            label={{
                              value: "Pedidos",
                              angle: -90,
                              position: "insideLeft",
                            }}
                          />
                          <YAxis
                            yAxisId="right"
                            orientation="right"
                            label={{
                              value: "Ingresos (S/)",
                              angle: 90,
                              position: "insideRight",
                            }}
                          />
                          <Tooltip
                            formatter={(value, name) =>
                              name === "Ingresos (S/)"
                                ? `S/ ${value.toFixed(2)}`
                                : value
                            }
                          />
                          <Legend verticalAlign="top" height={36} />
                          <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="pedidos"
                            stroke="#667eea"
                            strokeWidth={3}
                            name="Pedidos"
                            activeDot={{ r: 8 }}
                            dot={{ r: 5 }}
                          />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="ingresos"
                            stroke="#43e97b"
                            strokeWidth={3}
                            name="Ingresos (S/)"
                            activeDot={{ r: 8 }}
                            dot={{ r: 5 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-center text-muted p-5">
                        No hay datos suficientes para el gráfico mensual.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Top Productos y Clientes (Cálculo Frontend) */}
              <div className="row g-4">
                <div className="col-lg-6">
                  <div className="content-card">
                    <div className="content-card-header">
                      <h5 className="mb-0">
                        <i className="fas fa-star me-2"></i> Productos Más
                        Vendidos (Cálculo Local)
                      </h5>
                    </div>
                    <div className="content-card-body">
                      {topProducts.length > 0 ? (
                        <div className="list-group list-group-flush">
                          {topProducts.map((product, index) => (
                            <div
                              key={product.id}
                              className="list-group-item d-flex justify-content-between align-items-center"
                            >
                              <div
                                className="d-flex align-items-center"
                                style={{ minWidth: 0 }}
                              >
                                <div className="rank-badge me-3">
                                  {index + 1}
                                </div>
                                <div>
                                  <strong
                                    className="d-block text-truncate"
                                    title={product.name}
                                  >
                                    {product.name}
                                  </strong>
                                  <small className="text-muted">
                                    {CATEGORIES.find(
                                      (c) => c.id === product.category,
                                    )?.name || product.category}
                                  </small>
                                </div>
                              </div>
                              <div
                                className="text-end ms-2"
                                style={{ flexShrink: 0 }}
                              >
                                <div className="fw-bold text-primary">
                                  {product.total_sold} vendido(s)
                                </div>
                                <small className="text-muted">
                                  {formatCurrency(product.price)}
                                </small>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted p-3">
                          No hay pedidos completados para mostrar datos.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="content-card">
                    <div className="content-card-header">
                      <h5 className="mb-0">
                        <i className="fas fa-users me-2"></i> Clientes
                        Frecuentes (Cálculo Local)
                      </h5>
                    </div>
                    <div className="content-card-body">
                      {topCustomers.length > 0 ? (
                        <div className="list-group list-group-flush">
                          {topCustomers.map((customer, index) => (
                            <div
                              key={customer.id || index}
                              className="list-group-item d-flex justify-content-between align-items-center"
                            >
                              <div
                                className="d-flex align-items-center"
                                style={{ minWidth: 0 }}
                              >
                                <div className="rank-badge me-3">
                                  {index + 1}
                                </div>
                                <div>
                                  <strong
                                    className="d-block text-truncate"
                                    title={customer.full_name}
                                  >
                                    {customer.full_name || "N/A"}
                                  </strong>
                                  <small className="text-muted text-truncate d-block">
                                    {customer.email || "N/A"}
                                  </small>
                                </div>
                              </div>
                              <div
                                className="text-end ms-2"
                                style={{ flexShrink: 0 }}
                              >
                                <div className="fw-bold text-primary">
                                  {customer.total_orders} pedido(s)
                                </div>
                                <small className="text-muted">
                                  {formatCurrency(customer.total_spent)}
                                </small>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted p-3">
                          No hay pedidos para mostrar datos de clientes.
                        </p>
                      )}
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
        <div
          className="modal-overlay"
          onClick={() => setShowProductModal(false)}
        >
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h5 className="mb-0">
                <i className="fas fa-box me-2"></i>
                {editingProduct ? "Editar Producto" : "Nuevo Producto"}
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
                    <label className="form-label">Nombre *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={productForm.name}
                      onChange={(e) =>
                        setProductForm({ ...productForm, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Descripción *</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={productForm.description}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          description: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Categoría *</label>
                    <select
                      className="form-select"
                      value={productForm.category}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          category: e.target.value,
                        })
                      }
                      required
                    >
                      {CATEGORIES.filter((cat) => cat.id !== "all").map(
                        (cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Precio (S/) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="form-control"
                      value={productForm.price}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          price: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Stock *</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      className="form-control"
                      value={productForm.stock}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          stock: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Nombre Imagen</label>
                    <input
                      type="text"
                      className="form-control"
                      value={productForm.image}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          image: e.target.value,
                        })
                      }
                      placeholder="ej. rosas.jpg"
                    />
                    <small className="text-muted">
                      En /public/images/products/
                    </small>
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
                  {editingProduct ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal de Detalle de Pedido */}
      {showOrderModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowOrderModal(false)}>
          <div
            className="modal-container modal-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h5 className="mb-0">
                <i className="fas fa-shopping-bag me-2"></i> Detalle Pedido #
                {selectedOrder.id}
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
                <div className="col-md-6">
                  <div className="info-card h-100">
                    <h6 className="mb-3">
                      <i className="fas fa-user me-2 text-primary"></i> Cliente
                    </h6>
                    <div className="info-item">
                      <span className="info-label">Nombre:</span>
                      <span className="info-value">
                        {selectedOrder.customer_name || "N/A"}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Email:</span>
                      <span className="info-value">
                        {selectedOrder.customer_email || "N/A"}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Teléfono:</span>
                      <span className="info-value">
                        {selectedOrder.customer_phone || "N/A"}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Dirección:</span>
                      <span className="info-value">
                        {selectedOrder.delivery_address || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="info-card h-100">
                    <h6 className="mb-3">
                      <i className="fas fa-info-circle me-2 text-primary"></i>
                      Pedido
                    </h6>
                    <div className="info-item">
                      <span className="info-label">Fecha:</span>
                      <span className="info-value">
                        {formatDate(selectedOrder.created_at)}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Estado:</span>
                      <span className="info-value">
                        {getStatusBadge(selectedOrder.status)}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Total:</span>
                      <span className="info-value fw-bold text-success">
                        {formatCurrency(selectedOrder.total)}
                      </span>
                    </div>
                  </div>
                </div>
                {selectedOrder.receipt_image && (
                  <div className="col-12">
                    <div className="info-card">
                      <h6 className="mb-3">
                        <i className="fas fa-receipt me-2 text-primary"></i>
                        Comprobante
                      </h6>
                      <div className="text-center">
                        <img
                          src={`/uploads/receipts/${selectedOrder.receipt_image}`}
                          alt="Comprobante"
                          className="img-fluid rounded"
                          style={{
                            maxHeight: "400px",
                            cursor: "pointer",
                            border: "1px solid #ddd",
                          }}
                          onClick={() =>
                            window.open(
                              `/uploads/receipts/${selectedOrder.receipt_image}`,
                              "_blank",
                            )
                          }
                          onError={(e) => {
                            e.target.alt = "Error al cargar";
                            e.target.style.display = "none";
                          }}
                        />
                        <p className="text-muted small mt-2 mb-0">
                          <i className="fas fa-search-plus me-1"></i> Click para
                          ampliar
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="col-12">
                  <div className="info-card">
                    <h6 className="mb-3">
                      <i className="fas fa-box me-2 text-primary"></i> Productos
                    </h6>
                    {selectedOrder.items && selectedOrder.items.length > 0 ? (
                      <div className="table-responsive">
                        <table className="table table-sm mb-0">
                          <thead>
                            <tr>
                              <th>Producto</th>
                              <th className="text-center">Cant.</th>
                              <th className="text-end">P. Unit.</th>
                              <th className="text-end">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedOrder.items.map((item, index) => (
                              <tr key={index}>
                                <td>{item.name}</td>
                                <td className="text-center">{item.quantity}</td>
                                <td className="text-end">
                                  {formatCurrency(item.price)}
                                </td>
                                <td className="fw-bold text-end">
                                  {formatCurrency(
                                    (item.quantity || 0) * (item.price || 0),
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="table-light">
                              <td colSpan="3" className="text-end fw-bold">
                                TOTAL:
                              </td>
                              <td className="fw-bold text-success text-end">
                                {formatCurrency(selectedOrder.total)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    ) : (
                      <p className="text-muted text-center mb-0">
                        No se encontraron detalles.
                      </p>
                    )}
                  </div>
                </div>
                {selectedOrder.notes && (
                  <div className="col-12">
                    <div className="info-card">
                      <h6 className="mb-3">
                        <i className="fas fa-sticky-note me-2 text-primary"></i>
                        Notas
                      </h6>
                      <p className="mb-0 fst-italic">"{selectedOrder.notes}"</p>
                    </div>
                  </div>
                )}
                <div className="col-12">
                  <div className="info-card">
                    <h6 className="mb-3">
                      <i className="fas fa-tasks me-2 text-primary"></i>
                      Actualizar Estado
                    </h6>
                    <div className="d-flex gap-2 flex-wrap justify-content-center">
                      {Object.entries(ORDER_STATUS).map(
                        ([statusKey, statusInfo]) => (
                          <button
                            key={statusKey}
                            className={`btn btn-sm btn-${statusInfo.color}`}
                            onClick={() =>
                              handleUpdateOrderStatus(
                                selectedOrder.id,
                                statusKey,
                              )
                            }
                            disabled={
                              selectedOrder.status === statusKey ||
                              ["completed", "cancelled"].includes(
                                selectedOrder.status,
                              )
                            }
                          >
                            <i
                              className={`fas ${statusKey === "pending" ? "fa-clock" : statusKey === "processing" ? "fa-cog" : statusKey === "completed" ? "fa-check-circle" : statusKey === "cancelled" ? "fa-times-circle" : "fa-question-circle"} me-2`}
                            ></i>
                            {statusInfo.label}
                          </button>
                        ),
                      )}
                    </div>
                    {["completed", "cancelled"].includes(
                      selectedOrder.status,
                    ) && (
                      <p className="text-muted text-center small mt-3 mb-0">
                        Pedido
                        {selectedOrder.status === "completed"
                          ? "completado"
                          : "cancelado"}
                        . No se puede cambiar estado.
                      </p>
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