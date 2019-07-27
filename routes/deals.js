const express = require('express');

const router = express.Router();

const multer = require('multer');

const { getDeal, cancelDeal, acceptDeal, declineDeal, refundDeal, completeDeal, refundRequest, refundDeny, reviewProduct, getBuyDeal,
        createAddress, verifyAddress, completeRefund, updateProof, updateRefundProof, destroyDeal } = require('../controllers/deals');

const middleware = require('../middleware/index');

const { isLoggedIn, asyncErrorHandler, checkIfBelongsDeal, assignCookie, checkId, checkIfDealAuthor, checkIfDealBuyer } = middleware; // destructuring assignment

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
router.put('/:id/refundRequest', isLoggedIn, checkId, asyncErrorHandler(checkIfBelongsDeal), upload.array('images', 3), asyncErrorHandler(refundRequest));

// refund deal
router.put('/:id/refund', isLoggedIn, checkId, asyncErrorHandler(checkIfBelongsDeal), asyncErrorHandler(refundDeal));

// deny refund request
router.put('/:id/refundDeny', isLoggedIn, checkId, asyncErrorHandler(checkIfBelongsDeal), asyncErrorHandler(refundDeny));

// review product
router.get('/:id/review', isLoggedIn, checkId, asyncErrorHandler(checkIfBelongsDeal), asyncErrorHandler(reviewProduct));

// Create address with shippo
router.post('/create-address/:id', isLoggedIn, checkId, asyncErrorHandler(createAddress));

// Verify address with shippo
router.post('/verify-address', isLoggedIn, asyncErrorHandler(verifyAddress));

// Add/modify proof of delivery
router.put('/updateProof/:id', isLoggedIn, checkId, asyncErrorHandler(checkIfDealAuthor), upload.single('proofImage'), asyncErrorHandler(updateProof));

// Add/modify proof of delivery
router.put('/updateRefundProof/:id', isLoggedIn, checkId, asyncErrorHandler(checkIfDealBuyer), upload.single('proofImage'), asyncErrorHandler(updateRefundProof));

// Delete deal
router.delete('/delete/:id', isLoggedIn, checkId, asyncErrorHandler(checkIfBelongsDeal), asyncErrorHandler(destroyDeal));

module.exports = router;
