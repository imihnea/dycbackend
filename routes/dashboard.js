/* eslint-disable no-param-reassign */
const express = require('express');

const multer = require('multer');

const router = express.Router();

const { getDashboardIndex, getAddresses, addAddresses, verifyWithdraw, getTokens, buyTokens, productCreate, buyTokenPacks,
        productDestroy, productEdit, productUpdate, productFeature, getPremium, getSearchData, getProductData, getProductSoldData,
        getProductViews,
        openProductIndex, closedProductIndex, purchasedProductIndex, ongoingProductIndex, refundProductIndex, newProduct, postBTC,
        CoinSwitchPair, CoinSwitchPoll, CoinSwitchDeposit, CoinSwitchRate, CoinSwitchStatus, imageLeft, imageRight,
        subscriptionCreate, subscriptionCancel, subscriptionPage, subscriptionCancelPage, getConfirmWithdraw, postConfirmWithdraw, resendConfirmWithdraw,
        getNotifications, postNotifications, deleteAccount, deleteAccountRequest, getPartner, putBusinessPartner, putUserPartner,
        getNotif } = require('../controllers/dashboard');

const middleware = require('../middleware/index');

const { isLoggedIn, checkUserproduct, asyncErrorHandler, hasCompleteProfile, assignCookie, verifyCookie, verifyParam, checkId, isWithdrawUser } = middleware; // destructuring assignment
const crypto = require('crypto');

// Set Storage Engine
const storage = multer.diskStorage({
  filename: (req, file, cb) => {
    let buf = crypto.randomBytes(16);
    buf = buf.toString('hex');
    let uniqFileName = file.originalname.replace(/\.jpeg|\.jpg|\.png/ig, '');
    uniqFileName += buf;
    cb(undefined, uniqFileName);
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
  limits: {
    fileSize: 5000000
  },
  onError: (err, next) => {
    next(err);
  },
});

// Dashboard index route
router.get('/', assignCookie, isLoggedIn, asyncErrorHandler(getDashboardIndex));

// Show all addresses for withdraw
router.get('/addresses', assignCookie, isLoggedIn, asyncErrorHandler(getAddresses));

// Modify addresses
router.post('/addresses', verifyCookie, isLoggedIn, asyncErrorHandler(addAddresses));

//POST Btc deposit
router.post('/addresses/btc', isLoggedIn, asyncErrorHandler(postBTC));

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
// router.post('/addresses/withdrawBTC/:id', isLoggedIn, checkId, asyncErrorHandler(withdraw));

router.post('/addresses/verifyWithdraw', isLoggedIn, asyncErrorHandler(verifyWithdraw));

router.get('/addresses/withdraw/:id/confirm', isLoggedIn, checkId, asyncErrorHandler(isWithdrawUser), asyncErrorHandler(getConfirmWithdraw));

router.get('/addresses/withdraw/verify/:token', isLoggedIn, asyncErrorHandler(postConfirmWithdraw));

router.post('/addresses/withdraw/:id/resend', isLoggedIn, checkId, asyncErrorHandler(isWithdrawUser), asyncErrorHandler(resendConfirmWithdraw));

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

// Show refunded deals
// router.get('/refunds', isLoggedIn, assignCookie, asyncErrorHandler(refundProductIndex));

// Show all purchases
router.get('/purchases', isLoggedIn, asyncErrorHandler(purchasedProductIndex));

// Show premium page
router.get('/premium', isLoggedIn, assignCookie, asyncErrorHandler(getPremium));

router.get('/premium/getData/:_csrf/:csrfSecret/:firstCat/:timeframe', verifyParam, isLoggedIn, asyncErrorHandler(getSearchData));

router.get('/premium/getProductData/:_csrf/:csrfSecret/:firstCat/:timeframe', verifyParam, isLoggedIn, asyncErrorHandler(getProductData));

router.get('/premium/getProductSoldData/:_csrf/:csrfSecret/:firstCat/:timeframe', verifyParam, isLoggedIn, asyncErrorHandler(getProductSoldData));

router.get('/premium/getProductViews/:_csrf/:csrfSecret/:product', verifyParam, isLoggedIn, asyncErrorHandler(getProductViews));

// GET Email-notifications page
router.get('/notifications', isLoggedIn, asyncErrorHandler(getNotifications));

// POST Email-notifications page
router.post('/notifications/:id', isLoggedIn, checkId, asyncErrorHandler(postNotifications));

// GET Subscription Page

router.get('/subscription', isLoggedIn, assignCookie, asyncErrorHandler(subscriptionPage));

// GET Cancel Subscription Page

router.get('/subscription-cancel', isLoggedIn, asyncErrorHandler(subscriptionCancelPage));

// POST Subscription create

router.post('/:id/subscription', isLoggedIn, checkId, verifyCookie, asyncErrorHandler(subscriptionCreate));

// POST Subscription cancel

router.post('/subscription/cancel', isLoggedIn, asyncErrorHandler(subscriptionCancel));

// NEW - show form to create new product
router.get('/new', assignCookie, isLoggedIn, hasCompleteProfile, asyncErrorHandler(newProduct));

// CREATE - add new product to DB
router.post('/new/:_csrf/:csrfSecret', verifyParam, isLoggedIn, upload.array('images', 5), asyncErrorHandler(productCreate));

// EDIT - shows edit form for a product
router.get('/:id/edit', assignCookie, isLoggedIn, checkId, checkUserproduct, asyncErrorHandler(productEdit));

// PUT - updates product in the database
router.put('/:id/:_csrf/:csrfSecret', verifyParam, checkId, checkUserproduct, upload.array('images', 5), asyncErrorHandler(productUpdate));

// PUT - features the product
router.put('/:id/edit/:feature_id/:_csrf/:csrfSecret', verifyParam, isLoggedIn, checkId, checkUserproduct, asyncErrorHandler(productFeature));

// PUT - move images
router.put('/:id/imageLeft', checkId, checkUserproduct, asyncErrorHandler(imageLeft));

router.put('/:id/imageRight', checkId, checkUserproduct, asyncErrorHandler(imageRight));

// DELETE - deletes product from database - don't forget to add "are you sure" on frontend
router.delete('/:id', verifyCookie, checkId, asyncErrorHandler(productDestroy));

// POST - Delete account request
router.post('/disable-account', isLoggedIn, asyncErrorHandler(deleteAccountRequest));

// GET - Delete account
router.get('/disable-account/:token', asyncErrorHandler(deleteAccount));

// GET Partner Page
router.get('/partner', isLoggedIn, asyncErrorHandler(getPartner));

// PUT Business Partner
router.put('/businessPartner', isLoggedIn, asyncErrorHandler(putBusinessPartner));

// PUT User Partner
router.put('/userPartner', isLoggedIn, asyncErrorHandler(putUserPartner));

// GET Notifications Page
router.get('/notif', isLoggedIn, asyncErrorHandler(getNotif));

module.exports = router;
