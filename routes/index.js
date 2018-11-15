const express = require('express');

const nodemailer = require('nodemailer');

const router = express.Router();

const passport = require('passport');

const User = require('../models/user');

const Product = require('../models/product');

// index route

router.get('/', (req, res) => {
  res.render('index', { currentUser: req.user });
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

//  handling login logic
router.post('/login', passport.authenticate('local',
  {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true,
  }), () => {
});

router.get('/auth/facebook',
  passport.authenticate('facebook'));

router.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication, redirect home.
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

const EMAIL_USER = process.env.EMAIL_USER || 'k4nsyiavbcbmtcxx@ethereal.email';
const EMAIL_API_KEY = process.env.EMAIL_API_KEY || 'Mx2qnJcNKM5mp4nrG3';
const EMAIL_PORT = process.env.EMAIL_PORT || '587';
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.ethereal.email';

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
