const express = require('express');
const router = express.Router({ mergeParams: true });
const { asyncErrorHandler, isLoggedIn, isReviewAuthor, hasCompleteProfile } = require('../middleware');
const {
	reviewCreateUser,
	reviewUpdateUser,
	reviewDestroyUser
} = require('../controllers/reviews');

/* review reviews create /posts/:id/reviews */
router.post('/', isLoggedIn, hasCompleteProfile, asyncErrorHandler(reviewCreateUser));

/* PUT reviews update /posts/:id/reviews/:review_id */
router.put('/:review_id', isLoggedIn, isReviewAuthor, asyncErrorHandler(reviewUpdateUser));

/* DELETE reviews destroy /posts/:id/reviews/:review_id */
router.delete('/:review_id', isLoggedIn, isReviewAuthor, asyncErrorHandler(reviewDestroyUser));


module.exports = router;
