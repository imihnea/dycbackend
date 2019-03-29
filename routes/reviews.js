const express = require('express');
const router = express.Router({ mergeParams: true });
const { asyncErrorHandler, isLoggedIn, isReviewAuthor, hasCompleteProfile } = require('../middleware');
const {
	reviewCreate,
	reviewUpdate,
	reviewDestroy
} = require('../controllers/reviews');

/* review reviews create /posts/:id/reviews */
router.post('/:id/reviews', isLoggedIn, hasCompleteProfile, asyncErrorHandler(reviewCreate));

/* PUT reviews update /posts/:id/reviews/:review_id */
router.put('/:id/reviews/:review_id', isLoggedIn, isReviewAuthor, asyncErrorHandler(reviewUpdate));

/* DELETE reviews destroy /posts/:id/reviews/:review_id */
router.delete('/:id/reviews/:review_id', isLoggedIn, isReviewAuthor, asyncErrorHandler(reviewDestroy));


module.exports = router;
