const express = require('express');

const router = express.Router();

const { getProduct, postReport } = require('../controllers/products');

const middleware = require('../middleware/index');

const { isLoggedIn, asyncErrorHandler } = middleware;

// Get product
router.get('/:id/view', asyncErrorHandler(getProduct));

// Report product/user
router.post('/:id/report', isLoggedIn, postReport);

module.exports = router;
