const express = require('express');

const router = express.Router();

const Deal = require('../models/deal');
const User = require('../models/user');

const { getDeal, cancelDeal, acceptDeal, declineDeal, refundDeal, completeDeal, refundRequest, refundDeny, reviewProduct } = require('../controllers/deals');

const middleware = require('../middleware/index');

const { isLoggedIn, asyncErrorHandler, checkIfBelongsDeal } = middleware; // destructuring assignment

// show deal
router.get('/:id', isLoggedIn, asyncErrorHandler(checkIfBelongsDeal), asyncErrorHandler(getDeal));

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

setInterval(async () => {
    // get deals that need to be paid
    let deal = await Deal.find({"status": "Completed", "paid": "false", "refundableUntil": { $lt: Date.now() }});
        deal.forEach(async (item) => {
            // get user who has to be paid
            let seller = await User.findById(item.product.author.id);
            // pay user
            seller.currency[item.boughtWith] += item.price;
            seller.markModified('currency');
            seller.save();
            // set deal as paid  
            item.paid = true;
            item.save();
        });
  }, 1000);

module.exports = router;