import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { APP_CONFIG } from '../config';

const Header = ({ onShowAuth, onShowCart, onShowOrders }) => {
  const { user, cartCount, logout } = useApp();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`navbar navbar-expand-lg navbar-custom ${scrolled ? 'scrolled' : ''}`}>
      <div className="container">
        <a className="navbar-brand-custom" href="#home">
          <i className="fas fa-rose me-2"></i>
          Le Rose Boutique
        </a>
        <span className="brand-tagline d-none d-xl-inline ms-3">{APP_CONFIG.tagline}</span>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Menú principal"
        >
          <i className="fas fa-bars"></i>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto align-items-center">
            <li className="nav-item">
              <a className="nav-link-custom" href="#home">Inicio</a>
            </li>
            <li className="nav-item">
              <a className="nav-link-custom" href="#services">Servicios</a>
            </li>
            <li className="nav-item">
              <a className="nav-link-custom" href="#products">Catálogo</a>
            </li>

            {user && (
              <li className="nav-item">
                <button className="nav-link-custom btn btn-link" onClick={onShowOrders}>
                  Mis Pedidos
                </button>
              </li>
            )}

            <li className="nav-item ms-3">
              <div className="cart-icon-wrapper" onClick={() => (user ? onShowCart() : onShowAuth())}>
                <i className="fas fa-shopping-cart"></i>
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </div>
            </li>

            <li className="nav-item ms-3">
              {user ? (
                <div className="dropdown">
                  <button
                    className="btn btn-sm btn-primary-custom dropdown-toggle"
                    type="button"
                    data-bs-toggle="dropdown"
                  >
                    <i className="fas fa-user me-2"></i>
                    {user.name}
                  </button>
                  <ul className="dropdown-menu">
                    {user.isAdmin && (
                      <li>
                        <a className="dropdown-item" href="/admin">
                          <i className="fas fa-tachometer-alt me-2"></i>
                          Panel Admin
                        </a>
                      </li>
                    )}
                    <li>
                      <button className="dropdown-item" onClick={logout}>
                        <i className="fas fa-sign-out-alt me-2"></i>
                        Cerrar Sesión
                      </button>
                    </li>
                  </ul>
                </div>
              ) : (
                <button className="btn btn-sm btn-primary-custom" onClick={onShowAuth}>
                  Iniciar Sesión
                </button>
              )}
            </li>

            <li className="nav-item d-none d-lg-block ms-3">
              <a className="btn btn-outline-custom" href={`tel:${APP_CONFIG.contact.phone.replace(/\s+/g, '')}`}>
                <i className="fas fa-phone-alt me-2"></i>
                {APP_CONFIG.contact.phone}
              </a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Header;