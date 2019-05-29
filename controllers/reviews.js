const Product = require('../models/product');
const User = require('../models/user');
const Review = require('../models/review');
const nodemailer = require('nodemailer');
const ejs = require('ejs');
const path = require('path');
const { errorLogger, userLogger, reviewLogger } = require('../config/winston');
const moment = require('moment');
const middleware = require('../middleware/index');

const { asyncErrorHandler } = middleware; // destructuring assignment

const EMAIL_USER = process.env.EMAIL_USER || 'k4nsyiavbcbmtcxx@ethereal.email';
const EMAIL_API_KEY = process.env.EMAIL_API_KEY || 'Mx2qnJcNKM5mp4nrG3';
const EMAIL_PORT = process.env.EMAIL_PORT || '587';
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.ethereal.email';

const transporter = nodemailer.createTransport({
	host: EMAIL_HOST,
	port: EMAIL_PORT,
	auth: {
		user: EMAIL_USER,
		pass: EMAIL_API_KEY,
	},
});

module.exports = {
	// Reviews Create
	async reviewCreate(req, res, next) {
		req.check('review[body]', 'The review message contains illegal characters.').matches(/^[a-zA-Z0-9 .,\-!?]+$/g).notEmpty();
		req.check('review[body]', 'The review message contains more than 500 characters').isLength({ max: 500 });
		req.check('review[rating]', 'Something went wrong, please try again.').matches(/^[0-5]$/g).notEmpty();
		const errors = req.validationErrors();
		if (errors) {
			console.log(errors);
			req.flash('error', 'Something went wrong or the message contains illegal characters.');
			return res.redirect('back');
		}
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
			req.flash('error', 'Sorry, you can only create one review per product.');
			return res.redirect(`/products/${product.id}/view`);
		}
		// create the review
		req.body.review.product = req.params.id;
		req.body.review.name = req.user.username;
		req.body.review.author = req.user._id;
		req.body.review.avatarUrl = req.user.avatar.url;
		req.body.review.user = product.author.id;
		let review = await Review.create(req.body.review);
		// assign review to product
		product.reviews.push(review);
		// save the product
		product.save();
		userLogger.info(`Message: Review created - ${review._id}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
		// let the author know of the new review
		const author = await User.findById(product.author.id);
		author.reviews.push(review);
		author.save();
		if(author.email_notifications.user === true) {
			ejs.renderFile(path.join(__dirname, "../views/email_templates/review.ejs"), {
					link: `http://${req.headers.host}/products/${product._id}`,
					footerlink: `http://${req.headers.host}/dashboard/notifications`,
					name: product.name,
					subject: `New review for ${product.name} - Deal Your Crypto`,
			}, 
			function (err, data) {
				if (err) {
					console.log(err);
					errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
				} else {
					const mailOptions = {
							from: `Deal Your Crypto <noreply@dealyourcrypto.com>`, // sender address
							to: `${author.email}`, // list of receivers
							subject: 'Your product has been reviewed', // Subject line
							html: data, // html body
					};
					transporter.sendMail(mailOptions, (error) => {
							if (error) {
								console.log(error);
								errorLogger.error(`Status: ${error.status || 500}\r\nMessage: ${error.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
							}
					});
				}
			});
		}
		// redirect to the product
		req.session.success = 'Review created successfully!';
		return res.redirect(`/products/${product.id}/view`);
	},
	// Reviews Update
	async reviewUpdate(req, res, next) {
		if (req.query.from.match(/(user|product)/g) != null) {
			req.check('review[body]', 'The review message contains illegal characters.').matches(/^[a-zA-Z0-9 .,\-!?]+$/g).notEmpty();
			req.check('review[body]', 'The review message contains more than 500 characters').isLength({ max: 500 });
			req.check('review[rating]', 'Something went wrong, please try again.').matches(/^[0-5]$/g);
			const errors = req.validationErrors();
			if (errors) {
				req.session.error = 'Something went wrong or the message contains illegal characters.';
				return res.redirect(`/products/${req.params.id}/view`);
			}
			await Review.findByIdAndUpdate(req.params.review_id, req.body.review, (err, review) => {
				if (err) {
					errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
					req.flash('error', 'Something went wrong. Please try again.');
					return res.redirect('back');
				} else {
					reviewLogger.info(`Message: Review updated - ${review._id}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
					req.flash('success', 'Review updated successfully!');
					if (req.query.from == 'user') {
						return res.redirect(`/profile/${review.user}`);
					} else {
						return res.redirect(`/products/${req.params.id}/view`);
					}
				}
			});
		} else {
			req.flash('error', 'Something went wrong. Please try again.');
			return res.redirect('back');
		}
	},
	// Reviews Destroy
	async reviewDestroy(req, res, next) {
		if (req.query.from.match(/(user|product)/g) != null) {
			const review = await Review.findById(req.params.review_id);
			// Verify if the user is the author of the review
			if (review.author.toString() == req.user._id.toString()) {
				await review.remove();		
				await Product.findByIdAndUpdate(req.params.id, {
					$pull: { reviews: req.params.review_id }
				});
				await User.findByIdAndUpdate(review.user, {
					$pull: { reviews: req.params.review_id }
				});
				reviewLogger.info(`Review deleted ${req.params.review_id}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
				req.flash('success', 'Review deleted successfully!');
				return res.redirect(`/products/${req.params.id}/view`);
			} else {
				req.flash('error', 'An error has occurred. Please try again.');
				return res.redirect(`/products/${req.params.id}/view`);
			}
		} else {
			req.flash('error', 'Something went wrong. Please try again.');
			return res.redirect('back');
		}
	},
}
