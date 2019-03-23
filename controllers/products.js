const nodemailer = require('nodemailer');

const Product = require('../models/product');
const User = require('../models/user');
const Deal = require('../models/deal');
const Review = require('../models/review');

const EMAIL_USER = process.env.EMAIL_USER || 'k4nsyiavbcbmtcxx@ethereal.email';
const EMAIL_API_KEY = process.env.EMAIL_API_KEY || 'Mx2qnJcNKM5mp4nrG3';
const EMAIL_PORT = process.env.EMAIL_PORT || '587';
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.ethereal.email';

module.exports = {
    async getProduct(req, res) {
        const product = await Product.findById(req.params.id).populate({
            path: 'reviews',
            options: { sort: { _id: -1 } },
            populate: {
              path: 'author',
              model: 'User',
            },
        });
        // Find similar products
        // Doesn't always show the products - needs further work
        let similar = [];
        await Product.findRandom({ _id: { $ne: req.params.id }, 'category.3': { $eq: product.category[3] }}, {}, { limit: 4 }, async (err, result) => {
            if (err) {
                console.log(err);
            } else if (result != undefined) {
                await similar.push(result);
            }
        });
        const reviews = await Review.paginate({ product: req.params.id },{
            sort: { createdAt: -1 },
            populate: 'product',
            page: req.query.page || 1,
            limit: 5,
          });
        reviews.page = Number(reviews.page);
        const floorRating = product.calculateAvgRating();
        if (req.user) {
            let reviewed = false;
            reviews.docs.forEach((review) => {
                if (review.author.toString() === req.user._id.toString()) {
                    reviewed = true;
                }
            });
            res.render('products/product_view', { product, similar, floorRating, reviews, reviewed, user: req.user });
        } else {
            res.render('products/product_view', { product, similar, floorRating, reviews, reviewed: true, user: false });
        }
    },
    postReport(req, res) {
      const output = `
      <h1>Contact Request - User Report - Deal Your Crypto</h1>
      <h3>Contact Details</h3>
      <ul>
        <li>Id: ${req.user._id}</li>
        <li>Name: ${req.user.full_name}</li>
        <li>Email: ${req.user.email}</li>
        <li>Reported user ID: ${req.body.userid}</li>
        <li>Chat user was reported from: ${req.params.id}</li> 
        <li>Topic: ${req.body.topic}</li>
      </ul>
      <h3>Message</h3>
      <p>${req.body.message}</p>
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
                from: `${req.body.name} <${req.body.email}>`, // sender address
                to: 'support@dyc.com', // list of receivers
                subject: 'Deal Your Crypto - User Report - Contact Request', // Subject line
                html: output, // html body
            };
            // send mail with defined transport object
            transporter.sendMail(mailOptions, (error) => {
                if (error) {
                req.flash('error', `${error.message}`);
                res.render('back', { error: error.message });
                }
                req.flash('success', 'Report sent successfully! We will get back to you as soon as possible.');
                res.redirect('back');
            }); 
        });
    },
    async buyProduct(req, res) {
        // Get the user, the product and the currency the user buys with
        const user  = await User.findById(req.user._id);
        const product = await Product.findById(req.params.id);

        // Unable to buy your own products - Uncomment after testing is done 

        // if ( user._id.toString() === product.author.id ) {
        //     req.flash('error', 'You cannot purchase your own product.');
        //     res.redirect('back');
        // } else {
            let totalPrice = product.btcPrice;
            if ((user.city === product.author.city) && (product.deliveryOptions.city.valid === true)) {
                if (product.deliveryOptions.city.cost === 'paid') {
                    totalPrice += product.btcPrice*product.deliveryOptions.city.percent/100;
                }
            } else if ((user.state === product.author.state) && (product.deliveryOptions.state.valid === true)) {
                if (product.deliveryOptions.state.cost === 'paid') {
                    totalPrice += product.btcPrice*product.deliveryOptions.state.percent/100;
                }
            } else if ((user.country === product.author.country) && (product.deliveryOptions.country.valid === true)) {
                if (product.deliveryOptions.country.cost === 'paid') {
                    totalPrice += product.btcPrice*product.deliveryOptions.state.percent/100;
                }
            } else if ((product.deliveryOptions.worldwide.valid === true)) {
                if (product.deliveryOptions.worldwide.cost === 'paid') {
                    totalPrice += product.btcPrice*product.deliveryOptions.worldwide.percent/100;
                }
            } else {
                req.flash('error', 'The seller does not deliver in your area.');
                res.redirect('back');
            }
            if ( user.btcbalance >= totalPrice)  {
                // Create deal
                let deal = {
                    product: {
                        id: product._id,
                        name: product.name,
                        imageUrl: product.images[0].url,
                        author: product.author,
                        price: product.btcPrice,
                    },
                    buyer: {
                        id: user._id,
                        name: user.username,
                        avatarUrl: user.avatar.url,
                        'address.city': user.city,
                        'address.state': user.state,
                        'address.country': user.country,
                        'address.continent': user.continent,
                        'address.address1': user.address1,
                        'address.address2': user.address2,
                        'address.zip': user.zip,
                    },
                    price: totalPrice
                };
                deal = await Deal.create(deal); 
                // Update product and user
                user.btcbalance -= totalPrice;
                // The product will remain available if it's repeatable
                if ( !product.repeatable ) {
                    product.available = "Closed";
                }
                if (product.nrBought) {
                    product.nrBought += 1;
                } else {
                    product.nrBought = 1;
                }
                product.markModified('buyers');
                await product.save();
                await user.save();
                // Send an email to the seller letting them know about the deal request
                const user2 = await User.findById(product.author.id);
                const output = `
                <h1>You have a new deal request</h1>
                <p>${req.user.full_name} wants to buy ${product.name}.</p>
                <p>Click <a href="localhost:8080/deals/${deal._id}">here</a> to see the deal request and decide whether to accept or deny it.</p>
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
                        to: `${user2.email}`, // list of receivers
                        subject: `New Deal Request`, // Subject line
                        html: output, // html body
                    };
                    // send mail with defined transport object
                    transporter.sendMail(mailOptions, (error) => {
                        if (error) {
                        console.log(error);
                        }
                    });
                });
                // Link chat to deal
                res.redirect(307, `/messages/${product._id}/${deal._id}/createOngoing?_method=PUT`);
            } else {
                req.flash('error', 'You do not have enough currency to purchase this product.');
                res.redirect('back');
            }
        // }
    }
};

// Remove expired feature fields

// setInterval(() => {
//   Product.updateMany({"feat_1.status": true, "feat_1.expiry_date": { $lt: Date.now() } }, { $set: { "feat_1.status": false }}, {multi: true}, (err, result) => {
//     if (err) {
//       console.log(err);
//     } else {
//       // console.log(result);
//     }
//   });
// }, 300000);

// setInterval(() => {
//   Product.updateMany({"feat_2.status": true, "feat_2.expiry_date": { $lt: Date.now() } }, { $set: { "feat_2.status": false }}, {multi: true}, (err, result) => {
//     if (err) {
//       console.log(err);
//     } else {
//       // console.log(result);
//     }
//   });
// }, 300000);