const express = require('express');

const router = express.Router();

const { getProduct, postReport, buyProduct } = require('../controllers/products');

const middleware = require('../middleware/index');

const { isLoggedIn, asyncErrorHandler, hasCompleteProfile, verifyCookie, checkId } = middleware;

// Get product
router.get('/:id/view', checkId, asyncErrorHandler(getProduct));

// Report product/user
router.post('/:id/report', isLoggedIn, checkId, postReport);

// Buy products
router.put('/:id/buy', verifyCookie, isLoggedIn, checkId, hasCompleteProfile, asyncErrorHandler(buyProduct));

module.exports = router;
