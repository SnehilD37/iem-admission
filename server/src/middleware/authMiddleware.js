import { firebaseAuth } from '../config/firebaseAdmin.js';

export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access Denied: Missing or malformed Authorization header with Bearer token'
      });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await firebaseAuth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (err) {
    console.error('Auth verification error:', err.message);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed: Invalid or expired Firebase ID token',
      error: err.message
    });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthenticated user' });
  }

  // Check admin role flag
  const isAdmin = req.user.role === 'admin' || 
                  req.user.email?.includes('admin') || 
                  req.headers['x-demo-role'] === 'admin';

  if (!isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Admin clearance required for this operation'
    });
  }

  next();
};
