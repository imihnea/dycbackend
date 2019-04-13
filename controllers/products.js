const nodemailer = require('nodemailer');
const ObjectID = require("bson-objectid");
const ejs = require('ejs');
const path = require('path');
const Product = require('../models/product');
const User = require('../models/user');
const Deal = require('../models/deal');
const Review = require('../models/review');

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
    async getProduct(req, res) {
        const product = await Product.findById(req.params.id).populate({
            path: 'reviews',
            options: { sort: { _id: -1 } },
            populate: {
              path: 'author',
              model: 'User',
            },
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
            // Find similar products
            Product.aggregate().match({ $and:[{ _id: { $ne: ObjectID(req.params.id) }}, { 'category.3': product.category[3] }] }).sample(4).exec((err, result) => {
                if (err) {
                  console.log(err);
                  res.render('products/product_view', { 
                    product, 
                    similar: false, 
                    floorRating, 
                    reviews, 
                    reviewed, 
                    user: req.user,
                    pageTitle: `${product.name} - Deal Your Crypto`,
                    pageDescription: 'Description',
                    pageKeywords: 'Keywords'
                  });
                } else {
                  let similar = result;
                  if (similar.length < 4) {
                    let ids = [ ObjectID(req.params.id) ];
                    if (similar.length > 0) {
                        similar.forEach((sim) => {
                            ids.push(ObjectID(sim._id));
                        });
                    }
                    Product.aggregate().match({ $and:[{ _id: { $nin: ids } }, { 'category.2': product.category[2] }] }).sample(4 - similar.length).exec((err, result) => {
                        if (err) {
                            console.log(err);
                            if (similar.length > 0) {
                                res.render('products/product_view', { 
                                    product, 
                                    similar, 
                                    floorRating, 
                                    reviews, 
                                    reviewed, 
                                    user: req.user,
                                    pageTitle: `${product.name} - Deal Your Crypto`,
                                    pageDescription: 'Description',
                                    pageKeywords: 'Keywords'
                                });
                            } else {
                                res.render('products/product_view', { 
                                    product, 
                                    similar: false, 
                                    floorRating, 
                                    reviews, 
                                    reviewed, 
                                    user: req.user,
                                    pageTitle: `${product.name} - Deal Your Crypto`,
                                    pageDescription: 'Description',
                                    pageKeywords: 'Keywords'
                                });
                            }
                        } else {
                            Array.from(result).forEach((res) => {
                                similar.push(res);
                            });
                            res.render('products/product_view', { 
                                product, 
                                similar, 
                                floorRating, 
                                reviews, 
                                reviewed, 
                                user: req.user,
                                pageTitle: `${product.name} - Deal Your Crypto`,
                                pageDescription: 'Description',
                                pageKeywords: 'Keywords'
                            });
                        }
                    });
                  } else {
                    if (similar.length > 0) {
                        res.render('products/product_view', { 
                            product, 
                            similar, 
                            floorRating, 
                            reviews, 
                            reviewed, 
                            user: req.user,
                            pageTitle: `${product.name} - Deal Your Crypto`,
                            pageDescription: 'Description',
                            pageKeywords: 'Keywords'
                        });
                    } else {
                        res.render('products/product_view', { 
                            product, 
                            similar: false, 
                            floorRating, 
                            reviews, 
                            reviewed, 
                            user: req.user,
                            pageTitle: `${product.name} - Deal Your Crypto`,
                            pageDescription: 'Description',
                            pageKeywords: 'Keywords'
                        });
                    }
                  }
                }
            });
        } else {
            Product.aggregate().match({ $and:[{ _id: { $ne: ObjectID(req.params.id) }}, { 'category.3': product.category[3] }] }).sample(4).exec((err, result) => {
                if (err) {
                    console.log(err);
                    res.render('products/product_view', { 
                        product, 
                        similar: false, 
                        floorRating, 
                        reviews, 
                        reviewed: true, 
                        user: false,
                        pageTitle: `${product.name} - Deal Your Crypto`,
                        pageDescription: 'Description',
                        pageKeywords: 'Keywords'
                    });
                } else {
                  let similar = result;
                  if (similar.length < 4) {
                    let ids = [ ObjectID(req.params.id) ];
                    if (similar.length > 0) {
                        similar.forEach((sim) => {
                            ids.push(ObjectID(sim._id));
                        });
                    }
                    Product.aggregate().match({ $and:[{ _id: { $nin: ids } }, { 'category.2': product.category[2] }] }).sample(4 - similar.length).exec((err, result) => {
                        if (err) {
                            console.log(err);
                            if (similar.length > 0) {
                                res.render('products/product_view', { 
                                    product, 
                                    similar, 
                                    floorRating, 
                                    reviews, 
                                    reviewed: true, 
                                    user: false,
                                    pageTitle: `${product.name} - Deal Your Crypto`,
                                    pageDescription: 'Description',
                                    pageKeywords: 'Keywords'
                                });
                            } else {
                                res.render('products/product_view', { 
                                    product, 
                                    similar: false, 
                                    floorRating, 
                                    reviews, 
                                    reviewed: true, 
                                    user: false,
                                    pageTitle: `${product.name} - Deal Your Crypto`,
                                    pageDescription: 'Description',
                                    pageKeywords: 'Keywords'
                                });
                            }
                        } else {
                            Array.from(result).forEach((res) => {
                                similar.push(res);
                            });
                            res.render('products/product_view', { 
                                product, 
                                similar, 
                                floorRating, 
                                reviews, 
                                reviewed: true, 
                                user: false,
                                pageTitle: `${product.name} - Deal Your Crypto`,
                                pageDescription: 'Description',
                                pageKeywords: 'Keywords'
                            });
                        }
                    });
                  } else {
                    if (similar.length > 0) {
                        res.render('products/product_view', { 
                            product, 
                            similar, 
                            floorRating, 
                            reviews, 
                            reviewed: true, 
                            user: false,
                            pageTitle: `${product.name} - Deal Your Crypto`,
                            pageDescription: 'Description',
                            pageKeywords: 'Keywords'
                        });
                    } else {
                        res.render('products/product_view', { 
                            product, 
                            similar: false, 
                            floorRating, 
                            reviews, 
                            reviewed: true, 
                            user: false,
                            pageTitle: `${product.name} - Deal Your Crypto`,
                            pageDescription: 'Description',
                            pageKeywords: 'Keywords'
                        });
                    }
                  } 
                }
            });
        }
    },
    postReport(req, res) {
      ejs.renderFile(path.join(__dirname, "../views/email_templates/newMessage.ejs"), {
        link: `http://${req.headers.host}/dashboard`,
        id: req.user._id,
        name: req.user.full_name,
        email: req.user.email,
        userid: req.body.userid,
        from: req.params.id,
        topic: req.body.topic,
        message: req.body.message,
        subject: `New report - Deal Your Crypto`,
      }, function (err, data) {
        if (err) {
            console.log(err);
        } else {
            const mailOptions = {
                from: `${req.body.name} <${req.body.email}>`, // sender address
                to: 'support@dyc.com', // list of receivers
                subject: 'User Report - Deal Your Crypto', // Subject line
                html: data, // html body
            };
            // send mail with defined transport object
            transporter.sendMail(mailOptions, (error) => {
                if (error) {
                req.flash('error', `${error.message}`);
                res.redirect('back', { error: error.message });
                }
                req.flash('success', 'Report sent successfully! We will get back to you as soon as possible.');
                res.redirect('back');
            });
        }
    });
    },
    async buyProduct(req, res) {
        // Get the user and the product
        const user  = await User.findById(req.user._id);
        const product = await Product.findById(req.params.id);
        if ( user._id.toString() === product.author.id.toString() ) {
            req.flash('error', 'You cannot purchase your own product.');
            res.redirect('back');
        } else {
            let totalPrice = product.btcPrice;
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
                        username: user.username,
                        name: user.full_name,
                        avatarUrl: user.avatar.url,
                        'delivery.shipping': req.body.deliveryShipping,
                        'delivery.name': req.body.deliveryName,
                        'delivery.street1': req.body.deliveryStreet1,
                        'delivery.city': req.body.deliveryCity,
                        'delivery.state': req.body.deliveryState,
                        'delivery.zip': req.body.deliveryZip,
                        'delivery.country': req.body.deliveryCountry,
                        'delivery.phone': req.body.deliveryPhone,
                        'delivery.email': req.body.deliveryEmail,
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
                ejs.renderFile(path.join(__dirname, "../views/email_templates/buyRequest.ejs"), {
                    link: `http://${req.headers.host}/deals/${deal._id}`,
                    name: product.name,
                    buyer: req.user.full_name,
                    subject: `New buy request - Deal Your Crypto`,
                  }, function (err, data) {
                    if (err) {
                        console.log(err);
                    } else {
                    const mailOptions = {
                        from: `Deal Your Crypto <noreply@dyc.com>`, // sender address
                        to: `${user2.email}`, // list of receivers
                        subject: `New Deal Request - Deal Your Crypto`, // Subject line
                        html: data, // html body
                    };
                    // send mail with defined transport object
                    transporter.sendMail(mailOptions, (error) => {
                        if (error) {
                        console.log(error);
                        }
                    });
                }
            });
                // Link chat to deal
                res.redirect(307, `/messages/${product._id}/${deal._id}/createOngoing?_method=PUT`);
            } else {
                req.flash('error', 'You do not have enough currency to purchase this product.');
                res.redirect('back');
            }
        }
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
