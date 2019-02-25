/* eslint-disable no-param-reassign */
const express = require('express');

const multer = require('multer');

const cloudinary = require('cloudinary');

const product = require('../models/product');

const User = require('../models/user');

const Checkout = require('../models/checkout');

const uuidv1 = require('uuid/v1');

const request = require('request');

const router = express.Router();

const { getAddresses, addAddresses, topUp, withdraw, getTokens, buyTokens, productCreate, productDestroy, productEdit, productUpdate, productFeature, 
        openProductIndex, closedProductIndex, purchasedProductIndex, ongoingProductIndex, newProduct } = require('../controllers/dashboard');

const middleware = require('../middleware/index');

const { isLoggedIn, checkUserproduct, asyncErrorHandler, hasCompleteProfile } = middleware; // destructuring assignment

var SAVVY_SECRET = 'secf30f5f307df6c75bbd17b3043c1d81c5';

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

router.get('/addresses/ltc', isLoggedIn, (req, res) => {
  var url = "https://api.savvy.io/v3/currencies?token=" + SAVVY_SECRET;
  request(url, function(error, response, body){
      if(!error && response.statusCode == 200) {
          var json = JSON.parse(body);
          var data = json.data;
          var ltcrate = data.ltc.rate;
          var maxConfirmationsLTC = data.ltc.maxConfirmations;
          res.render('savvy/ltc', { ltcrate, maxConfirmationsLTC });
      }
  });
});

router.post('/addresses/ltc', isLoggedIn, (req, res) => {
  var orderId = uuidv1();
  var callback = 'https://dyc.herokuapp.com/savvy/callback/' + orderId;
  var encoded_callback = encodeURIComponent(callback);
  console.log(encoded_callback);
  var url = "https://api.savvy.io/v3/ltc/payment/" + encoded_callback + "?token=" + SAVVY_SECRET + "&lock_address_timeout=3600";
  var ltcrate = req.body.ltcrate;
  var maxConfirmationsLTC = req.body.maxConfirmationsLTC;
  var orderTotal = req.body.orderTotal;
  var coinsValue = req.body.coinsValue;
  request.get({
    url: url 
    }, function(error, response, body) {
      if(error) {
        req.flash('error', error.message);
        res.redirect('back');
      } else {
        console.log(body);
        var json = JSON.parse(body);
        var invoice = json.data.invoice;
        var address = json.data.address;
        console.log(invoice);
        console.log(address);
        Checkout.create({
          user: req.user,
          invoice: invoice,
          address: address,
          orderId: orderId,
          confirmations: 0,
          maxConfirmations: maxConfirmationsLTC,
          orderTotal: orderTotal,
          paid: false
        }, (err) => {
          if(err) {
            req.flash('error', err.message);
            res.redirect('back');
          } else {
            console.log(orderId);
            res.render('savvy/ltc', { ltcrate, orderTotal, orderId, address, coinsValue , maxConfirmationsLTC })
          }
        });
      }
  });
});

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
