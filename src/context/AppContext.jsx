import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_URL } from '../config';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Inicializar la aplicación
  useEffect(() => {
    checkSession();
  }, []);

  // Verificar sesión guardada
  const checkSession = () => {
    const savedUser = localStorage.getItem('lerose_user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        loadCartCount();
      } catch (error) {
        localStorage.removeItem('lerose_user');
      }
    }
    setLoading(false);
  };

  // Cargar contador del carrito
  const loadCartCount = async () => {
    try {
      const response = await axios.get(`${API_URL}/get_cart.php`, {
        withCredentials: true
      });
      if (response.data.success) {
        const count = response.data.items.reduce((sum, item) => sum + parseInt(item.quantity), 0);
        setCartCount(count);
      }
    } catch (error) {
      console.error('Error loading cart count:', error);
    }
  };

  // Login
  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/login.php`, 
        { email, password },
        { withCredentials: true }
      );
      
      if (response.data.success) {
        setUser(response.data.user);
        localStorage.setItem('lerose_user', JSON.stringify(response.data.user));
        loadCartCount();
        toast.success('¡Bienvenido/a!');
        return { success: true };
      } else {
        toast.error(response.data.message);
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      toast.error('Error al iniciar sesión');
      return { success: false, message: 'Error al iniciar sesión' };
    }
  };

  // Register
  const register = async (formData) => {
    try {
      const response = await axios.post(`${API_URL}/register.php`,
        formData,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        setUser(response.data.user);
        localStorage.setItem('lerose_user', JSON.stringify(response.data.user));
        toast.success('¡Registro exitoso!');
        return { success: true };
      } else {
        toast.error(response.data.message);
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      toast.error('Error al registrarse');
      return { success: false, message: 'Error al registrarse' };
    }
  };

  // Logout
  const logout = async () => {
    try {
      await axios.get(`${API_URL}/logout.php`, { withCredentials: true });
      setUser(null);
      setCartCount(0);
      localStorage.removeItem('lerose_user');
      toast.info('Sesión cerrada');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Agregar al carrito
  const addToCart = async (productId, quantity = 1) => {
    if (!user) {
      toast.warning('Debes iniciar sesión para agregar productos');
      return { success: false, requiresAuth: true };
    }

    try {
      const response = await axios.post(`${API_URL}/add_to_cart.php`,
        { productId, quantity },
        { withCredentials: true }
      );
      
      if (response.data.success) {
        setCartCount(response.data.cartCount);
        toast.success('✅ Producto agregado al carrito');
        return { success: true };
      } else {
        toast.error(response.data.message);
        return { success: false };
      }
    } catch (error) {
      toast.error('Error al agregar al carrito');
      return { success: false };
    }
  };

  const value = {
    user,
    cartCount,
    loading,
    login,
    register,
    logout,
    addToCart,
    loadCartCount
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};