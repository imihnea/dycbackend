/* eslint-disable no-param-reassign */
const express = require('express');

const router = express.Router();
const passport = require('passport');
const {
  getRegister,
  postRegister,
  getLogin,
  postLogin,
  getLogout,
  getIndex,
  getForgot,
  postForgot,
  getReset,
  postReset,
  getContact,
  postContact,
  postForgotEmail,
  getResetEmail,
  postResetEmail,
  getFaq,
  getGdpr,
  getTos,
  getPrivPol,
  postVerify,
  get2factor,
  post2factor,
  postdisable2factor,
  postVerifyLogin,
  firstCategSearch,
  secondCategSearch,
  thirdCategSearch
} = require('../controllers/index');

const middleware = require('../middleware/index');

const { asyncErrorHandler, isLoggedIn } = middleware; // destructuring assignment

// index route
router.get('/', asyncErrorHandler(getIndex));

// show reset form
router.get('/forgot', getForgot);

router.post('/forgot', postForgot);

router.get('/reset/:token', getReset);

router.post('/reset/:token', postReset);

// show register form
router.get('/register', getRegister);

//  handle sign up logic
router.post('/register', asyncErrorHandler(postRegister));

router.post('/verify', isLoggedIn, postVerify);

router.post('/login/verify', postVerifyLogin);

router.get('/2factor', isLoggedIn, get2factor);

router.post('/2factor', isLoggedIn, asyncErrorHandler(post2factor));

router.post('/disable2factor', isLoggedIn, postdisable2factor);

//  show login form
router.get('/login', getLogin);

//  POST login logic - test this in prod
router.post('/login', postLogin);

// POST Search

router.post('/firstCategSearch', asyncErrorHandler(firstCategSearch));

router.post('/secondCategSearch', asyncErrorHandler(secondCategSearch));

router.post('/thirdCategSearch', asyncErrorHandler(thirdCategSearch));

router.get('/auth/facebook',
  passport.authenticate('facebook', { scope: ['public_profile', 'email'] }));

router.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication, redirect home.
    res.redirect('/dashboard');
  });

router.get('/auth/google',
  passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login', 'profile', 'email'] }));


router.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    res.redirect('/dashboard');
  });

// GET Logout route
router.get('/logout', getLogout);

// GET Contact route
router.get('/contact', getContact);

// POST Contact route
router.post('/contact/send', postContact);

// POST Forgot email route
router.post('/forgotemail', postForgotEmail);

// GET Reset email route
router.get('/resetemail/:token', getResetEmail);

// POST Reset email route
router.post('/resetemail/:token', postResetEmail);

router.get('/faq', getFaq);

router.get('/gdpr', getGdpr);

router.get('/terms-of-service', getTos);

router.get('/privacy-policy', getPrivPol);

module.exports = router;
