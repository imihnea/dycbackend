const express = require('express');

const router = express.Router({ mergeParams: true });
const { asyncErrorHandler, isLoggedIn, isReviewAuthor, isBuyer, checkId, verifyCookie } = require('../middleware');
const {
	reviewCreate,
	reviewUpdate,
	reviewDestroy,
	reviewReport
} = require('../controllers/reviews');

/* review reviews create /posts/:id/reviews */
router.post('/:id/reviews', isLoggedIn, checkId, isBuyer, asyncErrorHandler(reviewCreate));

/* PUT reviews update /posts/:id/reviews/:review_id */
router.put('/:id/reviews/:review_id', isLoggedIn, checkId, isReviewAuthor, asyncErrorHandler(reviewUpdate));

/* DELETE reviews destroy /posts/:id/reviews/:review_id */
router.delete('/:id/reviews/:review_id', isLoggedIn, checkId, isReviewAuthor, asyncErrorHandler(reviewDestroy));

/* PUT report review */
router.put('/:id/reviews/:review_id/report', isLoggedIn,  checkId, asyncErrorHandler(reviewReport));

module.exports = router;
