const express = require('express');

const router = express.Router();

const { getDeal, cancelDeal, acceptDeal, declineDeal, refundDeal, completeDeal } = require('../controllers/deals');

const middleware = require('../middleware/index');

const { isLoggedIn, asyncErrorHandler } = middleware; // destructuring assignment

// show deal
router.get('/:id', isLoggedIn, asyncErrorHandler(getDeal));

// cancel deal
router.put('/:id/cancel', isLoggedIn, asyncErrorHandler(cancelDeal));

// accept deal
router.put('/:id/accept', isLoggedIn, asyncErrorHandler(acceptDeal));

// decline deal
router.put('/:id/decline', isLoggedIn, asyncErrorHandler(declineDeal));

// complete deal
router.put('/:id/complete', isLoggedIn, asyncErrorHandler(completeDeal));

// refund deal
router.put('/:id/refund', isLoggedIn, asyncErrorHandler(refundDeal));

module.exports = router;