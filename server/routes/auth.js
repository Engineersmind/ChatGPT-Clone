const express = require('express');
const router = express.Router();

const { registerUser, loginUser, logoutUser } = require('../controllers/authController');
const { authenticateUser } = require('../middleware/auth_middleware');


// ADDED: Import the protect middleware
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);

// ADDED: A protected route to get the logged-in user's data
// The frontend will call this on page load to check for an active session
router.get('/me', protect, getMe);

// Route for http://<your-server>/api/auth/logout
router.post('/logout', authenticateUser, logoutUser);

module.exports = router;