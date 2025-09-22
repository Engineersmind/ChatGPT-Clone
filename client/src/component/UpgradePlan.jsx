import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Shield, Zap, Eye, EyeOff } from "lucide-react";
 
const UpgradePlan = ({ darkMode, onClose, onUpgradeSuccess }) => {
  const [showPayment, setShowPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState("card");
  const [showCVC, setShowCVC] = useState(false);
 
  const [cardData, setCardData] = useState({
    number: "",
    expiry: "",
    cvc: "",
    name: "",
  });
 
  const textColor = darkMode ? "#f8f9fa" : "#212529";
 
  const formatCardNumber = (value) => {
    return value
      .replace(/\D/g, "")
      .slice(0, 16)
      .replace(/(.{4})/g, "$1 ")
      .trim();
  };
 
  const formatExpiry = (value) => {
    return value
      .replace(/\D/g, "")
      .replace(/^(\d{2})(\d{1,2})?/, (match, m1, m2) => {
        return m2 ? `${m1}/${m2}` : m1;
      })
      .slice(0, 5);
  };
 
  const formatCVC = (value) => value.replace(/\D/g, "").slice(0, 4);
 
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;
 
    if (name === "number") formattedValue = formatCardNumber(value);
    if (name === "expiry") formattedValue = formatExpiry(value);
    if (name === "cvc") formattedValue = formatCVC(value);
 
    setCardData((prev) => ({ ...prev, [name]: formattedValue }));
  };
 
  const handleFakePayment = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
 
    await new Promise((resolve) => setTimeout(resolve, 2000));
 
    setPaymentSuccess(true);
    setIsProcessing(false);
 
    setTimeout(() => {
      setShowPayment(false);
      setPaymentSuccess(false);
      onUpgradeSuccess?.();
      onClose();
    }, 2000);
  };
 
  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ zIndex: 2000, position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}
      >
        <motion.div
          className={`modal-content rounded-4 shadow-lg ${darkMode ? "bg-dark text-light" : "bg-white text-dark"}`}
          style={{ maxWidth: 800, width: "90%", overflow: "hidden", margin: "auto", position: "relative" }}
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {/* Header */}
          <div className="modal-header border-0 pb-0 d-flex justify-content-between align-items-center px-4 pt-4">
            <h3 style={{ color: textColor, margin: 0, fontWeight: 'bold' }}>Upgrade Your Plan</h3>
            <button
              type="button"
              className={`btn-close ${darkMode ? "btn-close-white" : ""}`}
              onClick={onClose}
              style={{
                border: "none",
                background: "transparent",
                fontSize: "1.5rem",
                cursor: "pointer",
                position: "relative",
                zIndex: 10,
                padding: 0,
                lineHeight: 1,
              }}
              aria-label="Close"
            >
              ×
            </button>
          </div>
 
          <div className="modal-body px-4 py-3">
            {!showPayment ? (
              <>
                <p style={{ color: textColor, marginBottom: "1rem" }}>
                  Choose a plan that works best for you. Upgrade anytime.
                </p>
 
                <div className="row g-4">
                  {/* Free Plan */}
                  <div className="col-12 col-md-6">
                    <motion.div
                      whileHover={{ y: -4 }}
                      className="card h-100 border-0 rounded-4"
                      style={{
                        background: "#fff", // Always white
                        color: "#212529",   // Always dark text
                        boxShadow: "0 0.125rem 0.25rem rgb(0 0 0 / 0.075)",
                      }}
                    >
                      <div className="card-body">
                        <h4 style={{ color: "#212529" }}>Free</h4>
                        <p style={{ color: "#6c757d" }}>For casual use</p>
                        <div className="my-4">
                          <h2 style={{ color: "#212529" }}>₹0</h2>
                          <small style={{ color: "#6c757d" }}>forever</small>
                        </div>
                        <ul className="list-unstyled">
                          <li>
                            <Check className="me-2 text-success" /> Access to QuantumChat-3.5
                          </li>
                          <li>
                            <Check className="me-2 text-success" /> Standard response speed
                          </li>
                          <li>
                            <Check className="me-2 text-success" /> Limited features
                          </li>
                        </ul>
                        <button className="btn btn-outline-primary w-100" disabled>
                          Current Plan
                        </button>
                      </div>
                    </motion.div>
 
                  </div>
 
                  {/* Pro Plan */}
                  <div className="col-12 col-md-6">
                    <motion.div
                      whileHover={{ y: -4 }}
                      className="card h-100 border-0 rounded-4 text-white"
                      style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }}
                    >
                      <div className="card-body position-relative">
                        <span className="badge bg-warning text-dark position-absolute top-0 end-0 m-3">
                          Popular
                        </span>
                        <h4>
                          Pro <Zap className="ms-1" />
                        </h4>
                        <p>For power users & professionals</p>
                        <div className="my-4">
                          <h2>₹1,299</h2>
                          <small>per month</small>
                        </div>
                        <ul>
                          <li><Check className="me-2" /> Access QuantumChat-4</li>
                          <li><Check className="me-2" /> Faster response speed</li>
                          <li><Check className="me-2" /> Priority support</li>
                          <li><Check className="me-2" /> Advanced customization</li>
                        </ul>
                        <button className="btn btn-light w-100 fw-bold text-primary" onClick={() => setShowPayment(true)}>
                          Upgrade Now
                        </button>
                      </div>
                    </motion.div>
                  </div>
                </div>
 
                <div
                  className={`${darkMode ? "bg-gray-800 text-light" : "bg-light text-muted"}`}
                  style={{ fontSize: "0.875rem", marginTop: "1rem", padding: "1rem", borderRadius: "0.5rem" }}
                >
                  <div className="d-flex align-items-center">
                    <Shield className="me-2 text-success" />
                    <small>
                      Your payment information is encrypted and secure. We never store your card details.
                    </small>
                  </div>
                </div>
              </>
            ) : (
              <AnimatePresence>
                {!paymentSuccess ? (
                  <motion.div key="payment-form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <h4 style={{ color: textColor, marginBottom: "1rem" }}>Complete Payment</h4>
                    {selectedMethod === "card" && (
                      <form onSubmit={handleFakePayment}>
                        <div className="mb-3">
                          <label>Card Number</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="1234 5678 9012 3456"
                            name="number"
                            value={cardData.number}
                            onChange={handleInputChange}
                            required
                            autoComplete="cc-number"
                            maxLength={19}
                          />
                        </div>
                        <div className="row">
                          <div className="col-md-6 mb-3">
                            <label>Expiry Date</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="MM/YY"
                              name="expiry"
                              value={cardData.expiry}
                              onChange={handleInputChange}
                              required
                              autoComplete="cc-exp"
                            />
                          </div>
                          <div className="col-md-6 mb-3">
                            <label>CVV</label>
                            <div className="input-group">
                              <input
                                type={showCVC ? "text" : "password"}
                                className="form-control"
                                placeholder="123"
                                name="cvc"
                                value={cardData.cvc}
                                onChange={handleInputChange}
                                required
                                autoComplete="cc-csc"
                              />
                              <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={() => setShowCVC(!showCVC)}
                              >
                                {showCVC ? <EyeOff /> : <Eye />}
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="mb-3">
                          <label>Cardholder Name</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Enter Card Holder Name"
                            name="name"
                            value={cardData.name}
                            onChange={handleInputChange}
                            required
                            autoComplete="cc-name"
                          />
                        </div>
                        <div className="d-grid gap-2">
                          <button type="submit" className="btn btn-primary btn-lg" disabled={isProcessing}>
                            {isProcessing ? "Processing..." : "Pay ₹1,299"}
                          </button>
                          <button type="button" className="btn btn-link text-success" onClick={() => setShowPayment(false)}>
                            ← Back to plans
                          </button>
                        </div>
                      </form>
                    )}
                  </motion.div>
                ) : (
                  <motion.div className="text-center py-5" style={{ color: "green" }}>
                    <Check size={80} />
                    <h3 className="mt-4">Payment Successful!</h3>
                    <p>Your plan has been upgraded to Pro.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
 
export default UpgradePlan;