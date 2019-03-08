/* eslint-disable no-param-reassign */
const express = require('express');

const multer = require('multer');

const cloudinary = require('cloudinary');

const router = express.Router();

const User = require('../models/user');

const Checkout = require('../models/checkout');

const { getAddresses, addAddresses, topUp, withdraw, getTokens, buyTokens, productCreate, 
        productDestroy, productEdit, productUpdate, productFeature, 
        openProductIndex, closedProductIndex, purchasedProductIndex, ongoingProductIndex, newProduct, 
        getLTC, postLTC, getBTC, postBTC, getBCH, postBCH, getETH, postETH, getDASH, postDASH } = require('../controllers/dashboard');

const middleware = require('../middleware/index');

const { isLoggedIn, checkUserproduct, asyncErrorHandler, hasCompleteProfile } = middleware; // destructuring assignment

var Client = require('coinbase').Client;

var client = new Client({
  'apiKey': 'ClTJkzAmtBDFy8UI',
  'apiSecret': 'aCcx6OQysmYOWvUgOGj2ZhenpXqj1Upm',
});

var request = require("request");

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
router.get('/addresses', isLoggedIn, asyncErrorHandler(getAddresses));

// Modify addresses
router.post('/addresses', isLoggedIn, asyncErrorHandler(addAddresses));

// Top-up
router.put('/addresses/topup/:id', isLoggedIn, asyncErrorHandler(topUp));

//GET Ltc deposit
router.get('/addresses/ltc', isLoggedIn, getLTC);

//POST Ltc deposit
router.post('/addresses/ltc', isLoggedIn, postLTC);

//GET Btc deposit
router.get('/addresses/btc', isLoggedIn, getBTC);

//POST Btc deposit
router.post('/addresses/btc', isLoggedIn, postBTC);

//GET Bch deposit
router.get('/addresses/bch', isLoggedIn, getBCH);

//POST Bch deposit
router.post('/addresses/bch', isLoggedIn, postBCH);

//GET Eth deposit
router.get('/addresses/eth', isLoggedIn, getETH);

//POST Eth deposit
router.post('/addresses/eth', isLoggedIn, postETH);

//GET Dash deposit
router.get('/addresses/dash', isLoggedIn, getDASH);

//POST Dash deposit
router.post('/addresses/dash', isLoggedIn, postDASH);

router.post('/addresses/withdrawBTC', isLoggedIn, (req, res) => {
  var address = req.body.address;
  var amount = Number(req.body.value) + 0.00005000;
  console.log(req.body.value);
  console.log(amount);
  client.getAccount('primary', function(err, account) {
    if(err) {
      req.flash('error', err.message + '- prima eroare'); // Don't show this error to the user
      res.redirect('back');
    } else {
      if(req.user.btcbalance >= amount) {
        account.sendMoney(
          {'to': address,
          'amount': amount,
          'currency': 'BTC'
          }, function(err, tx) {
            if(err) {
              req.flash('error', err.message  + '- a doua eroare'); // Don't show this one either
              res.redirect('back');
            } else {
              console.log(tx);
              var query_btc = User.findByIdAndUpdate({ _id: req.user._id }, { $inc: { btcbalance: -amount } } );
              query_btc.then(function(doc) {
                req.flash('success', `Successfully withdrawn ${amount} BTC!`);
                res.redirect('back');
                console.log(`Withdrawn ${amount} BTC successfully.`);
              });
            }
        });
      } else {
        req.flash('error', `Insufficient funds to withdraw.`);
        res.redirect('back');
      }
    }
  });
});

router.get('/addresses/altcoins/pair', async (req, res) => {
  var options = { method: 'POST',
  url: 'https://api.coinswitch.co/v2/pairs',
  headers: 
   { 'x-user-ip': '1.1.1.1',
     'x-api-key': 'cRbHFJTlL6aSfZ0K2q7nj6MgV5Ih4hbA2fUG0ueO',
     'content-type': 'application/json' },
  body: '{"destinationCoin":"btc"}' };

request(options, function (error, response, body) {
  if(!error && response.statusCode == 200) {
    var json = JSON.parse(body);
    var data = json.data;
    console.log(data);
    //Add Check for isActive: true
    res.send(data);
  }
});
});

router.post('/addresses/altcoins/rate', async (req, res) => {
  console.log(req.body.counter);
  const deposit = req.body.counter;
  var options = { method: 'POST',
  url: 'https://api.coinswitch.co/v2/rate',
  headers:
   { 'x-user-ip': '1.1.1.1',
     'x-api-key': 'cRbHFJTlL6aSfZ0K2q7nj6MgV5Ih4hbA2fUG0ueO',
     'content-type': 'application/json' },
     body: `{"depositCoin":"${deposit}","destinationCoin":"btc"}` };

request(options, function (error, response, body) {
  if(!error && response.statusCode == 200) {
    var json = JSON.parse(body);
    var data = json.data;
    console.log(data);
    //Add Check for isActive: true
    res.send(data);
  }
});
});

router.post('/addresses/altcoins/deposit', async (req, res) => {
  console.log(req.body);
  const deposit = req.body.deposit;
  const amount = req.body.amount;
  const refund = req.body.refund;
  const user = req.body.user;
  const coin = req.body.depositCoin;
  var options = { method: 'POST',
  url: 'https://api.coinswitch.co/v2/order',
  headers: 
  { 'x-user-ip': '1.1.1.1',
    'x-api-key': 'cRbHFJTlL6aSfZ0K2q7nj6MgV5Ih4hbA2fUG0ueO',
    'content-type': 'application/json' },
  body: `{"depositCoin":"${deposit}","destinationCoin":"btc","depositCoinAmount":"${amount}","destinationAddress":{"address": "3HatjfqQM2gcCsLQ5ueDCKxxUbyYLzi9mp"},"refundAddress":{"address": "${refund}"}}` };

request(options, function (error, response, body) {
  if(!error && response.statusCode == 200) {
    console.log(body);
    var json = JSON.parse(body);
    var data = json.data;
    Checkout.create({
      user: user.username,
      coin: coin,
      address: data.exchangeAddress.address,
      orderId: data.orderId,
      paid: false
    }, (err) => {
      if(err) {
        res.send(err);
      } else {
        console.log('created deposit')
        res.send(data);
      }
    });
  }
});

});

router.post('/addresses/altcoins/status', async (req, res) => {
  console.log(req.body);
  const orderId = req.body.orderId;
  var options = { method: 'GET',
  url: `https://api.coinswitch.co/v2/order/${orderId}`,
  headers: 
  { 'x-user-ip': '1.1.1.1',
    'x-api-key': 'cRbHFJTlL6aSfZ0K2q7nj6MgV5Ih4hbA2fUG0ueO'}};
  // Down code needs testing before production
  request(options, function (error, response, body) {
    if(!error && response.statusCode == 200) {
      console.log(body);
      var json = JSON.parse(body);
      var data = json.data;
      if(data.status === 'complete') {
        var query_2 = Checkout.findOne({ orderId: orderId });
        query_2.exec(function(err, checkout) {
          if(err) {
            res.send('error');
          }
          if(checkout !== null) {
            var user = checkout.user;
            var query_btc = User.findByIdAndUpdate({ _id: user }, { $inc: { btcbalance: data.destinationCoinAmount } } );
            query_btc.then(function(doc) {
              console.log("Deposit arrived!");
              var query_1 = Checkout.findOneAndUpdate({ orderId: orderId }, {paid: true});
              query_1.then(function(doc2) {
                console.log("Checkout updated to paid!");
                res.send(data);
              });
            });
          }
        });
      } else {
        res.send(data);
      }
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
