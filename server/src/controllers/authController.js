import { firebaseAuth, isMock } from '../config/firebaseAdmin.js';

// Predefined demo accounts
const DEMO_USERS = [
  { uid: 'usr_rahul_1042', email: 'rahul.sen26@gmail.com', name: 'Rahul Sen', role: 'student', applicationId: 'IEM-2026-1042' },
  { uid: 'usr_ananya_1088', email: 'ananya.roy@gmail.com', name: 'Ananya Roy', role: 'student', applicationId: 'IEM-2026-1088' },
  { uid: 'usr_sourav_1145', email: 'sourav.banerjee06@gmail.com', name: 'Sourav Banerjee', role: 'student', applicationId: 'IEM-2026-1145' },
  { uid: 'usr_priya_1204', email: 'priya.das.engg@gmail.com', name: 'Priya Das', role: 'student', applicationId: 'IEM-2026-1204' },
  { uid: 'usr_arpan_1250', email: 'arpan.mukherjee@gmail.com', name: 'Arpan Mukherjee', role: 'student', applicationId: 'IEM-2026-1250' },
  { uid: 'usr_admin_01', email: 'admin@iem.edu.in', name: 'Prof. A. K. Banerjee (Convener)', role: 'admin' }
];

export const getDemoUsers = (req, res) => {
  res.json({
    success: true,
    users: DEMO_USERS,
    mode: isMock ? 'mock' : 'live'
  });
};

export const verifyCurrentSession = async (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
};

export const loginWithDemo = async (req, res) => {
  const { uid } = req.body;
  const user = DEMO_USERS.find(u => u.uid === uid) || DEMO_USERS[0];

  const mockToken = `mock-token-${user.role}-${user.uid}`;
  res.json({
    success: true,
    token: mockToken,
    user
  });
};

export const registerApplicant = async (req, res) => {
  const { email, fullName, phone, uid } = req.body;
  if (!email || !fullName) {
    return res.status(400).json({ success: false, message: 'Full name and email are required' });
  }

  const userUid = uid || `usr_${Date.now()}`;
  const newUser = {
    uid: userUid,
    email,
    name: fullName,
    phone: phone || '',
    role: 'student'
  };

  res.json({
    success: true,
    message: 'Applicant registered successfully',
    user: newUser
  });
};

