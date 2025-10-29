import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import Admin from './pages/Admin.jsx'

// IMPORTAR EL PROVIDER Y TOASTIFY
import { AppProvider } from './context/AppContext.jsx'
import { ToastContainer } from 'react-toastify';

// Bootstrap
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

// Font Awesome
import '@fortawesome/fontawesome-free/css/all.min.css'

// React Toastify CSS
import 'react-toastify/dist/ReactToastify.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* ENVOLVEMOS TODA LA APP CON EL PROVIDER */}
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </BrowserRouter>

      {/* PONEMOS EL TOAST CONTAINER AQUÍ PARA QUE FUNCIONE EN TODAS LAS RUTAS */}
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="light"
      />
    </AppProvider>
  </StrictMode>,
)