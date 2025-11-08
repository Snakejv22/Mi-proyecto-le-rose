import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { APP_CONFIG } from '../config';

const Header = ({ onShowAuth, onShowCart, onShowOrders }) => {
  const { user, cartCount, logout } = useApp();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  const handleNavClick = (e, target) => {
    e.preventDefault();
    closeMenu();
    const element = document.querySelector(target);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className={`navbar navbar-expand-lg navbar-custom ${scrolled ? 'scrolled' : ''}`}>
      <div className="container">
        {/* Brand */}
        <a 
          className="navbar-brand-custom" 
          href="#home"
          onClick={(e) => handleNavClick(e, '#home')}
        >
          <i className="fas fa-rose me-2"></i>
          <span className="brand-name">Le Rose Boutique</span>
        </a>

        {/* Actions Mobile (Cart + Toggle) */}
        <div className="d-flex d-lg-none align-items-center gap-3">
          {/* Cart Icon Mobile */}
          <div 
            className="cart-icon-wrapper" 
            onClick={() => (user ? onShowCart() : onShowAuth())}
          >
            <i className="fas fa-shopping-cart"></i>
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </div>

          {/* Toggler */}
          <button
            className="navbar-toggler"
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation"
          >
            <i className={`fas ${menuOpen ? 'fa-times' : 'fa-bars'}`}></i>
          </button>
        </div>

        {/* Menu */}
        <div className={`collapse navbar-collapse ${menuOpen ? 'show' : ''}`} id="navbarNav">
          <ul className="navbar-nav ms-auto align-items-lg-center">
            {/* Navigation Links */}
            <li className="nav-item">
              <a 
                className="nav-link-custom" 
                href="#home"
                onClick={(e) => handleNavClick(e, '#home')}
              >
                Inicio
              </a>
            </li>
            <li className="nav-item">
              <a 
                className="nav-link-custom" 
                href="#services"
                onClick={(e) => handleNavClick(e, '#services')}
              >
                Servicios
              </a>
            </li>
            <li className="nav-item">
              <a 
                className="nav-link-custom" 
                href="#products"
                onClick={(e) => handleNavClick(e, '#products')}
              >
                Catálogo
              </a>
            </li>

            {/* My Orders (Only logged users) */}
            {user && (
              <li className="nav-item">
                <button 
                  className="nav-link-custom" 
                  onClick={() => { onShowOrders(); closeMenu(); }}
                >
                  <i className="fas fa-box me-2 d-lg-none"></i>
                  Mis Pedidos
                </button>
              </li>
            )}

            {/* Divider Mobile */}
            <li className="d-lg-none">
              <hr className="my-2 border-secondary" />
            </li>

            {/* Cart Desktop */}
            <li className="nav-item d-none d-lg-block ms-lg-2">
              <div 
                className="cart-icon-wrapper" 
                onClick={() => (user ? onShowCart() : onShowAuth())}
              >
                <i className="fas fa-shopping-cart"></i>
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </div>
            </li>

            {/* User Actions */}
            <li className="nav-item ms-lg-3">
              {user ? (
                <div className="dropdown">
                  <button
                    className="btn btn-sm btn-primary-custom dropdown-toggle"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <i className="fas fa-user-circle me-2"></i>
                    <span className="d-none d-md-inline">{user.name}</span>
                    <span className="d-md-none">Mi Cuenta</span>
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end">
                    <li className="dropdown-header">
                      <small className="text-muted">Hola, {user.name}</small>
                    </li>
                    {user.isAdmin && (
                      <>
                        <li><hr className="dropdown-divider" /></li>
                        <li>
                          <a className="dropdown-item" href="/admin">
                            <i className="fas fa-tachometer-alt me-2 text-primary"></i>
                            Panel Admin
                          </a>
                        </li>
                      </>
                    )}
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <button 
                        className="dropdown-item text-danger" 
                        onClick={() => { logout(); closeMenu(); }}
                      >
                        <i className="fas fa-sign-out-alt me-2"></i>
                        Cerrar Sesión
                      </button>
                    </li>
                  </ul>
                </div>
              ) : (
                <button 
                  className="btn btn-sm btn-primary-custom w-100 w-lg-auto" 
                  onClick={() => { onShowAuth(); closeMenu(); }}
                >
                  <i className="fas fa-sign-in-alt me-2"></i>
                  Iniciar Sesión
                </button>
              )}
            </li>

            {/* Contact Phone */}
            {/* Contact Phone - removed */}

            
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Header;