/* eslint-disable no-param-reassign */
const express = require('express');

const router = express.Router();
const passport = require('passport');
const User = require('../models/user');
const {
  getRegister,
  postRegister,
  confirmEmail,
  resendEmail,
  getLogin,
  postLogin,
  getLogout,
  getIndex,
  getError,
  getForgot,
  postForgot,
  getReset,
  postReset,
  getContact,
  postContact,
  postContactUser,
  postForgotEmail,
  getResetEmail,
  postResetEmail,
  getAbout,
  getTeam,
  getServices,
  getFaq,
  getShipping,
  getTos,
  getPrivPol,
  postVerify,
  get2factor,
  post2factor,
  postDisable2FactorRequest,
  postDisable2Factor,
  postVerifyLogin,
  getCategories,
  firstCategSearch,
  secondCategSearch,
  thirdCategSearch,
  getSetUsername,
  postSetUsername
} = require('../controllers/index');

const middleware = require('../middleware/index');

const { asyncErrorHandler, isLoggedIn, checkId, isAdmin } = middleware; // destructuring assignment

// index route
router.get('/', asyncErrorHandler(getIndex));

// For web crawlers
router.get('/robots.txt', function (req, res) {
  res.type('text/plain');
  res.send("User-agent: *\nDisallow: /");
});

// error route
router.get('/error', getError);

// show reset form
router.get('/forgot', getForgot);

router.post('/forgot', postForgot);

router.get('/reset/:token', getReset);

router.post('/reset/:token', postReset);

// show register form
router.get('/register', getRegister);

//  handle sign up logic
router.post('/register', asyncErrorHandler(postRegister));

router.get('/confirmation/:token', asyncErrorHandler(confirmEmail));

router.post('/resend/:id', checkId, asyncErrorHandler(resendEmail));

router.post('/verify', isLoggedIn, postVerify);

router.post('/login/verify', postVerifyLogin);

router.get('/2factor', isLoggedIn, get2factor);

router.post('/2factor', isLoggedIn, asyncErrorHandler(post2factor));

router.get('/disable2factor/:token', postDisable2Factor);

router.post('/disable2factor', isLoggedIn, postDisable2FactorRequest);

//  show login form
router.get('/login', getLogin);

//  POST login logic - test this in prod
router.post('/login', postLogin);

router.get('/auth/facebook',
  passport.authenticate('facebook', { scope: ['public_profile', 'email'] }));

router.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  (req, res) => {
    if(req.user.username) {
      return res.redirect('/dashboard');
    } else {
      return res.redirect('/set-username');
    }
  });

router.get('/auth/google',
  passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login', 'profile', 'email'] }));


router.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    if(req.user.username) {
      return res.redirect('/dashboard');
    } else {
      return res.redirect('/set-username');
    }
  });

// GET Set username page

router.get('/set-username', getSetUsername);

// POST Set username page

router.post('/set-username', postSetUsername);

// GET Categories page

router.get('/categories', getCategories);

// POST Search

router.post('/firstCategSearch', asyncErrorHandler(firstCategSearch));

router.post('/secondCategSearch', asyncErrorHandler(secondCategSearch));

router.post('/thirdCategSearch', asyncErrorHandler(thirdCategSearch));

// GET Logout route
router.get('/logout', getLogout);

// GET Contact route
router.get('/contact', getContact);

// POST Contact route
router.post('/contact/send', asyncErrorHandler(postContact));

// POST Contact User route
router.post('/contact/sendUser', asyncErrorHandler(postContactUser));

// POST Forgot email route
router.post('/forgotemail', postForgotEmail);

// GET Reset email route
router.get('/resetemail/:token', getResetEmail);

// POST Reset email route
router.post('/resetemail/:token', postResetEmail);

router.get('/about', getAbout);

router.get('/team', getTeam);

router.get('/services', getServices);

router.get('/faq', getFaq);

router.get('/shipping', getShipping);

router.get('/terms-of-service', getTos);

router.get('/privacy-policy', getPrivPol);

module.exports = router;
