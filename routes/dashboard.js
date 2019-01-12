/* eslint-disable no-param-reassign */
const express = require('express');

const multer = require('multer');

const cloudinary = require('cloudinary');

const product = require('../models/product');

const User = require('../models/user');

const router = express.Router();

const { productCreate, productIndex, productDestroy, productEdit, productUpdate, productFeature } = require('../controllers/dashboard');

const middleware = require('../middleware/index');

const { isLoggedIn, checkUserproduct, asyncErrorHandler } = middleware; // destructuring assignment

// Set Storage Engine
const storage = multer.diskStorage({
  filename: (req, file, cb) => {
    cb(null, Date.now() + file.originalname);
  },
});

const imageFilter = (req, file, cb) => {
  // accept image files only
  if (!file.originalname.match(/\.(jpg|jpeg|png)$/i)) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: imageFilter,
});

// Dashboard index route
router.get('/', isLoggedIn, (req, res) => {
  res.render('dashboard/dashboard', { user: req.user });
});

// Show all addresses for withdraw
router.get('/addresses', isLoggedIn, (req, res) => {
  res.render('dashboard/dashboard_addr', { user: req.user });
});

router.post('/addresses', isLoggedIn, (req, res) => {
  const query = { _id: req.user._id };
  const name = req.body.btcadr || req.body.bchadr || req.body.ethadr
                               || req.body.ltcadr || req.body.dashadr;
  if (name === req.body.btcadr) {
    User.findByIdAndUpdate(query, { btcadr: name }, (err) => {
      if (err) {
        req.flash('error', err.message);
      } else {
        req.flash('success', 'Successfully updated address!');
        res.redirect('/dashboard/addresses');
      }
    });
  } else if (name === req.body.bchadr) {
    User.findByIdAndUpdate(query, { bchadr: name }, (err) => {
      if (err) {
        req.flash('error', err.message);
      } else {
        req.flash('success', 'Successfully updated address!');
        res.redirect('/dashboard/addresses');
      }
    });
  } else if (name === req.body.ethadr) {
    User.findByIdAndUpdate(query, { ethadr: name }, (err) => {
      if (err) {
        req.flash('error', err.message);
      } else {
        req.flash('success', 'Successfully updated address!');
        res.redirect('/dashboard/addresses');
      }
    });
  } else if (name === req.body.ltcadr) {
    User.findByIdAndUpdate(query, { ltcadr: name }, (err) => {
      if (err) {
        req.flash('error', err.message);
      } else {
        req.flash('success', 'Successfully updated address!');
        res.redirect('/dashboard/addresses');
      }
    });
  } else if (name === req.body.dashadr) {
    User.findByIdAndUpdate(query, { dashadr: name }, (err) => {
      if (err) {
        req.flash('error', err.message);
      } else {
        req.flash('success', 'Successfully updated address!');
        res.redirect('/dashboard/addresses');
      }
    });
  }
});

// Messages route
router.get('/messages', isLoggedIn, (req, res) => {
  res.render('dashboard/dashboard_messages', { user: req.user });
});

router.get('/messages/:id', isLoggedIn, (req, res) => {
  res.render('dashboard/dashboard_messages_msg', { user: req.user });
});

// Dashboard tokens route; gets current number of tokens
router.get('/tokens', isLoggedIn, (req, res) => {
  res.render('dashboard/dashboard_tokens', { user: req.user });
});

// Buy tokens route
router.post('/tokens/:id', isLoggedIn, (req, res) => {
  const query = { _id: req.user._id };
  // Currency id => used to decrease currency held by user
  const id = req.params.id;
  const tokens = req.body.tokens_nr;
  User.findByIdAndUpdate(query, { $inc: { feature_tokens: tokens } }, (err) => {
    if (err) {
      req.flash('error', err.message);
    } else {
      req.flash('success', 'Successfully purchased tokens!');
      res.redirect('/dashboard/tokens');
    }
  });
});

// Show all open offers
router.get('/open', isLoggedIn, asyncErrorHandler(productIndex));

// Show all closed offers
router.get('/closed', isLoggedIn, (req, res) => {
  product.find({ available: false, 'author.id': req.user._id }, (err, allproducts) => {
    if (err) {
      req.flash('error', err.message);
      res.redirect('/dashboard');
    } else {
      res.render('dashboard/dashboard_closed', { products: allproducts });
    }
  });
});

// Show all purchases
router.get('/purchases', isLoggedIn, (req, res) => {
  product.find({ buyer: req.user._id }, (err, allproducts) => {
    if (err) {
      req.flash('error', err.message);
      res.redirect('/dashboard');
    } else {
      res.render('dashboard/dashboard_purchases', { products: allproducts });
    }
  });
});

// NEW - show form to create new product
router.get('/new', isLoggedIn, (req, res) => {
  res.render('dashboard/dashboard_new', { user: req.user });
});

// CREATE - add new product to DB
router.post('/', isLoggedIn, upload.array('images', 5), asyncErrorHandler(productCreate));

// EDIT - shows edit form for a product
router.get('/:id/edit', isLoggedIn, checkUserproduct, asyncErrorHandler(productEdit));

// PUT - updates product in the database
router.put('/:id', upload.array('images', 5), checkUserproduct, asyncErrorHandler(productUpdate));

// PUT - features the product
router.put('/:id/edit/:feature_id', isLoggedIn, checkUserproduct, asyncErrorHandler(productFeature));

// DELETE - deletes product from database - don't forget to add "are you sure" on frontend
router.delete('/:id', asyncErrorHandler(productDestroy));

module.exports = router;
