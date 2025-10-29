import { APP_CONFIG } from '../config';

const Hero = () => {
  return (
    <section id="home" className="hero-section">
      <div className="container">
        <div className="row align-items-center">
          <div className="col-lg-6">
            <h1 className="hero-title">Las Flores Más Hermosas</h1>
            <p className="fs-5 text-muted mb-4">
              Arreglos florales únicos creados con amor y dedicación.
            </p>
            <a href="#products" className="btn btn-primary-custom">
              <i className="fas fa-shopping-bag me-2"></i>Ver Catálogo
            </a>
          </div>
          <div className="col-lg-6 text-center mt-4 mt-lg-0">
            <img 
              src="https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=600" 
              alt="Flores"
              className="img-fluid rounded shadow-lg"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;