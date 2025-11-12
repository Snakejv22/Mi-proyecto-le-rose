import { useState } from 'react';

const Newsletter = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Aquí irá la lógica de suscripción más adelante
    console.log('Email:', email);
    
    setTimeout(() => {
      setIsSubmitting(false);
      setEmail('');
    }, 2000);
  };

  return (
    <section className="newsletter-section">
      <div className="newsletter-container">
        {/* Left Side - Image */}
        <div className="newsletter-image-wrapper">
          <div className="newsletter-image-content">
            <img
              src="/images/main/persona1.png"
              alt="Newsletter"
              className="newsletter-image"
            />
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="newsletter-content">
          <div className="newsletter-text">
            <div className="newsletter-accent-line"></div>
            <h2 className="newsletter-title">Suscríbete a nuestro boletín floral</h2>
            <p className="newsletter-description">
              Déjate inspirar por la belleza de las flores. Recibe ideas, promociones y novedades directamente en tu correo.
            </p>
          </div>

          <form className="newsletter-form" onSubmit={handleSubmit}>
            <div className="newsletter-input-wrapper">
              <input
                type="email"
                className="newsletter-input"
                placeholder="Tu correo electrónico..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
              />
              <button 
                type="submit" 
                className="newsletter-button"
                disabled={isSubmitting}
                onClick={handleSubmit}
              >
                {isSubmitting ? (
                  <span className="spinner-border spinner-border-sm"></span>
                ) : (
                  'Suscribirme'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        /* Newsletter Section */
        .newsletter-section {
          position: relative;
          background: #000000;
          overflow: visible; /* permitir que la imagen sobresalga */
          padding: 0;
          margin: 6rem 0 8rem 0; /* 6rem arriba, 8rem abajo */
        }

        .newsletter-container {
          display: grid;
          grid-template-columns: 40% 60%;
          min-height: 600px;
          max-width: 1600px;
          margin: 0 auto;
          position: relative;
        }

        /* Left Side - Image wrapper (mantiene la columna del grid) */
        .newsletter-image-wrapper {
          position: relative; /* mantener la caja en el flujo */
          background: transparent;
          overflow: visible;
        }

        /* Imagen desplazada dentro del wrapper para sobresalir a la izquierda */
        .newsletter-image-content {
          position: absolute;
          bottom: 0;
          left: -12%; /* ajustar para cuánto sobresale */
          width: 140%;
          height: 120%;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          pointer-events: none;
          z-index: 1;
        }

        .newsletter-image {
          width: auto;
          height: 100%;
          object-fit: contain;
          object-position: center bottom;
          display: block;
          animation: fadeInScale 1s ease-out;
          max-width: none;
        }

        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(1.05); }
          to   { opacity: 1; transform: scale(1); }
        }

        /* Right Side - Content */
        .newsletter-content {
          background: #000000;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 4rem 6rem;
          gap: 3rem;
          position: relative;
          z-index: 2; /* texto por encima de la imagen */
        }

        .newsletter-content::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: 
            radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.03) 0%, transparent 50%);
          pointer-events: none;
        }

        .newsletter-text { color: white; position: relative; z-index: 1; }
        .newsletter-accent-line { width: 80px; height: 4px; background: white; margin-bottom: 2rem; border-radius: 2px; }
        .newsletter-title { font-family: 'Poppins', sans-serif; font-size: 3rem; font-weight: 700; color: white; margin: 0 0 1.5rem 0; line-height: 1.2; letter-spacing: -0.5px; }
        .newsletter-description { font-size: 1.1rem; color: rgba(255,255,255,0.8); line-height: 1.7; margin: 0; max-width: 500px; }

        /* Form */
        .newsletter-form { width: 100%; max-width: 600px; position: relative; z-index: 2; }

        .newsletter-input-wrapper { position: relative; display: flex; align-items: center; background: white; border-radius: 60px; padding: 8px; box-shadow: 0 10px 40px rgba(255,255,255,0.1); transition: all 0.3s ease; }
        .newsletter-input-wrapper:focus-within { box-shadow: 0 15px 60px rgba(255,255,255,0.2); transform: translateY(-2px); }
        .newsletter-input { flex: 1; border: none; background: transparent; padding: 1rem 2rem; font-size: 1rem; color: #333; outline: none; font-family: 'Poppins', sans-serif; }
        .newsletter-input::placeholder { color: #999; }
        .newsletter-button { flex-shrink: 0; background: #000000; color: white; border: none; padding: 1rem 3rem; border-radius: 50px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.3s ease; font-family: 'Poppins', sans-serif; min-width: 140px; display: flex; align-items: center; justify-content: center; }
        .newsletter-button:hover:not(:disabled) { background: #1a1a1a; transform: scale(1.05); box-shadow: 0 8px 25px rgba(0,0,0,0.3); }
        .newsletter-button:disabled { opacity: 0.7; cursor: not-allowed; }

        /* Spinner */
        .spinner-border { display: inline-block; width: 1rem; height: 1rem; vertical-align: text-bottom; border: 0.15em solid currentColor; border-right-color: transparent; border-radius: 50%; animation: spinner-border 0.75s linear infinite; }
        @keyframes spinner-border { to { transform: rotate(360deg); } }
        .spinner-border-sm { width: 0.875rem; height: 0.875rem; border-width: 0.15em; }

        /* Responsive Design */
        @media (max-width: 1200px) {
          .newsletter-container { grid-template-columns: 45% 55%; }
          .newsletter-content { padding: 3rem 4rem; }
          .newsletter-title { font-size: 2.5rem; }
        }

        @media (max-width: 991.98px) {
          .newsletter-container { grid-template-columns: 1fr; min-height: auto; }
          .newsletter-image-wrapper { min-height: 400px; order: 2; }
          .newsletter-content { order: 1; padding: 4rem 3rem; }
          .newsletter-title { font-size: 2.2rem; }
          .newsletter-description { font-size: 1rem; }
          .newsletter-image-content { left: 0; width: 100%; height: 100%; }
        }

        @media (max-width: 768px) {
          .newsletter-content { padding: 3rem 2rem; gap: 2rem; }
          .newsletter-title { font-size: 2rem; }
          .newsletter-accent-line { width: 60px; height: 3px; margin-bottom: 1.5rem; }
          .newsletter-input-wrapper { flex-direction: column; gap: 0.5rem; padding: 12px; border-radius: 20px; }
          .newsletter-input { width: 100%; padding: 1rem 1.5rem; text-align: center; }
          .newsletter-button { width: 100%; padding: 1rem 2rem; }
          .newsletter-image-wrapper { min-height: 350px; }
        }

        @media (max-width: 575.98px) {
          .newsletter-content { padding: 2.5rem 1.5rem; }
          .newsletter-title { font-size: 1.75rem; }
          .newsletter-description { font-size: 0.95rem; }
          .newsletter-image-wrapper { min-height: 300px; }
        }
      `}</style>
    </section>
  );
};

export default Newsletter;
