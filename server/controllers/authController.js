const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const crypto = require('node:crypto');
const https = require('https');



if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}


const TOKEN_EXPIRY_DAYS = 30;
const PASSWORD_RESET_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

const getClientBaseUrl = () => {
  const {
    PASSWORD_RESET_URL,
    CLIENT_RESET_URL,
    CLIENT_APP_URL,
    CLIENT_ORIGIN,
    CLIENT_ORIGINS,
  } = process.env;

  const firstConfiguredOrigin = CLIENT_ORIGINS?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)?.[0];

  return (
    PASSWORD_RESET_URL ||
    CLIENT_RESET_URL ||
    CLIENT_APP_URL ||
    CLIENT_ORIGIN ||
    firstConfiguredOrigin ||
    'http://localhost:5173'
  ).replace(/\/$/, '');
};

const sendPasswordResetEmail = async ({ user, resetLink }) => {
  const serviceId = process.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = process.env.VITE_EMAILJS_FORGOT_PASSWORD_TEMPLATE_ID;
  const publicKey = process.env.VITE_EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey) {
    throw new Error('EmailJS configuration is missing');
  }

  const emailData = JSON.stringify({
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    template_params: {
      username: user.username || user.email.split('@')[0],
      to_email: user.email,
      reset_link: resetLink,
    },
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.emailjs.com',
      port: 443,
      path: '/api/v1.0/email/send',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(emailData),
        'User-Agent': 'Node.js EmailJS Client',
        'Origin': 'https://quantumchat.com', // Fake a browser origin
        'Referer': 'https://quantumchat.com/',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(data);
        } else {
          reject(new Error(`EmailJS request failed: ${res.statusCode} ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(emailData);
    req.end();
  });
};

const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: `${TOKEN_EXPIRY_DAYS}d`,
  });

const buildUserPayload = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  provider: user.provider,
  pro: typeof user.pro === 'number' ? user.pro : 0,
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


exports.updateUserPlan = async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const { pro } = req.body || {};

  if (!userId) {
    return res.status(401).json({ message: 'Not authenticated.' });
  }

  if (typeof pro === 'undefined') {
    return res.status(400).json({ message: 'Missing required field: pro.' });
  }

  const normalizedPro = Number(pro) === 1 ? 1 : 0;

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { pro: normalizedPro },
      { new: true, runValidators: true, context: 'query' }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.status(200).json({
      message: 'Plan updated successfully.',
      user: buildUserPayload(user),
    });
  } catch (error) {
    console.error('Error updating user plan:', error);
    return res.status(500).json({ message: 'Server error while updating plan.' });
  }
};

// const bcrypt = require('bcryptjs');

exports.requestPasswordReset = async (req, res) => {
  const { email } = req.body || {};

  if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(200).json({ message: 'If an account exists for that email, a password reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + PASSWORD_RESET_EXPIRY_MS;

    await user.save({ validateBeforeSave: false });

    const resetUrlBase = getClientBaseUrl();
    const resetLink = `${resetUrlBase}/login?reset_token=${resetToken}&email=${encodeURIComponent(user.email)}`;

    try {
      await sendPasswordResetEmail({ user, resetLink });
      return res.status(200).json({ message: 'If an account exists for that email, a password reset link has been sent.' });
    } catch (mailError) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save({ validateBeforeSave: false });
      console.error('Error sending password reset email:', mailError);
      return res.status(500).json({ message: 'Failed to send reset email. Please try again later.' });
    }
  } catch (error) {
    console.error('Error handling password reset request:', error);
    return res.status(500).json({ message: 'Server error while processing password reset request.' });
  }
};

exports.resetPasswordWithToken = async (req, res) => {
  const { email, password, token } = req.body || {};

  if (!email || !password || !token) {
    return res.status(400).json({ message: 'Email, token, and new password are required.' });
  }

  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      email: normalizedEmail,
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    }).select('+password');

    if (!user) {
      return res.status(400).json({ message: 'Password reset link is invalid or has expired.' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    if (user.provider !== 'local') {
      user.provider = 'local';
    }

    await user.save();

    return res.status(200).json({ message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Error resetting password:', error);
    return res.status(500).json({ message: 'Server error while resetting password.' });
  }
};

