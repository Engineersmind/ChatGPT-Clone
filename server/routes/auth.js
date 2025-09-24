const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  logoutUser,
  getMe // ADDED: Import getMe controller
} = require('../controllers/authController');

// ADDED: Import the protect middleware
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);

// ADDED: A protected route to get the logged-in user's data
// The frontend will call this on page load to check for an active session
router.get('/me', protect, getMe);

module.exports = router;