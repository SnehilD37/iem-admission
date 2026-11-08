// Razorpay client integration service

export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const initiateRazorpayPayment = async ({ order, keyId, user, onPaymentSuccess, onPaymentDismiss }) => {
  const isLoaded = await loadRazorpayScript();
  const isMock = import.meta.env.VITE_USE_MOCK_RAZORPAY === 'true' || keyId.includes('placeholder') || keyId.includes('demo');

  // If live Razorpay checkout SDK is present and not explicitly forced mock:
  if (isLoaded && !isMock && window.Razorpay) {
    const options = {
      key: keyId,
      amount: order.amount,
      currency: order.currency || 'INR',
      name: 'Institute of Engineering & Management',
      description: 'B.Tech Admission & Semester Fee 2027-28',
      image: 'https://iem.edu.in/wp-content/uploads/2019/08/iem-logo.png',
      order_id: order.id,
      handler: function (response) {
        onPaymentSuccess({
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature
        });
      },
      prefill: {
        name: user?.name || 'Applicant',
        email: user?.email || 'applicant@iem.edu.in',
        contact: user?.phone || '9830000000'
      },
      theme: {
        color: '#1E3A8A'
      },
      modal: {
        ondismiss: function () {
          if (onPaymentDismiss) onPaymentDismiss();
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
    return { mode: 'live' };
  } else {
    // In mock mode, we signal the caller to open our built-in high-fidelity Razorpay modal simulator
    return { mode: 'simulation' };
  }
};
