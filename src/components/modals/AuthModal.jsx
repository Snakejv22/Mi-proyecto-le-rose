import { useState } from 'react';
import { useApp } from '../../context/AppContext';

const AuthModal = ({ show, onHide }) => {
  const { login, register } = useApp();
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    fullName: '', email: '', password: '', phone: '', address: ''
  });

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await login(loginForm.email, loginForm.password);
    setLoading(false);
    if (result.success) {
      onHide();
      setLoginForm({ email: '', password: '' });
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await register(registerForm);
    setLoading(false);
    if (result.success) {
      onHide();
      setRegisterForm({ fullName: '', email: '', password: '', phone: '', address: '' });
    }
  };

  if (!show) return null;

  return (
    <>
      <div className="modal fade show modal-custom" style={{display: 'block'}} tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{mode === 'login' ? 'Iniciar Sesión' : 'Registrarse'}</h5>
              <button type="button" className="btn-close btn-close-white" onClick={onHide}></button>
            </div>
            <div className="modal-body">
              {mode === 'login' ? (
                <form onSubmit={handleLoginSubmit}>
                  <div className="mb-3">
                    <input type="email" className="form-control" placeholder="Email"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                      required disabled={loading} />
                  </div>
                  <div className="mb-3">
                    <input type="password" className="form-control" placeholder="Contraseña"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                      required disabled={loading} />
                  </div>
                  <button type="submit" className="btn btn-primary-custom w-100 mb-3" disabled={loading}>
                    {loading ? 'Iniciando...' : 'Iniciar Sesión'}
                  </button>
                  <p className="text-center mb-0">
                    ¿No tienes cuenta? <a href="#" onClick={(e) => { e.preventDefault(); setMode('register'); }}>Regístrate aquí</a>
                  </p>
                </form>
              ) : (
                <form onSubmit={handleRegisterSubmit}>
                  <div className="mb-3">
                    <input type="text" className="form-control" placeholder="Nombre Completo"
                      value={registerForm.fullName}
                      onChange={(e) => setRegisterForm({...registerForm, fullName: e.target.value})}
                      required disabled={loading} />
                  </div>
                  <div className="mb-3">
                    <input type="email" className="form-control" placeholder="Email"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                      required disabled={loading} />
                  </div>
                  <div className="mb-3">
                    <input type="password" className="form-control" placeholder="Contraseña (mín. 6 caracteres)"
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                      required minLength="6" disabled={loading} />
                  </div>
                  <div className="mb-3">
                    <input type="tel" className="form-control" placeholder="Teléfono"
                      value={registerForm.phone}
                      onChange={(e) => setRegisterForm({...registerForm, phone: e.target.value})}
                      disabled={loading} />
                  </div>
                  <div className="mb-3">
                    <textarea className="form-control" placeholder="Dirección" rows="2"
                      value={registerForm.address}
                      onChange={(e) => setRegisterForm({...registerForm, address: e.target.value})}
                      disabled={loading}></textarea>
                  </div>
                  <button type="submit" className="btn btn-primary-custom w-100 mb-3" disabled={loading}>
                    {loading ? 'Registrando...' : 'Registrarse'}
                  </button>
                  <p className="text-center mb-0">
                    ¿Ya tienes cuenta? <a href="#" onClick={(e) => { e.preventDefault(); setMode('login'); }}>Inicia sesión aquí</a>
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </>
  );
};

export default AuthModal;