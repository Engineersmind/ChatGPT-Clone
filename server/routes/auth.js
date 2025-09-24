const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');

// Route for http://<your-server>/api/auth/register
router.post('/register', registerUser);

// Route for http://<your-server>/api/auth/login
router.post('/login', loginUser);

module.exports = router;