const jwt = require('jsonwebtoken');
const User = require('../models/User');

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}


const TOKEN_EXPIRY_DAYS = 30;

const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: `${TOKEN_EXPIRY_DAYS}d`,
  });

const buildUserPayload = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  provider: user.provider,
  createdAt: user.createdAt,
});

const sendTokenResponse = (user, res, statusCode = 200) => {
  const token = generateToken(user._id);
  const maxAgeMs = TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  const isProduction = process.env.NODE_ENV === 'production';

  res
    .status(statusCode)
    .cookie('token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: maxAgeMs,
    })
    .json({
      message: 'Success',
      user: buildUserPayload(user),
      token,
    });

};

exports.registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Username, email, and password are required.' });
  }

  try {

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim();

    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { username: normalizedUsername }],
    });

    if (existingUser) {
      return res.status(409).json({ message: 'User with this email or username already exists.' });
    }

    const user = await User.create({
      username: normalizedUsername,
      email: normalizedEmail,
      password,
    });

    return sendTokenResponse(user, res, 201);
  } catch (error) {
    console.error('Error registering user:', error);
    return res.status(500).json({ message: 'Server error while registering user.' });

  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;


  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user || !user.password) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    user.password = undefined;

    return sendTokenResponse(user, res);

  } catch (error) {
    console.error('Error logging in user:', error);
    return res.status(500).json({ message: 'Server error while logging in.' });
  }
};

exports.logoutUser = (req, res) => {

  res
    .cookie('token', '', {
      httpOnly: true,
      expires: new Date(0),
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
    .status(200)
    .json({ message: 'Logged out successfully.' });
};

exports.getCurrentUser = async (req, res) => {
  const userId = req.user?.id || req.user?._id;

  if (!userId) {
    return res.status(401).json({ message: 'Not authenticated.' });
  }

  try {
    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.status(200).json(buildUserPayload(user));
  } catch (error) {
    console.error('Error fetching current user:', error);
    return res.status(500).json({ message: 'Server error while fetching user.' });
  }
};
