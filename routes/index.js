/* eslint-disable no-param-reassign */
const express = require('express');

const nodemailer = require('nodemailer');

const router = express.Router();

const passport = require('passport');

const async = require('async');

const crypto = require('crypto');

const User = require('../models/user');

const product = require('../models/product');

const Product = require('../models/product');

const EMAIL_USER = process.env.EMAIL_USER || 'k4nsyiavbcbmtcxx@ethereal.email';
const EMAIL_API_KEY = process.env.EMAIL_API_KEY || 'Mx2qnJcNKM5mp4nrG3';
const EMAIL_PORT = process.env.EMAIL_PORT || '587';
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.ethereal.email';

// index route

router.get('/', (req, res) => {
  // Get all products from DB
  product.find({ featured: true }, (err, allproducts) => {
    if (err) {
      req.flash('error', err.message);
    } else {
      res.render('index', { currentUser: req.user, products: allproducts });
    }
  });
});

// show reset form
router.get('/forgot', (req, res) => {
  res.render('index/forgot');
});

router.post('/forgot', (req, res, next) => {
  async.waterfall([
    (done) => {
      crypto.randomBytes(20, (err, buf) => {
        const token = buf.toString('hex');
        done(err, token);
      });
    },
    (token, done) => {
      User.findOne({ email: req.body.email }, (err, user) => {
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save((error) => {
          done(error, token, user);
        });
      });
    },
    (token, user, done) => {
      const smtpTransport = nodemailer.createTransport({
        host: EMAIL_HOST,
        port: EMAIL_PORT,
        auth: {
          user: EMAIL_USER,
          pass: EMAIL_API_KEY,
        },
      });
      const mailOptions = {
        to: user.email,
        from: 'support@dyc.com',
        subject: 'Deal Your Crypto Password Reset',
        text: `${'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n'
          + 'Please click on the following link, or paste this into your browser to complete the process:\n\n'
          + 'http://'}${req.headers.host}/reset/${token}\n\n`
          + 'If you did not request this, please ignore this email and your password will remain unchanged.\n',
      };
      smtpTransport.sendMail(mailOptions, (err) => {
        console.log('mail sent');
        req.flash('success', `An e-mail has been sent to ${user.email} with further instructions.`);
        done(err, 'done');
      });
    },
  ], (err) => {
    if (err) return next(err);
    res.redirect('/forgot');
  });
});

router.get('/reset/:token', (req, res) => {
  User.findOne(
    {
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() },
    }, (err, user) => {
      if (!user) {
        req.flash('error', 'Password reset token is invalid or has expired.');
        return res.redirect('/forgot');
      }
      res.render('index/reset', { token: req.params.token });
    },
  );
});

router.post('/reset/:token', (req, res) => {
  async.waterfall([
    (done) => {
      User.findOne(
        {
          resetPasswordToken: req.params.token,
          resetPasswordExpires: { $gt: Date.now() },
        }, (err, user) => {
          if (!user) {
            req.flash('error', 'Password reset token is invalid or has expired.');
            return res.redirect('back');
          }
          if (req.body.password === req.body.confirm) {
            user.setPassword(req.body.password, () => {
              user.resetPasswordToken = undefined;
              user.resetPasswordExpires = undefined;

              user.save(() => {
                req.logIn(user, (error) => {
                  done(error, user);
                });
              });
            });
          } else {
            req.flash('error', 'Passwords do not match.');
            return res.redirect('back');
          }
        },
      );
    },
    (user, done) => {
      const smtpTransport = nodemailer.createTransport({
        host: EMAIL_HOST,
        port: EMAIL_PORT,
        auth: {
          user: EMAIL_USER,
          pass: EMAIL_API_KEY,
        },
      });
      const mailOptions = {
        to: user.email,
        from: 'support@dyc.com',
        subject: 'Your password has been changed',
        text: `${'Hello,\n\n'
          + 'This is a confirmation that the password for your account '}${user.email} has just been changed.\n`,
      };
      smtpTransport.sendMail(mailOptions, (err) => {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    },
  ], () => {
    res.redirect('/');
  });
});

// show register form
router.get('/register', (req, res) => {
  res.render('index/register');
});

//  handle sign up logic
router.post('/register', (req, res) => {
  const newUser = new User({ email: req.body.email, username: req.body.username });
  User.register(newUser, req.body.password, (err) => {
    if (err) {
      req.flash('error', `${err.message}`);
      return res.render('index/register', { error: err.message });
    }
    passport.authenticate('local')(req, res, () => {
      req.flash('success', `Successfully signed up! Nice to meet you ${req.body.username}`);
      res.redirect('/');
    });
  });
});

//  show login form
router.get('/login', (req, res) => {
  res.render('index/login', { page: 'login' });
});

//  handling login logic - test this in prod
router.post('/login', passport.authenticate('local',
  {
    failureRedirect: '/login',
    failureFlash: true,
  }), (req, res) => {
  if (req.body.remember) {
    req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // Cookie expires after 30 days
  } else {
    req.session.cookie.expires = false; // Cookie expires at end of session
  }
  res.redirect('/');
});

router.get('/auth/facebook',
  passport.authenticate('facebook', { scope: ['public_profile', 'email'] }));

router.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication, redirect home.
    res.redirect('/');
  });

router.get('/auth/google',
  passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login', 'profile', 'email'] }));


router.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    res.redirect('/');
  });

// logout route
router.get('/logout', (req, res) => {
  req.logout();
  req.flash('success', 'See you later!');
  res.redirect('/');
});

// categories route

router.get('/', (req, res) => {
  // Get all categories from DB
  Product.find({}, (err, allCategories) => {
    if (err) {
      req.flash('error', err.message);
    } else if (req.xhr) {
      res.json(allCategories);
    } else {
      res.render('index/categories', { categories: allCategories });
    }
  });
});

// contact page

router.get('/contact', (req, res) => {
  res.render('index/contact');
});

router.post('/contact/send', (req, res) => {
  const output = `
  <h1>Contact Request - Deal Your Crypto</h1>
  <h3>Contact Details</h3>
  <ul>
    <li>Name: ${req.body.name}</li>
    <li>Email: ${req.body.email}</li>
    <li>Topic: ${req.body.topic}</li>
  </ul>
  <h3>Message</h3>
  <p>${req.body.message}</p>
  `;
  // Generate test SMTP service account from ethereal.email
  // Only needed if you don't have a real mail account for testing
  nodemailer.createTestAccount(() => {
    // create reusable transporter object using the default SMTP transport
    const transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: EMAIL_PORT,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_API_KEY,
      },
    });

    // setup email data with unicode symbols
    const mailOptions = {
      from: "'Deal Your Crypto' <k4nsyiavbcbmtcxx@ethereal.email>", // sender address
      to: 'support@dyc.com', // list of receivers
      subject: 'Deal Your Crypto - Contact Request', // Subject line
      html: output, // html body
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        req.flash('error', `${error.message}`);
        res.render('back', { error: error.message });
      }
      console.log('Message sent: %s', info.messageId);
      // Preview only available when sending through an Ethereal account
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
      req.flash('success', 'Successfully sent a mail! We will get back to you as soon as possible!');
      res.redirect('/contact');
    });
  });
});

router.get('/faq', (req, res) => {
  res.render('faq');
});

router.get('/gdpr', (req, res) => {
  res.render('gdpr');
});

router.get('/terms-of-service', (req, res) => {
  res.render('terms-of-service');
});

router.get('/privacy-policy', (req, res) => {
  res.render('privacy-policy');
});

module.exports = router;
