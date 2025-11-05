import { useState } from 'react';

import Header from './components/Header';
import Hero from './components/Hero';
import Services from './components/Services';
import Products from './components/Products';
import Footer from './components/Footer';

// Modales
import AuthModal from './components/modals/AuthModal';
import CartModal from './components/modals/CartModal';
import CheckoutModal from './components/modals/CheckoutModal';
import PaymentModal from './components/modals/PaymentModal';
import OrdersModal from './components/modals/OrdersModal';

function App() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [currentOrderTotal, setCurrentOrderTotal] = useState(null);

  const handleOrderCreated = (orderId, total) => {
    setCurrentOrderId(orderId);
    setCurrentOrderTotal(total);
    setShowPaymentModal(true);
  };

  return (
    <div className="app-shell">
      <Header
        onShowAuth={() => setShowAuthModal(true)}
        onShowCart={() => setShowCartModal(true)}
        onShowOrders={() => setShowOrdersModal(true)}
      />

      <main className="page-content">
        <Hero />
        <Services />
        <Products onShowAuth={() => setShowAuthModal(true)} />
      </main>

      <Footer />

      <AuthModal
        show={showAuthModal}
        onHide={() => setShowAuthModal(false)}
      />

      <CartModal
        show={showCartModal}
        onHide={() => setShowCartModal(false)}
        onCheckout={() => setShowCheckoutModal(true)}
      />

      <CheckoutModal
        show={showCheckoutModal}
        onHide={() => setShowCheckoutModal(false)}
        onOrderCreated={handleOrderCreated}
      />

      <PaymentModal
        show={showPaymentModal}
        onHide={() => setShowPaymentModal(false)}
        orderId={currentOrderId}
        total={currentOrderTotal}
      />

      <OrdersModal
        show={showOrdersModal}
        onHide={() => setShowOrdersModal(false)}
      />
    </div>
  );
}

export default App;