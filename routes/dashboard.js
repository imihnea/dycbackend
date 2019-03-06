/* eslint-disable no-param-reassign */
const express = require('express');

const multer = require('multer');

const cloudinary = require('cloudinary');

const router = express.Router();

const User = require('../models/user');

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

const Coinswitch = require('coinswitch');

const cs = new Coinswitch({
  apiKey: 'cRbHFJTlL6aSfZ0K2q7nj6MgV5Ih4hbA2fUG0ueO',
  userIP: '1.1.1.1'
});

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
  const coinsList = await cs.getDepositCoins('btc')  // coinsList is an array
  console.log(coinsList[0])
  res.send(coinsList);
});

router.get('/addresses/altcoins/rate', async (req, res) => {
  const rate = await cs.getExchangeLimit(deposit, 'btc')
  console.log(rate)
});

router.post('/addresses/altcoins/deposit', async (req, res) => {
  const {
    offerReferenceId,
    depositCoinAmount,
    destinationCoinAmount
  } = await cs.generateOffer('ltc', 'btc', 0.2) // deposit, destination, amount
  
  const {
    orderId,
    exchangeAddress: { address }
  } = await cs.makeOrder({
    depositCoin: 'ltc',
    destinationCoin: 'btc',
    depositCoinAmount,
    offerReferenceId,
    userReferenceId: 'test-user',
    destinationAddress: { address: '3HatjfqQM2gcCsLQ5ueDCKxxUbyYLzi9mp' },
    refundAddress: { address: 'MN4GTWCLDEMpPaiQuiK9YPJi82kcZDkVWN' }
  })
  
  console.log(`
  =========
  Order ID: ${orderId}
  Deposit: LTC (${depositCoinAmount})
  Receive: BTC (${destinationCoinAmount})
  Exchange Address: ${address}
  =========
  `)

});

router.get('/addresses/altcoins/status', async (req, res) => {
  const status = await cs.getOrder(orderId)
  console.log(status)
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
