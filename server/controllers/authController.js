const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

exports.registerUser = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    await User.create({ username, email, password });
    res.status(201).json({ success: true, message: 'Registration successful' });
  } catch (error)
 {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }
  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = generateToken(user._id);

    // --- MODIFIED FOR LOCAL DEVELOPMENT ---
    // The original code with `process.env.NODE_ENV` is correct for production,
    // but hardcoding these values helps ensure the cookie is set on http://localhost.
    res.cookie('token', token, {
      httpOnly: true,
      secure: false, // Must be `false` for http (localhost)
      sameSite: 'lax', // `lax` is standard for development
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/',
    });
    // --- END OF MODIFICATION ---

    res.status(200).json({
      _id: user._id,
      username: user.username,
      email: user.email,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.logoutUser = (req, res) => {
    // Also apply the same hardcoded logic here for consistency in development
  res.clearCookie('token', {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
  });
  res.status(200).json({ message: 'Logged out successfully' });
};

exports.getMe = async (req, res) => {

  res.status(200).json(req.user);
};