const passport = require('passport');
const User = require('../models/user');

module.exports = {
  // POST /register
  async postRegister(req, res) {
    const newUser = new User({ email: req.body.email, username: req.body.username });
    try {
      await User.register(newUser, req.body.password);
    } catch (error) {
      req.flash('error', error.message);
      return res.redirect('back');
    }
    passport.authenticate('local')(req, res, () => {
      req.flash('success', `Successfully signed up! Nice to meet you ${req.body.username}`);
      res.redirect('/');
    });
  },
  // POST /login
  postLogin(req, res, next) {
    if (req.body.remember) {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // Cookie expires after 30 days
    } else {
      req.session.cookie.expires = false; // Cookie expires at end of session
    }
    passport.authenticate('local',
      {
        successRedirect: '/',
        failureRedirect: '/login',
        failureFlash: true,
      })(req, res, next);
  },
  // GET /logout
  getLogout(req, res) {
    req.logout();
    req.flash('success', 'See you later!');
    res.redirect('/');
  },
};
