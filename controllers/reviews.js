const Product = require('../models/product');
const User = require('../models/user');
const Review = require('../models/review');


module.exports = {
	// Reviews Create
	async reviewCreate(req, res, next) {
		// find the product by its id and populate reviews
		let product = await Product.findById(req.params.id).populate('reviews').exec();
		// filter product.reviews to see if any of the reviews were created by logged in user
		// .filter() returns a new array, so use .length to see if array is empty or not
		let haveReviewed = product.reviews.filter(review => {
			return review.author.equals(req.user._id);
		}).length;
		// check if haveReviewed is 0 (false) or 1 (true)
		if(haveReviewed) {
			// flash an error and redirect back to product
			req.session.error = 'Sorry, you can only create one review per product.';
			return res.redirect(`/products/${product.id}/view`);
		}
		// create the review
		req.body.review.author = req.user._id;
		req.body.review.avatarUrl = req.user.avatar.url;
		let review = await Review.create(req.body.review);
		// assign review to product
		product.reviews.push(review);
		// save the product
		product.save();
		// redirect to the product
		req.session.success = 'Review created successfully!';
		res.redirect(`/products/${product.id}/view`);
	},
	// Reviews Update
	async reviewUpdate(req, res, next) {
		await Review.findByIdAndUpdate(req.params.review_id, req.body.review);
		req.session.success = 'Review updated successfully!';
		res.redirect(`/products/${req.params.id}/view`);
	},
	// Reviews Destroy
	async reviewDestroy(req, res, next) {
		await Product.findByIdAndUpdate(req.params.id, {
			$pull: { reviews: req.params.review_id }
		});
		await Review.findByIdAndRemove(req.params.review_id);
		req.session.success = 'Review deleted successfully!';
		res.redirect(`/products/${req.params.id}/view`);
	},
		// User Reviews Create
		async reviewCreateUser(req, res, next) {
			// find the user by its id and populate reviews
			let user = await User.findById(req.params.id).populate('reviews').exec();
			// filter user.reviews to see if any of the reviews were created by logged in user
			// .filter() returns a new array, so use .length to see if array is empty or not
			let haveReviewed = user.reviews.filter(review => {
				return review.author.equals(req.user._id);
			}).length;
			// check if haveReviewed is 0 (false) or 1 (true)
			if(haveReviewed) {
				// flash an error and redirect back to user
				req.session.error = 'Sorry, you can only create one review per user.';
				return res.redirect(`/profile/${user.id}`);
			}
			// create the review
			req.body.review.author = req.user._id;
			req.body.review.avatarUrl = req.user.avatar.url;
			let review = await Review.create(req.body.review);
			// assign review to user
			user.reviews.push(review);
			// save the user
			user.save();
			// redirect to the user
			req.session.success = 'Review created successfully!';
			res.redirect(`/profile/${user.id}`);
		},
		// User Reviews Update
		async reviewUpdateUser(req, res, next) {
			await Review.findByIdAndUpdate(req.params.review_id, req.body.review);
			req.session.success = 'Review updated successfully!';
			res.redirect(`/profile/${req.params.id}`);
		},
		// User Reviews Destroy
		async reviewDestroyUser(req, res, next) {
			await User.findByIdAndUpdate(req.params.id, {
				$pull: { reviews: req.params.review_id }
			});
			await Review.findByIdAndRemove(req.params.review_id);
			req.session.success = 'Review deleted successfully!';
			res.redirect(`/profile/${req.params.id}`);
		}
}
