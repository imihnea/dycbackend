const express = require('express');

const router = express.Router();

const middleware = require('../middleware');

const { isLoggedIn } = middleware; // destructuring assignment

router.get('/', isLoggedIn, (req, res) => {
  res.render('dashboard/dashboard');
});

router.get('/addresses', isLoggedIn, (req, res) => {
  res.render('dashboard/dashboard_addr');
});

router.get('/new', isLoggedIn, (req, res) => {
  res.render('dashboard/dashboard_new');
});

router.get('/open', isLoggedIn, (req, res) => {
  res.render('dashboard/dashboard_open');
});

router.get('/closed', isLoggedIn, (req, res) => {
  res.render('dashboard/dashboard_closed');
});

router.get('/purchases', isLoggedIn, (req, res) => {
  res.render('dashboard/dashboard_purchases');
});

router.get('/edit', isLoggedIn, (req, res) => {
  res.render('dashboard/dashboard_edit');
});

router.get('/view', isLoggedIn, (req, res) => {
  res.render('dashboard/dashboard_view');
});

module.exports = router;
