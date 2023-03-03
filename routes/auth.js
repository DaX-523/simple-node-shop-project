const express = require('express');
const { check, body } = require('express-validator');

const authController = require('../controllers/auth');
const User = require('../models/user')

const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post('/login',
    [
        check('email', 'Please enter a valid email!')
            .isEmail()
            .normalizeEmail(),
        body('password', 'Please enter a password longer than 6 characters with alphanumeric values only!')
            .isLength({ min: 6 })
            .isAlphanumeric()
    ],
    authController.postLogin);

router.post('/signup',
    [
        check('email', 'Please enter a valid email!')
            .isEmail()
            .custom((value, { req }) => {
                return User.findByEmail(value)
                    .then(user => {
                        if (user) {
                            return Promise.reject('User with this already exists!')
                        }
                    })
            })
            .normalizeEmail(),
        body('password', 'Please enter a password longer than 6 characters with alphanumeric values only!')
            .isLength({ min: 6 })
            .isAlphanumeric(),
        body('confirmPassword')
            .custom((value, { req }) => {
                if (value !== req.body.password) {
                    throw new Error('Passwords do not match!')
                }
                return true;
            })
    ],
    authController.postSignup);

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

router.get('/email-verified', authController.getVerifyEmail);

module.exports = router;