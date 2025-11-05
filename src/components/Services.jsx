const SERVICES = [
  {
    icon: 'fa-shipping-fast',
    title: 'Envíos programados',
    description: 'Cobertura en toda la ciudad con entregas en el mismo día y seguimiento en tiempo real.',
    badge: '24/7'
  },
  {
    icon: 'fa-palette',
    title: 'Diseño personalizado',
    description: 'Floristas profesionales que crean composiciones únicas para bodas, eventos y detalles corporativos.',
    badge: 'Hecho a mano'
  },
  {
    icon: 'fa-heart',
    title: 'Flores premium',
    description: 'Seleccionamos flores frescas de temporada y trabajamos con productores locales certificados.',
    badge: 'Calidad A1'
  },
  {
    icon: 'fa-glass-cheers',
    title: 'Ambientación de eventos',
    description: 'Montajes completos para ceremonias, recepciones y sesiones fotográficas con asesoría integral.',
    badge: 'Eventos'
  }
];

const Services = () => {
  return (
    <section id="services" className="section services-section">
      <div className="container">
        <div className="section-header text-center">
          <span className="section-eyebrow">¿Por qué elegirnos?</span>
          <h2 className="section-title">Servicios pensados para enamorar</h2>
          <p className="section-subtitle">
            Cuidamos cada detalle: desde la selección de flores hasta la entrega final. Tu experiencia es nuestra prioridad.
          </p>
        </div>

        <div className="row g-4">
          {SERVICES.map((service) => (
            <div className="col-sm-6 col-lg-3" key={service.title}>
              <article className="service-card">
                <div className="service-icon">
                  <i className={`fas ${service.icon}`}></i>
                </div>
                <div className="service-content">
                  <span className="service-badge">{service.badge}</span>
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                </div>
              </article>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;