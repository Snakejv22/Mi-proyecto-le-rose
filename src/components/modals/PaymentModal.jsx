import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_URL, APP_CONFIG } from '../../config';

const PaymentModal = ({ show, onHide, orderId, total }) => {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast.error('Solo se permiten imágenes (JPG, PNG, WEBP)');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        toast.error('El archivo es demasiado grande (máximo 5MB)');
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast.error('Por favor selecciona una imagen del comprobante');
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append('orderId', orderId);
    formData.append('receipt', selectedFile);

    try {
      const response = await axios.post(`${API_URL}/upload_receipt.php`,
        formData,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      if (response.data.success) {
        toast.success('✅ Comprobante subido exitosamente. Tu pedido está en proceso.');
        setSelectedFile(null);
        onHide();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error('Error al subir el comprobante');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  if (!show) return null;

  return (
    <>
      <div className="modal fade show modal-custom" style={{display: 'block'}} tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="fas fa-mobile-alt me-2"></i>
                Realizar Pago - Yape
              </h5>
              <button type="button" className="btn-close btn-close-white" onClick={onHide}></button>
            </div>
            <div className="modal-body text-center">
              <div className="alert alert-info mb-4">
                <i className="fas fa-info-circle me-2"></i>
                <strong>Total a Pagar: S/ {total}</strong>
              </div>

              <h6 className="mb-3">Escanea el código QR de Yape:</h6>
              
              <div className="my-4">
                <img 
                  src="https://via.placeholder.com/200x200/d4568c/ffffff?text=QR+YAPE" 
                  alt="QR Yape"
                  style={{borderRadius: '15px', boxShadow: '0 5px 20px rgba(0,0,0,0.2)', maxWidth: '200px'}}
                />
              </div>
              
              <p className="text-muted small mb-4">
                <i className="fas fa-phone me-2"></i>
                Número Yape: <strong>{APP_CONFIG.contact.yapeNumber}</strong>
              </p>
              
              <hr className="my-4" />
              
              <form onSubmit={handleUpload}>
                <div className="mb-3">
                  <label className="form-label fw-bold">
                    <i className="fas fa-upload me-2"></i>
                    Subir Comprobante de Pago
                  </label>
                  <input 
                    type="file" 
                    className="form-control" 
                    accept="image/*"
                    onChange={handleFileChange}
                    required
                    disabled={uploading}
                  />
                  <small className="text-muted d-block mt-2">
                    Formatos aceptados: JPG, PNG, WEBP (máx. 5MB)
                  </small>
                  {selectedFile && (
                    <div className="alert alert-success mt-2 mb-0">
                      <i className="fas fa-check-circle me-2"></i>
                      Archivo seleccionado: {selectedFile.name}
                    </div>
                  )}
                </div>
                
                <button 
                  type="submit" 
                  className="btn btn-primary-custom w-100"
                  disabled={uploading || !selectedFile}
                >
                  {uploading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-cloud-upload-alt me-2"></i>
                      Subir Comprobante
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </>
  );
};

export default PaymentModal;