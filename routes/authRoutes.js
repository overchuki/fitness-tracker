const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const authController = require('../controllers/authController');

router.get('/login', authController.get_login);

router.get('/signup', authController.get_signup);

router.post('/login', authController.login_user);

router.post('/signup', authController.signup_user);

router.get('/settings', requireAuth, authController.get_settings);

router.put('/modify', requireAuth, authController.mod_user);

router.get('/logout', requireAuth, authController.logout_user);

router.delete('/remove', requireAuth, authController.rem_user);

module.exports = router;