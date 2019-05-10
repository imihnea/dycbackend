const express = require('express');

const router = express.Router();

const { getDeal, cancelDeal, acceptDeal, declineDeal, refundDeal, completeDeal, refundRequest, refundDeny, reviewProduct, getBuyDeal,
        createAddress, verifyAddress } = require('../controllers/deals');

const middleware = require('../middleware/index');

const { isLoggedIn, asyncErrorHandler, checkIfBelongsDeal, assignCookie } = middleware; // destructuring assignment

// show deal
router.get('/:id', isLoggedIn, asyncErrorHandler(checkIfBelongsDeal), asyncErrorHandler(getDeal));

// show interface after pressing buy on a product

router.get('/:id/buy', assignCookie, isLoggedIn, asyncErrorHandler(getBuyDeal));

// cancel deal
router.put('/:id/cancel', isLoggedIn, asyncErrorHandler(checkIfBelongsDeal), asyncErrorHandler(cancelDeal));

// accept deal
router.put('/:id/accept', isLoggedIn, asyncErrorHandler(checkIfBelongsDeal), asyncErrorHandler(acceptDeal));

// decline deal
router.put('/:id/decline', isLoggedIn, asyncErrorHandler(checkIfBelongsDeal), asyncErrorHandler(declineDeal));

// complete deal
router.put('/:id/complete', isLoggedIn, asyncErrorHandler(checkIfBelongsDeal), asyncErrorHandler(completeDeal));

// send refund request message
router.put('/:id/refundRequest', isLoggedIn, asyncErrorHandler(checkIfBelongsDeal), asyncErrorHandler(refundRequest));

// refund deal
router.put('/:id/refund', isLoggedIn, asyncErrorHandler(checkIfBelongsDeal), asyncErrorHandler(refundDeal));

// deny refund request
router.put('/:id/refundDeny', isLoggedIn, asyncErrorHandler(checkIfBelongsDeal), asyncErrorHandler(refundDeny));

// review product
router.get('/:id/review', isLoggedIn, asyncErrorHandler(checkIfBelongsDeal), asyncErrorHandler(reviewProduct));

// Create address with shippo
router.post('/create-address/:id', isLoggedIn, asyncErrorHandler(createAddress));

// Verify address with shippo
router.get('/verify-address', isLoggedIn, asyncErrorHandler(verifyAddress));

module.exports = router;
