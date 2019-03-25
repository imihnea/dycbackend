const Product = require('../models/product');
const User = require('../models/user');
const Review = require('../models/review');
const nodemailer = require('nodemailer');
const EMAIL_USER = process.env.EMAIL_USER || 'k4nsyiavbcbmtcxx@ethereal.email';
const EMAIL_API_KEY = process.env.EMAIL_API_KEY || 'Mx2qnJcNKM5mp4nrG3';
const EMAIL_PORT = process.env.EMAIL_PORT || '587';
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.ethereal.email';

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
		req.body.review.product = req.params.id;
		req.body.review.name = req.user.full_name;
		req.body.review.author = req.user._id;
		req.body.review.avatarUrl = req.user.avatar.url;
		let review = await Review.create(req.body.review);
		// assign review to product
		product.reviews.push(review);
		// save the product
		product.save();
		// let the author know of the new review
		const author = await User.findById(product.author.id);
        const output = `
        <h1>${product.name} has a new review!</h1>
        <p>Click <a href="${req.headers.host}/products/${product._id}">here</a> to check it out.</p>
        `;
        // Generate test SMTP service account from ethereal.email
        // Only needed if you don't have a real mail account for testing
        nodemailer.createTestAccount(() => {
        // create reusable transporter object using the default SMTP transport
            const transporter = nodemailer.createTransport({
                host: EMAIL_HOST,
                port: EMAIL_PORT,
                auth: {
                    user: EMAIL_USER,
                    pass: EMAIL_API_KEY,
                },
            });
            // setup email data with unicode symbols
            const mailOptions = {
                from: `Deal Your Crypto <noreply@dyc.com>`, // sender address
                to: `${author.email}`, // list of receivers
                subject: 'Your product has been reviewed', // Subject line
                html: output, // html body
            };
            // send mail with defined transport object
            transporter.sendMail(mailOptions, (error) => {
                if (error) {
                console.log(error);
                }
            });
        });
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
		req.body.review.user = user._id;
		req.body.review.name = req.user.full_name;
		req.body.review.author = req.user._id;
		req.body.review.avatarUrl = req.user.avatar.url;
		let review = await Review.create(req.body.review);
		// assign review to user
		user.reviews.push(review);
		// save the user
		user.save();
		// let the user know of the new review
        const output = `
        <h1>You have a new review!</h1>
        <p>Click <a href="${req.headers.host}/profile/${user._id}">here</a> to check it out.</p>
        `;
        // Generate test SMTP service account from ethereal.email
        // Only needed if you don't have a real mail account for testing
        nodemailer.createTestAccount(() => {
        // create reusable transporter object using the default SMTP transport
            const transporter = nodemailer.createTransport({
                host: EMAIL_HOST,
                port: EMAIL_PORT,
                auth: {
                    user: EMAIL_USER,
                    pass: EMAIL_API_KEY,
                },
            });
            // setup email data with unicode symbols
            const mailOptions = {
                from: `Deal Your Crypto <noreply@dyc.com>`, // sender address
                to: `${user.email}`, // list of receivers
                subject: 'You have been reviewed', // Subject line
                html: output, // html body
            };
            // send mail with defined transport object
            transporter.sendMail(mailOptions, (error) => {
                if (error) {
                console.log(error);
                }
            });
        });
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
