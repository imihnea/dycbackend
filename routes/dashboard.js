/* eslint-disable no-param-reassign */
const express = require('express');

const multer = require('multer');

const router = express.Router();

const { getDashboardIndex, getAddresses, addAddresses, withdraw, getTokens, buyTokens, productCreate, buyTokenPacks,
        productDestroy, productEdit, productUpdate, productFeature, getPremium, getSearchData, getProductData, getProductSoldData,
        getProductViews,
        openProductIndex, closedProductIndex, purchasedProductIndex, ongoingProductIndex, newProduct, getBTC, postBTC,
        CoinSwitchPair, CoinSwitchPoll, CoinSwitchDeposit, CoinSwitchRate, CoinSwitchStatus,
        subscriptionCreate, subscriptionCancel, subscriptionPage, subscriptionCancelPage } = require('../controllers/dashboard');

const middleware = require('../middleware/index');

const { isLoggedIn, checkUserproduct, asyncErrorHandler, hasCompleteProfile, assignCookie, verifyCookie, verifyParam } = middleware; // destructuring assignment

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
router.get('/', assignCookie, isLoggedIn, asyncErrorHandler(getDashboardIndex));

// Show all addresses for withdraw
router.get('/addresses', assignCookie, isLoggedIn, asyncErrorHandler(getAddresses));

// Modify addresses
router.post('/addresses', verifyCookie, isLoggedIn, asyncErrorHandler(addAddresses));

//GET Btc deposit
router.get('/addresses/btc', isLoggedIn, getBTC);

//POST Btc deposit
router.post('/addresses/btc', isLoggedIn, postBTC);

//GET Pairs available for BTC
router.get('/addresses/altcoins/pair', asyncErrorHandler(CoinSwitchPair));

//POST Pair, receive rate for the pair
router.post('/addresses/altcoins/rate', asyncErrorHandler(CoinSwitchRate));

//POST Rate, receive transaction details
router.post('/addresses/altcoins/deposit', asyncErrorHandler(CoinSwitchDeposit));

//POST order, check status for the order
router.post('/addresses/altcoins/status', asyncErrorHandler(CoinSwitchStatus));

//This route polls api for order status every minute
router.post('/addresses/altcoins/poll', asyncErrorHandler(CoinSwitchPoll));

// Withdraw BTC
router.post('/addresses/withdrawBTC', isLoggedIn, asyncErrorHandler(withdraw));

// Dashboard tokens route; gets current number of tokens
router.get('/tokens', assignCookie, isLoggedIn, asyncErrorHandler(getTokens));

// Buy tokens route
router.post('/tokens/:id', verifyCookie, isLoggedIn, asyncErrorHandler(buyTokens));

// Buy token packs

router.post('/tokens/:id/packs', isLoggedIn, asyncErrorHandler(buyTokenPacks))

// Show all open offers
router.get('/open', assignCookie, isLoggedIn, asyncErrorHandler(openProductIndex));

// Show all closed offers
router.get('/closed', isLoggedIn, asyncErrorHandler(closedProductIndex));

// Show ongoing deals
router.get('/ongoing', isLoggedIn, asyncErrorHandler(ongoingProductIndex));

// Show all purchases
router.get('/purchases', isLoggedIn, asyncErrorHandler(purchasedProductIndex));

// Show premium page
router.get('/premium', isLoggedIn, assignCookie, asyncErrorHandler(getPremium));

router.get('/premium/getData/:_csrf/:csrfSecret/:firstCat/:timeframe', verifyParam, isLoggedIn, asyncErrorHandler(getSearchData));

router.get('/premium/getProductData/:_csrf/:csrfSecret/:firstCat/:timeframe', verifyParam, isLoggedIn, asyncErrorHandler(getProductData));

router.get('/premium/getProductSoldData/:_csrf/:csrfSecret/:firstCat/:timeframe', verifyParam, isLoggedIn, asyncErrorHandler(getProductSoldData));

router.get('/premium/getProductViews/:_csrf/:csrfSecret/:product', verifyParam, isLoggedIn, asyncErrorHandler(getProductViews));

// GET Subscription Page

router.get('/subscription', isLoggedIn, asyncErrorHandler(subscriptionPage));

// GET Cancel Subscription Page

router.get('/subscription-cancel', isLoggedIn, asyncErrorHandler(subscriptionCancelPage))

// POST Subscription create

router.post('/:id/subscription', isLoggedIn, asyncErrorHandler(subscriptionCreate));

// POST Subscription cancel

router.post('/:id/subscription/cancel', isLoggedIn, asyncErrorHandler(subscriptionCancel));

// NEW - show form to create new product
router.get('/new', assignCookie, isLoggedIn, hasCompleteProfile, newProduct);

// CREATE - add new product to DB
router.post('/new/:_csrf/:csrfSecret', verifyParam, isLoggedIn, upload.array('images', 5), asyncErrorHandler(productCreate));

// EDIT - shows edit form for a product
router.get('/:id/edit', assignCookie, isLoggedIn, checkUserproduct, asyncErrorHandler(productEdit));

// PUT - updates product in the database
router.put('/:id/:_csrf/:csrfSecret', verifyParam, upload.array('images', 5), checkUserproduct, asyncErrorHandler(productUpdate));

// PUT - features the product
router.put('/:id/edit/:feature_id/:_csrf/:csrfSecret', verifyParam, isLoggedIn, checkUserproduct, asyncErrorHandler(productFeature));

// DELETE - deletes product from database - don't forget to add "are you sure" on frontend
router.delete('/:id', verifyCookie, asyncErrorHandler(productDestroy));

module.exports = router;
