const express = require('express');
const router = express.Router();

const { registerUser, loginUser, logoutUser, getCurrentUser, updateUserPlan, resetPasswordWithToken } = require('../controllers/authController');
const { authenticateUser } = require('../middleware/auth_middleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);

router.get('/me', authenticateUser, getCurrentUser);
router.patch('/plan', authenticateUser, updateUserPlan);
router.put('/password', resetPasswordWithToken);

module.exports = router;