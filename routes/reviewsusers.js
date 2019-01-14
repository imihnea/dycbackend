const express = require('express');
const router = express.Router({ mergeParams: true });
const { asyncErrorHandler, isReviewAuthor } = require('../middleware');
const {
	reviewCreateUser,
	reviewUpdateUser,
	reviewDestroyUser
} = require('../controllers/reviews');

/* review reviews create /posts/:id/reviews */
router.post('/', asyncErrorHandler(reviewCreateUser));

/* PUT reviews update /posts/:id/reviews/:review_id */
router.put('/:review_id', isReviewAuthor, asyncErrorHandler(reviewUpdateUser));

/* DELETE reviews destroy /posts/:id/reviews/:review_id */
router.delete('/:review_id', isReviewAuthor, asyncErrorHandler(reviewDestroyUser));


module.exports = router;
