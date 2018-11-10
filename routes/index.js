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
  res.render('index/register', { page: 'register' });
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
    successFlash: 'Welcome to Deal Your Crypto!',
  }), () => {
});

// logout route
router.get('/logout', (req, res) => {
  req.logout();
  req.flash('success', 'See you later!');
  res.redirect('back');
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
      res.render('index/categories', { categories: allCategories, page: 'categories' });
    }
  });
});



// contact page

router.get('/contact', (req, res) => {
  res.render('index/contact');
});

router.post('/contact/send', (req, res) => {
  const output = `
  <h1>You have a new contact request</h1>
  <h3>Contact Details</h3>
  <ul>
    <li>Name: ${req.body.name}</li>
    <li>Email: ${req.body.email}</li>
  </ul>
  <h3>Message</h3>
  <p>${req.body.message}</p>
  `;
  // Generate test SMTP service account from ethereal.email
  // Only needed if you don't have a real mail account for testing
  nodemailer.createTestAccount(() => {
    // create reusable transporter object using the default SMTP transport
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'k4nsyiavbcbmtcxx@ethereal.email',
        pass: 'Mx2qnJcNKM5mp4nrG3',
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

router.get('/dashboard', (req, res) => {
  res.render('dashboard/dashboard', { page: 'dashboard' });
});

router.get('/dashboard/addresses', (req, res) => {
  res.render('dashboard/dashboard_addr', { page: 'addresses' });
});

router.get('/dashboard/new', (req, res) => {
  res.render('dashboard/dashboard_new', { page: 'new' });
});

module.exports = router;
