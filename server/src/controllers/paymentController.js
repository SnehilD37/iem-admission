import { razorpayInstance, verifyRazorpaySignature, isMock } from '../config/razorpayConfig.js';
import { store, FEE_SCHEDULE } from '../data/initialStore.js';

export const getFeeSchedule = (req, res) => {
  res.json({
    success: true,
    feeSchedule: store.feeSchedule
  });
};

export const createRazorpayOrder = async (req, res) => {
  try {
    const { applicationId } = req.body;
    const application = store.applications.find(a => a.id === applicationId);

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application record not found' });
    }

    if (application.status !== 'SEAT_OFFERED' && application.status !== 'ADMISSION_CONFIRMED') {
      return res.status(400).json({
        success: false,
        message: `Cannot initiate payment for application in status "${application.status}". Seat offer required.`
      });
    }

    const amountInPaise = FEE_SCHEDULE.totalAmount * 100;
    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_iem_${application.id.replace(/[^a-zA-Z0-9]/g, '')}_${Date.now()}`,
      notes: {
        applicationId: application.id,
        candidateName: application.personal?.fullName || 'Candidate',
        allottedBranch: application.allottedBranch || 'CSE'
      }
    };

    const order = await razorpayInstance.orders.create(options);

    res.json({
      success: true,
      order,
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_iem_demo',
      amount: FEE_SCHEDULE.totalAmount,
      isMock
    });
  } catch (err) {
    console.error('Error creating Razorpay order:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate Razorpay transaction order',
      error: err.message
    });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { applicationId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const application = store.applications.find(a => a.id === applicationId);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application record not found' });
    }

    const isValid = verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Payment signature validation failed' });
    }

    const receiptNumber = `IEM/FEE/2026/${Math.floor(1000 + Math.random() * 9000)}`;
    const studentId = application.studentId || `IEM-BTECH-2026-${String(Math.floor(50 + Math.random() * 450)).padStart(3, '0')}`;

    application.status = 'ADMISSION_CONFIRMED';
    application.studentId = studentId;
    application.payment = {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      amount: FEE_SCHEDULE.totalAmount,
      status: 'PAID',
      method: 'Razorpay PG',
      timestamp: new Date().toISOString(),
      receiptNumber
    };

    // Update quota confirmed count
    if (application.allottedBranch && store.quotas[application.allottedBranch]) {
      store.quotas[application.allottedBranch].confirmed = (store.quotas[application.allottedBranch].confirmed || 0) + 1;
    }

    application.history.push({
      timestamp: new Date().toISOString(),
      event: `Admission Fee (₹85,000) processed successfully via Razorpay [Txn ID: ${razorpay_payment_id}]. Student ID assigned: ${studentId}`,
      actor: 'Razorpay Gateway & IEM Accounts'
    });

    store.save();

    res.json({
      success: true,
      message: 'Payment verified and admission confirmed!',
      receiptNumber,
      studentId,
      application
    });
  } catch (err) {
    console.error('Error verifying payment:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to verify transaction',
      error: err.message
    });
  }
};
