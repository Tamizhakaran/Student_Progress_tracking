const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    getMe,
    forgotPassword,
    resetPassword,
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', (req, res) => res.json({ status: 'API is running', version: '1.0.0' }));
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);

// @route   GET /api/forgotpassword
// @desc    Redirect to frontend forgot password page
router.get('/forgotpassword', (req, res) => {
    res.redirect(`${process.env.FRONTEND_URL}/forgot-password`);
});
router.post('/forgotpassword', forgotPassword);

// @route   GET /api/resetpassword/:resettoken
// @desc    Redirect to frontend reset password page
router.get('/resetpassword/:resettoken', (req, res) => {
    res.redirect(`${process.env.FRONTEND_URL}/reset-password/${req.params.resettoken}`);
});
router.put('/resetpassword/:resettoken', resetPassword);

module.exports = router;
