const express = require('express');
const router = express.Router();
const { registerUser, loginUser, logoutUser } = require('../controllers/authController');
const { authenticateUser } = require('../middleware/auth_middleware');

// Route for http://<your-server>/api/auth/register
router.post('/register', registerUser);

// Route for http://<your-server>/api/auth/login
router.post('/login', loginUser);

// Route for http://<your-server>/api/auth/logout
router.post('/logout', authenticateUser, logoutUser);

module.exports = router;