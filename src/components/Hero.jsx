import { APP_CONFIG } from '../config';

const Hero = () => {
  return (
    <section id="home" className="hero-section">
      <div className="hero-gradient"></div>
      <div className="container position-relative">
        <div className="row align-items-center g-5">
          <div className="col-lg-6">
            <span className="hero-badge">
              <i className="fas fa-magic me-2"></i>
              Boutique floral artesanal
            </span>
            <h1 className="hero-title mt-3">
              Celebramos cada momento con flores inolvidables
            </h1>
            <p className="hero-text">
              {APP_CONFIG.tagline}. Diseños exclusivos, flores frescas seleccionadas y entregas puntuales en toda la ciudad.
            </p>

            <div className="hero-actions">
              <a href="#products" className="btn btn-primary-custom">
                <i className="fas fa-shopping-bag me-2"></i>
                Ver catálogo
              </a>
              <a href={APP_CONFIG.social.whatsapp} className="btn btn-outline-custom" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-whatsapp me-2"></i>
                Cotizar por WhatsApp
              </a>
            </div>

            <div className="hero-stats">
              <div className="hero-stat">
                <strong>+350</strong>
                <span>Arreglos entregados</span>
              </div>
              <div className="hero-stat">
                <strong>4.9/5</strong>
                <span>Valoración de clientes</span>
              </div>
              <div className="hero-stat">
                <strong>24h</strong>
                <span>Servicio de entrega</span>
              </div>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="hero-media">
              <div className="hero-card shadow-lg">
                <img
                  src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=900"
                  alt="Arreglo floral premium"
                  className="hero-image"
                />
                <div className="hero-card-overlay">
                  <span className="hero-card-title">Colección Primavera</span>
                  <p className="hero-card-text">Ramos diseñados para bodas, aniversarios y momentos únicos.</p>
                </div>
              </div>
              <div className="hero-floating-card">
                <i className="fas fa-truck"></i>
                <div>
                  <p className="mb-0">Envío Express</p>
                  <small>Programado el mismo día</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;