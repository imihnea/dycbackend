const express = require('express');

const router = express.Router();

const { getDeal, cancelDeal, acceptDeal, declineDeal, refundDeal, completeDeal, refundRequest, refundDeny, reviewProduct, getBuyDeal,
        createAddress, verifyAddress, completeRefund } = require('../controllers/deals');

const middleware = require('../middleware/index');

const { isLoggedIn, asyncErrorHandler, checkIfBelongsDeal, assignCookie, checkId } = middleware; // destructuring assignment

// show deal
router.get('/:id', isLoggedIn, checkId, asyncErrorHandler(checkIfBelongsDeal), asyncErrorHandler(getDeal));

// show interface after pressing buy on a product

router.get('/:id/buy', assignCookie, isLoggedIn, checkId, asyncErrorHandler(getBuyDeal));

// cancel deal
router.put('/:id/cancel', isLoggedIn, checkId, asyncErrorHandler(checkIfBelongsDeal), asyncErrorHandler(cancelDeal));

// accept deal
router.put('/:id/accept', isLoggedIn, checkId, asyncErrorHandler(checkIfBelongsDeal), asyncErrorHandler(acceptDeal));

// decline deal
router.put('/:id/decline', isLoggedIn, checkId, asyncErrorHandler(checkIfBelongsDeal), asyncErrorHandler(declineDeal));

// complete deal
router.put('/:id/complete', isLoggedIn, checkId, asyncErrorHandler(checkIfBelongsDeal), asyncErrorHandler(completeDeal));

// complete deal refund
router.put('/:id/completeRefund', isLoggedIn, checkId, asyncErrorHandler(checkIfBelongsDeal), asyncErrorHandler(completeRefund));

// send refund request message
router.put('/:id/refundRequest', isLoggedIn, checkId, asyncErrorHandler(checkIfBelongsDeal), asyncErrorHandler(refundRequest));

// refund deal
router.put('/:id/refund', isLoggedIn, checkId, asyncErrorHandler(checkIfBelongsDeal), asyncErrorHandler(refundDeal));

// deny refund request
router.put('/:id/refundDeny', isLoggedIn, checkId, asyncErrorHandler(checkIfBelongsDeal), asyncErrorHandler(refundDeny));

// review product
router.get('/:id/review', isLoggedIn, checkId, asyncErrorHandler(checkIfBelongsDeal), asyncErrorHandler(reviewProduct));

// Create address with shippo
router.post('/create-address/:id', isLoggedIn, checkId, asyncErrorHandler(createAddress));

// Verify address with shippo
router.get('/verify-address', isLoggedIn, asyncErrorHandler(verifyAddress));

module.exports = router;
