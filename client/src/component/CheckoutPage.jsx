import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function CheckoutPage() {
  const navigate = useNavigate();
  return (
    <div className="container py-5">
      <div className="card shadow-sm mx-auto" style={{ maxWidth: 600 }}>
        <div className="card-body">
          <h2 className="card-title mb-3">Checkout</h2>
          <p className="text-muted">This is a placeholder checkout page. Integrate your payment provider here.</p>
          <ul className="list-group mb-4">
            <li className="list-group-item d-flex justify-content-between">
              <span>Plan</span><strong>Pro</strong>
            </li>
            <li className="list-group-item d-flex justify-content-between">
              <span>Price</span><strong>$19.00 / mo</strong>
            </li>
          </ul>
          <button className="btn btn-primary me-2" onClick={() => navigate('/')}>Return</button>
          <button className="btn btn-success" onClick={() => { alert('Simulated purchase complete'); navigate('/'); }}>Complete Purchase</button>
        </div>
      </div>
    </div>
  );
}
