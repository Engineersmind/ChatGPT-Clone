const express = require('express');
const router = express.Router();

const { registerUser, loginUser, logoutUser, getCurrentUser } = require('../controllers/authController');
const { authenticateUser } = require('../middleware/auth_middleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);

router.get('/me', authenticateUser, getCurrentUser);

module.exports = router;