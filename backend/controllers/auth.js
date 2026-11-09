const User = require('../models/User');

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = async (req, res, next) => {
    try {
        //role is never taken from the body: everyone registers as 'user'.
        //Admins are created only through seeder.js.
        const { name, tel, email, password } = req.body;

        //Create user
        const user = await User.create({
            name,
            tel,
            email,
            password
        });

        sendTokenResponse(user, 201, res);
    } catch (err) {
        console.log(err.stack);

        if (err.code === 11000) {
            return res.status(400).json({ success: false, message: 'Email is already registered' });
        }
        if (err.name === 'ValidationError') {
            return res.status(400).json({ success: false, message: err.message });
        }
        res.status(500).json({ success: false, message: 'Cannot register user' });
    }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide an email and password' });
        }

        const user = await User.findOne({ email: String(email).toLowerCase() }).select('+password');
        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        sendTokenResponse(user, 200, res);
    } catch (err) {
        console.log(err.stack);
        res.status(500).json({
            success: false,
            message: process.env.NODE_ENV === 'development' ? err.message : 'Server error'
        });
    }
};

// @desc    Log user out / clear cookie
// @route   GET /api/v1/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });

    res.status(200).json({
        success: true,
        data: {}
    });
};

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (err) {
        console.log(err.stack);
        res.status(500).json({ success: false, message: 'Cannot get user' });
    }
};

const sendTokenResponse = (user, statusCode, res) => {

    // Create token
    const token = user.getSignedJwtToken();

    const options = {
        expires: new Date(
            Date.now() +
            process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
        ),
        httpOnly: true
    };

    if (process.env.NODE_ENV === 'production') {
        options.secure = true;
    }

    res
        .status(statusCode)
        .cookie('token', token, options)
        .json({
            success: true,
            token
        });
};
