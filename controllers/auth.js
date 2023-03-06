const User = require('../models/user');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const Transport = require('nodemailer-sendinblue-transport');
const { validationResult } = require('express-validator');

const transporter = nodemailer.createTransport(
  new Transport({
    apiKey: process.env.API_KEY
  })
)

const errorOccurred = err => {
  const error = new Error(err);
  error.httpStatusCode = 500;
  return next(error);
}

exports.getLogin = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = req.flash('registered');
    if (message.length > 0) {
      message = message[0];
    } else {
      message = null;
    }

  }

  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Log In',
    errorMessage: message,
    oldInput: {
      email: '',
      password: ''
    },
    validationErrors: []
  });
};

exports.getSignup = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = req.flash('registered');
    if (message.length > 0) {
      message = message[0];
    } else {
      message = null;
    }

  }
  res.render('auth/signup', {
    pageTitle: 'Sign Up',
    path: '/signup',
    errorMessage: message,
    oldInput: {
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    },
    validationErrors: []
  })
}

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req);
  
  console.log(errors.array())
  if (!errors.isEmpty()) {
    return res.status(422).render('auth/login', {
      pageTitle: 'Log In',
      path: '/login',
      errorMessage: errors.array()[0].msg,
      oldInput: { 
        email: email, 
        password: password, 
      },
      validationErrors: errors.array()
    })
  }
  User.findByEmail(email)
    .then(user => {
      if (!user) {
        return res.status(422).render('auth/login', {
          pageTitle: 'Log In',
          path: '/login',
          errorMessage: 'Invalid email or password',
          oldInput: { 
            email: email, 
            password: password, 
          },
          validationErrors: []
        })     
       }
      bcrypt
        .compare(password, user.password)
        .then(doMatch => {
          if (doMatch) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            return res.redirect('/');
          }
          console.log('Invalid Password');
          return res.status(422).render('auth/login', {
            pageTitle: 'Log In',
            path: '/login',
            errorMessage: 'Invalid email or password',
            oldInput: { 
              email: email, 
              password: password, 
            },
            validationErrors: []
          })
        })
        .catch(err => {
          console.log(err);
          res.redirect('/login')
        })
    })
    .catch(err => {
      errorOccurred(err);
    });
}

exports.postSignup = (req, res, next) => {
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req);
  console.log(errors.array())
  if (!errors.isEmpty()) {
    return res.status(422).render('auth/signup', {
      pageTitle: 'Sign Up',
      path: '/signup',
      errorMessage: errors.array()[0].msg,
      oldInput: {name: name, 
        email: email, 
        password: password, 
        confirmPassword: req.body.confirmPassword
      },
      validationErrors: errors.array()
    })
  }

  bcrypt
    .hash(password, 12)
    .then(hashedPassword => {
      const newCart = { items: [] }
      const newUser = new User(name, email, hashedPassword, newCart, null, null, null);
      console.log('Account Created! Please login to continue...');
      return newUser.save();
    })
    .then(() => {
      req.flash('registered', 'You have successfully registered, please check your inbox to verify your email...')
      res.redirect('/login');
      return transporter.sendMail({
        to: email,
        from: 'noreply@test.com',
        subject: 'Verification email',
        html: `
            <p>Here is your link to verify your email</p>
            <p><a href="http://localhost:3000/email-verified">Click Here</a></p>
            `
      })
    })
    .catch(err => {
      errorOccurred(err);
    })

}

exports.postLogout = (req, res, next) => {
  req.session.destroy();
  res.redirect('/');
}

exports.getReset = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = req.flash('registered');
    if (message.length > 0) {
      message = message[0];
    } else {
      message = null;
    }

  }

  res.render('auth/reset', {
    pageTitle: 'Reset Password',
    path: '/reset',
    errorMessage: message
  })
}


exports.postReset = (req, res, next) => {
  const email = req.body.email;
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect('/reset');
    }
    const token = buffer.toString('hex')
    User.findByEmail(email)
      .then(user => {
        if (!user) {
          req.flash('error', 'No user with that email found!')
          return res.redirect('/reset');
        }
        // const expiry = Date.now() + 3600000;
        return User.update(email, token)
          .then(() => {
            res.redirect('/');
            transporter.sendMail({
              to: email,
              from: 'noreply@test.com',
              subject: 'Password reset link',
              html: `
        <p>You requested for a password reset</p>
        <p>Click on this link to verify your email...</p>
        <p><a href="http://localhost:3000/reset/${token}">Click Here</a></p>
        <p>and set a new password.</p>
        `
            })
          })
          .catch(err => {
            console.log(err);
          })
      })
      .catch(err => {
        errorOccurred(err);
      })
  })
}

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  User.findByToken(token)
    .then(user => {
      let message = req.flash('error');
      if (message.length > 0) {
        message = message[0];
      } else {
        message = req.flash('registered');
        if (message.length > 0) {
          message = message[0];
        } else {
          message = null;
        }

      }
      res.render('auth/new-password', {
        path: '/new-password',
        pageTitle: 'New Password',
        errorMessage: message,
        userId: user._id,
        passwordToken: token
      })
    })
    .catch(err => {
      errorOccurred(err);
    })
}

exports.postNewPassword = (req, res, next) => {
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  const password = req.body.password;
  User.findByIdandToken(userId, passwordToken)
    .then(user => {
      resetUser = user;
      return bcrypt.hash(password, 12)
    })
    .then(hashedPassword => {
      return User.updatePassword(userId, hashedPassword)
    })
    .then(result => {
      res.redirect('/login')
    })
    .catch(err => {
      errorOccurred(err);
    })
}

exports.getVerifyEmail = (req, res, next) => {
  res.render('auth/email-verified', {
    pageTitle: 'Success',
    path: '/email-verified'
  })
}