const express = require('express');

const router = express.Router();

const { getProduct, postReport, buyProduct } = require('../controllers/products');

const middleware = require('../middleware/index');

const { isLoggedIn, asyncErrorHandler, hasCompleteProfile } = middleware;

// Get product
router.get('/:id/view', asyncErrorHandler(getProduct));

// Report product/user
router.post('/:id/report', isLoggedIn, postReport);

// Buy products
router.put('/:id/buy', isLoggedIn, hasCompleteProfile, asyncErrorHandler(buyProduct));

module.exports = router;
