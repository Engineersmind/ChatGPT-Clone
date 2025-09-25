const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const crypto = require('node:crypto');



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
console.log('Logging out user');
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

exports.googleAuth = async (req, res) => {
  try {
    const { email, name, googleId } = req.body;

    if (!email || !googleId) {
      return res.status(400).json({ message: "Invalid Google user data" });
    }

    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        email,
        username: name,
        googleId,
        provider: 'google'
      });
      await user.save();
    }

    // ✅ Generate JWT
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ user, token });
  } catch (err) {
    console.error("Google Auth Error:", err);
    res.status(500).json({ message: "Google login failed" });
  }
};

exports.sendResetPasswordLink = async (req, res) => {
  const { email } = req.body;
  console.log('DEBUG BACKEND: Request to reset password for email =', email);

  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (!user) {
      console.log('DEBUG BACKEND: User not found, returning generic message');
      return res.json({ message: 'If an account exists, a reset link has been sent.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    console.log('DEBUG BACKEND: Generated reset token =', token);

    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();
    console.log('DEBUG: saved user token:', user.resetPasswordToken);

    const resetLink = `${process.env.FRONTEND_URL}/login?reset_token=${token}&email=${encodeURIComponent(email)}`;
    console.log('DEBUG BACKEND: Reset link =', resetLink);

    res.json({ message: 'If an account exists, a reset link has been sent.' });
  } catch (err) {
    console.error('DEBUG BACKEND ERROR:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.resetPassword = async (req, res) => {
  const { email, token, newPassword } = req.body;
  console.log('DEBUG BACKEND: Received email =', email);
  console.log('DEBUG BACKEND: Received token =', token);

  if (!email || !token || !newPassword) {
    return res.status(400).json({ message: 'Email, token, and new password are required.' });
  }

  try {
    const emailNormalized = email.trim().toLowerCase();
    console.log('DEBUG BACKEND: Normalized email =', emailNormalized);

    const user = await User.findOne({
      email: emailNormalized,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }, // token not expired
    });

    if (!user) {
      console.log('DEBUG BACKEND: No matching user found or token expired');
      return res.status(400).json({ message: 'Invalid or expired token.' });
    }

    console.log('DEBUG BACKEND: User found, resetting password:', user.email);

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();
    console.log('DEBUG BACKEND: Password reset successful');

    res.json({ message: 'Password has been reset successfully.' });
  } catch (err) {
    console.error('DEBUG BACKEND ERROR:', err);
    res.status(500).json({ message: 'Server error while resetting password.' });
  }
};
