const Footer = () => {
  return (
    <footer className="bg-dark text-white py-5">
      <div className="container">
        <div className="row">
          <div className="col-md-4">
            <h5 className="text-primary">Le Rose Boutique</h5>
            <p className="text-white-50">Las flores más hermosas</p>
          </div>
          <div className="col-md-4">
            <h5 className="text-primary">Contacto</h5>
            <p className="text-white-50">+51 943 123 456</p>
          </div>
          <div className="col-md-4">
            <h5 className="text-primary">Síguenos</h5>
            <i className="fab fa-facebook text-white fs-4 me-3"></i>
            <i className="fab fa-instagram text-white fs-4"></i>
          </div>
        </div>
        <hr className="border-secondary my-4" />
        <p className="text-center text-white-50 mb-0">© 2025 Le Rose Boutique</p>
      </div>
    </footer>
  );
};

export default Footer;