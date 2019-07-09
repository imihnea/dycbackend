const express = require('express');

const router = express.Router();

const { getProduct, postReport, buyProduct, reportProduct } = require('../controllers/products');

const middleware = require('../middleware/index');

const { isLoggedIn, asyncErrorHandler, hasCompleteProfile, verifyCookie, checkId, assignCookie, getPrice } = middleware;

// Get product
router.get('/:id/view', assignCookie, checkId, getPrice, asyncErrorHandler(getProduct));

// Report product/user
router.post('/:id/report', isLoggedIn, checkId, asyncErrorHandler(postReport));

// Buy products
router.put('/:id/buy', verifyCookie, isLoggedIn, checkId, asyncErrorHandler(buyProduct));

// Report product
router.put('/:id/report', verifyCookie, isLoggedIn, asyncErrorHandler(reportProduct));

module.exports = router;
