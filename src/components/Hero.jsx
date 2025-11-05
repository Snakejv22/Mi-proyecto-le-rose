import { APP_CONFIG } from '../config';

const Hero = () => {
  return (
    <section id="home" className="hero-section">
      {/* Decoración de fondo con círculos */}
      <div className="hero-decoration">
        <div className="circle circle-1"></div>
        <div className="circle circle-2"></div>
        <div className="circle circle-3"></div>
      </div>

      <div className="container position-relative">
        <div className="row align-items-center">
          <div className="col-lg-6">
            <div className="hero-badge mb-3">
              <i className="fas fa-sparkles me-2"></i>
              Las Mejores Flores de la Ciudad
            </div>

            <h1 className="hero-title mb-4">
              Flores Que Transmiten
              <span className="hero-highlight"> Emociones</span>
            </h1>

            <p className="hero-subtitle mb-4">
              Arreglos florales únicos creados con amor y dedicación para cada ocasión especial.
              Frescura garantizada y entrega a domicilio.
            </p>

            <div className="hero-features mb-4">
              <div className="hero-feature">
                <i className="fas fa-truck text-primary"></i>
                <span>Entrega Gratis</span>
              </div>
              <div className="hero-feature">
                <i className="fas fa-leaf text-success"></i>
                <span>100% Frescas</span>
              </div>
              <div className="hero-feature">
                <i className="fas fa-heart text-danger"></i>
                <span>Hechas con Amor</span>
              </div>
            </div>

            <div className="hero-buttons">
              <a href="#products" className="btn btn-primary-custom me-3">
                <i className="fas fa-shopping-bag me-2"></i>
                Ver Catálogo
              </a>
              <a href="#services" className="btn btn-outline-custom">
                <i className="fas fa-info-circle me-2"></i>
                Saber Más
              </a>
            </div>
          </div>

          <div className="col-lg-6 mt-5 mt-lg-0">
            <div className="hero-image-container">
              <div className="hero-image-decoration"></div>
              <img
                src="https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=800&q=80"
                alt="Hermosas flores frescas"
                className="hero-image"
              />

              {/* Card flotante con estadística */}
              <div className="hero-floating-card">
                <div className="floating-card-icon">
                  <i className="fas fa-star"></i>
                </div>
                <div className="floating-card-content">
                  <h4>500+</h4>
                  <p>Clientes Felices</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ola decorativa en la parte inferior */}
      <div className="hero-wave">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"></path>
        </svg>
      </div>
    </section>
  );
};

export default Hero;