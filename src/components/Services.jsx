const Services = () => {
  return (
    <section id="services" className="py-5 bg-light">
      <div className="container">
        <div className="text-center mb-5">
          <h2 className="display-5 mb-3">Nuestros Servicios</h2>
        </div>
        
        <div className="row g-4">
          <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100 text-center p-4">
              <i className="fas fa-truck text-primary mb-3" style={{fontSize: '3rem'}}></i>
              <h4>Entrega a Domicilio</h4>
              <p className="text-muted">Enviamos tus flores frescas.</p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100 text-center p-4">
              <i className="fas fa-palette text-primary mb-3" style={{fontSize: '3rem'}}></i>
              <h4>Arreglos Personalizados</h4>
              <p className="text-muted">Diseños únicos para ti.</p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100 text-center p-4">
              <i className="fas fa-heart text-primary mb-3" style={{fontSize: '3rem'}}></i>
              <h4>Flores Frescas</h4>
              <p className="text-muted">La mejor calidad.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;