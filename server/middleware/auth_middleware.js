const jwt = require('jsonwebtoken');
const User = require('../models/User');

const extractToken = (req) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.split(' ')[1];
    }

    if (req.cookies && req.cookies.token) {
        return req.cookies.token;
    }

    return null;
};

// const authenticateUser = async (req, res, next) => {
//     const token = extractToken(req);

//     if (!token) {
//         return res.status(401).json({ message: 'Access denied. Authentication required.' });
//     }

//     try {
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
//         const user = await User.findById(decoded.id).select('-password');

//         if (!user) {
//             return res.status(401).json({ message: 'Invalid token. User not found.' });
//         }

//         req.user = {
//             id: user._id.toString(),
//             email: user.email,
//             username: user.username,
//             provider: user.provider,
//         };

//         next();
//     } catch (error) {
//         console.error('Auth middleware error:', error);
//         return res.status(401).json({ message: 'Invalid or expired token.' });
//     }
// };

const authenticateUser = (req, res, next) => {
  // get token from headers (Bearer token expected)
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user info from token to req
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token.' });
  }
};


module.exports = { authenticateUser };