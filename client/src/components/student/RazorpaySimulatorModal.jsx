import React, { useState } from 'react';
import { X, ShieldCheck, CheckCircle2, Lock, Smartphone, CreditCard, Landmark, ArrowRight } from 'lucide-react';

export const RazorpaySimulatorModal = ({ isOpen, onClose, order, user, onSuccess }) => {
  const [method, setMethod] = useState('upi'); // 'upi' | 'card' | 'netbanking'
  const [upiId, setUpiId] = useState('applicant@okhdfcbank');
  const [processing, setProcessing] = useState(false);

  if (!isOpen) return null;

  const handleSimulatedPayment = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      const mockPaymentId = `pay_rzp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const mockSignature = `sig_valid_${Date.now()}`;
      onSuccess({
        razorpay_order_id: order?.id || 'order_iem_mock_001',
        razorpay_payment_id: mockPaymentId,
        razorpay_signature: mockSignature
      });
      onClose();
    }, 1200);
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: '440px', padding: 0, overflow: 'hidden', borderRadius: '12px' }}
      >
        {/* Razorpay Brand Header */}
        <div style={{ backgroundColor: '#02042B', color: '#FFFFFF', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#0C2340' }}>
                <span style={{ color: '#3395FF' }}>Razor</span>pay
              </span>
              <span style={{ fontSize: '0.65rem', background: '#3395FF', color: '#000', fontWeight: 700, padding: '1px 5px', borderRadius: '3px' }}>
                GATEWAY
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
              Institute of Engineering & Management (IEM)
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Amount to Pay</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF' }}>
              ₹85,000.00
            </div>
          </div>
        </div>

        {/* Security bar */}
        <div style={{ background: '#F8FAFC', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', fontSize: '0.725rem', color: '#475569' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Lock size={12} color="#059669" /> 256-bit SSL Encrypted & RBI Compliant
          </span>
          <span style={{ fontFamily: 'monospace', color: '#64748B' }}>
            {order?.id || 'order_iem_demo'}
          </span>
        </div>

        {/* Body Content */}
        <div style={{ padding: '1.25rem 1.5rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
            Select Payment Method:
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1.5rem' }}>
            <div 
              onClick={() => setMethod('upi')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: '8px',
                border: method === 'upi' ? '2px solid #2563EB' : '1px solid #E2E8F0',
                background: method === 'upi' ? '#EFF6FF' : '#FFFFFF',
                cursor: 'pointer'
              }}
            >
              <Smartphone size={18} color={method === 'upi' ? '#2563EB' : '#64748B'} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0F172A' }}>UPI / QR (Google Pay, PhonePe, Paytm)</div>
                <div style={{ fontSize: '0.725rem', color: '#64748B' }}>Instant zero-fee settlement</div>
              </div>
              {method === 'upi' && <CheckCircle2 size={18} color="#2563EB" />}
            </div>

            <div 
              onClick={() => setMethod('card')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: '8px',
                border: method === 'card' ? '2px solid #2563EB' : '1px solid #E2E8F0',
                background: method === 'card' ? '#EFF6FF' : '#FFFFFF',
                cursor: 'pointer'
              }}
            >
              <CreditCard size={18} color={method === 'card' ? '#2563EB' : '#64748B'} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0F172A' }}>Debit / Credit Card</div>
                <div style={{ fontSize: '0.725rem', color: '#64748B' }}>Visa, MasterCard, RuPay, Maestro</div>
              </div>
              {method === 'card' && <CheckCircle2 size={18} color="#2563EB" />}
            </div>

            <div 
              onClick={() => setMethod('netbanking')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: '8px',
                border: method === 'netbanking' ? '2px solid #2563EB' : '1px solid #E2E8F0',
                background: method === 'netbanking' ? '#EFF6FF' : '#FFFFFF',
                cursor: 'pointer'
              }}
            >
              <Landmark size={18} color={method === 'netbanking' ? '#2563EB' : '#64748B'} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0F172A' }}>Net Banking</div>
                <div style={{ fontSize: '0.725rem', color: '#64748B' }}>SBI, HDFC, ICICI, Axis & 50+ Banks</div>
              </div>
              {method === 'netbanking' && <CheckCircle2 size={18} color="#2563EB" />}
            </div>
          </div>

          {method === 'upi' && (
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Virtual Payment Address (VPA / UPI ID)</label>
              <input
                type="text"
                value={upiId}
                onChange={e => setUpiId(e.target.value)}
                className="form-input"
                placeholder="username@bank"
              />
            </div>
          )}

          <button
            onClick={handleSimulatedPayment}
            disabled={processing}
            className="btn btn-primary btn-lg"
            style={{ width: '100%', height: '48px', fontSize: '0.95rem', background: '#3395FF', color: '#FFFFFF', fontWeight: 700 }}
          >
            {processing ? 'Connecting Gateway & Authorizing...' : 'Pay ₹85,000 Securely'}
          </button>
        </div>

        {/* Footer */}
        <div style={{ background: '#F1F5F9', padding: '10px 16px', textAlign: 'center', fontSize: '0.7rem', color: '#64748B', borderTop: '1px solid #E2E8F0' }}>
          Simulated Sandbox Gateway for IEM DevForge Prototype
        </div>
      </div>
    </div>
  );
};

export default RazorpaySimulatorModal;
