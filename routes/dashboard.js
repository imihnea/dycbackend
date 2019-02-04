/* eslint-disable no-param-reassign */
const express = require('express');

const multer = require('multer');

const cloudinary = require('cloudinary');

const product = require('../models/product');

const User = require('../models/user');

const router = express.Router();

const { getAddresses, addAddresses, topUp, withdraw, getTokens, buyTokens, productCreate, productDestroy, productEdit, productUpdate, productFeature, 
        openProductIndex, closedProductIndex, purchasedProductIndex, ongoingProductIndex, newProduct } = require('../controllers/dashboard');

const middleware = require('../middleware/index');

const { isLoggedIn, checkUserproduct, asyncErrorHandler, hasCompleteProfile } = middleware; // destructuring assignment

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
  res.render('dashboard/dashboard', { user: req.user, errors: req.session.errors });
});

// Show all addresses for withdraw
router.get('/addresses', isLoggedIn, getAddresses);

// Modify addresses
router.post('/addresses', isLoggedIn, asyncErrorHandler(addAddresses));

// Top-up
router.put('/addresses/topup/:id', isLoggedIn, asyncErrorHandler(topUp));

// Withdraw
router.put('/addresses/withdraw/:id', isLoggedIn, asyncErrorHandler(withdraw));

// Dashboard tokens route; gets current number of tokens
router.get('/tokens', isLoggedIn, getTokens);

// Buy tokens route
router.post('/tokens/:id', isLoggedIn, asyncErrorHandler(buyTokens));

// Show all open offers
router.get('/open', isLoggedIn, asyncErrorHandler(openProductIndex));

// Show all closed offers
router.get('/closed', isLoggedIn, asyncErrorHandler(closedProductIndex));

// Show ongoing deals
router.get('/ongoing', isLoggedIn, asyncErrorHandler(ongoingProductIndex));

// Show all purchases
router.get('/purchases', isLoggedIn, asyncErrorHandler(purchasedProductIndex));

// NEW - show form to create new product
router.get('/new', isLoggedIn, hasCompleteProfile, newProduct);

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
