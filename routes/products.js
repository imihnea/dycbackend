const express = require('express');

const router = express.Router();

const { getProduct, postReport, buyProduct, reportProduct } = require('../controllers/products');

const middleware = require('../middleware/index');

const { isLoggedIn, asyncErrorHandler, hasCompleteProfile, verifyCookie, checkId, assignCookie } = middleware;

// Get product
router.get('/:id/view', assignCookie, checkId, asyncErrorHandler(getProduct));

// Report product/user
router.post('/:id/report', isLoggedIn, checkId, asyncErrorHandler(postReport));

// Buy products
router.put('/:id/buy', verifyCookie, isLoggedIn, checkId, hasCompleteProfile, asyncErrorHandler(buyProduct));

// Report product
router.put('/:id/report', verifyCookie, isLoggedIn, asyncErrorHandler(reportProduct));

module.exports = router;
