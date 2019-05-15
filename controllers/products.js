const nodemailer = require('nodemailer');
const ObjectID = require("bson-objectid");
const ejs = require('ejs');
const path = require('path');
const Product = require('../models/product');
const User = require('../models/user');
const Deal = require('../models/deal');
const Review = require('../models/review');
const moment = require('moment');
const request = require("request");
const { errorLogger, userLogger, dealLogger } = require('../config/winston');

const EMAIL_USER = process.env.EMAIL_USER || 'k4nsyiavbcbmtcxx@ethereal.email';
const EMAIL_API_KEY = process.env.EMAIL_API_KEY || 'Mx2qnJcNKM5mp4nrG3';
const EMAIL_PORT = process.env.EMAIL_PORT || '587';
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.ethereal.email';

const SAVVY_SECRET = 'secf30f5f307df6c75bbd17b3043c1d81c5';

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
        var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
        const product = await Product.findByIdAndUpdate(req.params.id, { $inc: { views: 1 }, $push: { viewDates: Date.now() } }).populate({
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
        let dealExists = false;
        if (req.user) {
            let reviewed = false;
            reviews.docs.forEach((review) => {
                if (review.author.toString() === req.user._id.toString()) {
                    reviewed = true;
                }
            });
            // Find if the user is already in the process of buying
            await Deal.findOne({$and: [{'buyer.id': req.user._id}, {'product.id': req.params.id}, {status: {$in: ['Processing', 'Pending Delivery', 'Refund Pending', 'Processing Refund']}}]}, (err, res) => {
                if (err) {
                    errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                } else {
                    if (res) {
                        dealExists = [res._id, res.chat];
                    }
                }
            });
            // Find similar products
            Product.aggregate().match({ $and:[{ _id: { $ne: ObjectID(req.params.id) }}, { 'category.3': product.category[3] }] }).sample(4).exec((err, result) => {
                if (err) {
                  if (req.user) {
                    errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                  } else {
                    errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                  }
                  console.log(err);
                  res.render('products/product_view', { 
                    product, 
                    similar: false, 
                    floorRating, 
                    reviews, 
                    reviewed,
                    fullUrl,
                    dealExists,
                    user: req.user,
                    pageTitle: `${product.name} - Deal Your Crypto`,
                    pageDescription: 'Description',
                    pageKeywords: product.searchableTags
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
                            if (req.user) {
                              errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                            } else {
                              errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                            }
                            if (similar.length > 0) {
                                res.render('products/product_view', { 
                                    product, 
                                    similar, 
                                    floorRating, 
                                    reviews, 
                                    reviewed,
                                    fullUrl,
                                    dealExists,
                                    user: req.user,
                                    pageTitle: `${product.name} - Deal Your Crypto`,
                                    pageDescription: 'Description',
                                    pageKeywords: product.searchableTags
                                });
                            } else {
                                res.render('products/product_view', { 
                                    product, 
                                    similar: false, 
                                    floorRating, 
                                    reviews, 
                                    reviewed,
                                    fullUrl,
                                    dealExists,
                                    user: req.user,
                                    pageTitle: `${product.name} - Deal Your Crypto`,
                                    pageDescription: 'Description',
                                    pageKeywords: product.searchableTags
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
                                fullUrl,
                                dealExists,
                                user: req.user,
                                pageTitle: `${product.name} - Deal Your Crypto`,
                                pageDescription: 'Description',
                                pageKeywords: product.searchableTags
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
                            fullUrl,
                            dealExists,
                            user: req.user,
                            pageTitle: `${product.name} - Deal Your Crypto`,
                            pageDescription: 'Description',
                            pageKeywords: product.searchableTags
                        });
                    } else {
                        res.render('products/product_view', { 
                            product, 
                            similar: false, 
                            floorRating, 
                            reviews, 
                            reviewed,
                            fullUrl,
                            dealExists,
                            user: req.user,
                            pageTitle: `${product.name} - Deal Your Crypto`,
                            pageDescription: 'Description',
                            pageKeywords: product.searchableTags
                        });
                    }
                  }
                }
            });
        } else {
            Product.aggregate().match({ $and:[{ _id: { $ne: ObjectID(req.params.id) }}, { 'category.3': product.category[3] }] }).sample(4).exec((err, result) => {
                if (err) {
                    if (req.user) {
                      errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                    } else {
                      errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                    }
                    console.log(err);
                    res.render('products/product_view', { 
                        product, 
                        similar: false, 
                        floorRating, 
                        reviews,
                        fullUrl,
                        dealExists,
                        reviewed: true, 
                        user: false,
                        pageTitle: `${product.name} - Deal Your Crypto`,
                        pageDescription: 'Description',
                        pageKeywords: product.searchableTags
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
                            if (req.user) {
                              errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                            } else {
                              errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                            }
                            console.log(err);
                            if (similar.length > 0) {
                                res.render('products/product_view', { 
                                    product, 
                                    similar, 
                                    floorRating, 
                                    reviews,
                                    fullUrl,
                                    dealExists,
                                    reviewed: true, 
                                    user: false,
                                    pageTitle: `${product.name} - Deal Your Crypto`,
                                    pageDescription: 'Description',
                                    pageKeywords: product.searchableTags
                                });
                            } else {
                                res.render('products/product_view', { 
                                    product, 
                                    similar: false, 
                                    floorRating, 
                                    reviews,
                                    fullUrl,
                                    dealExists,
                                    reviewed: true, 
                                    user: false,
                                    pageTitle: `${product.name} - Deal Your Crypto`,
                                    pageDescription: 'Description',
                                    pageKeywords: product.searchableTags
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
                                fullUrl,
                                dealExists,
                                reviewed: true, 
                                user: false,
                                pageTitle: `${product.name} - Deal Your Crypto`,
                                pageDescription: 'Description',
                                pageKeywords: product.searchableTags
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
                            fullUrl,
                            dealExists,
                            reviewed: true, 
                            user: false,
                            pageTitle: `${product.name} - Deal Your Crypto`,
                            pageDescription: 'Description',
                            pageKeywords: product.searchableTags
                        });
                    } else {
                        res.render('products/product_view', { 
                            product, 
                            similar: false, 
                            floorRating, 
                            reviews,
                            fullUrl,
                            dealExists,
                            reviewed: true, 
                            user: false,
                            pageTitle: `${product.name} - Deal Your Crypto`,
                            pageDescription: 'Description',
                            pageKeywords: product.searchableTags
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
        footerlink: `http://${req.headers.host}/dashboard/notifications`,
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
            errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
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
                    errorLogger.error(`Status: ${error.status || 500}\r\nMessage: ${error.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
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
        const product = await Product.findById(req.params.id);
        req.check('deliveryShipping', 'Something went wrong, please try again.').matches(/(FaceToFace|Shipping)/);
        let errors = req.validationErrors();
        if (errors) {
            req.flash('error', errors[0].msg);
            res.redirect('back');
        } else {
            req.check('deliveryName', 'The name must be at least 3 characters long').notEmpty().isLength({ min: 3, max: 500 }).trim();
            req.check('deliveryName', 'The name must not contain any special characters besides the hyphen (-)').matches(/^[a-z -]+$/gi).trim();
            req.check('deliveryEmail', 'Please specify a valid email address').isEmail().normalizeEmail().isLength({ max: 500 })
                .trim();
            req.check('deliveryPhone', 'Please specify a valid phone number').notEmpty().matches(/^[()0-9+ -]+$/g).isLength({ max: 500 })
                .trim();
            if (req.body.deliveryShipping == 'Shipping') {
                req.check('deliveryStreet1', 'Please input a valid address').notEmpty().matches(/^[a-z0-9., -]+$/gi).isLength({ max: 500 })
                    .trim();
                req.check('deliveryCity', 'The city name must not contain special characters besides the dot, hyphen and comma').notEmpty().matches(/^[a-z .\-,]+$/gi).isLength({ max: 500 })
                    .trim();
                if(req.body.deliveryState) {
                    req.check('deliveryState', 'The state name must not contain special characters besides the dot, hyphen and comma').notEmpty().matches(/^[a-z .\-,]+$/gi).isLength({ max: 500 })
                        .trim();
                }
                req.check('deliveryCountry', 'The country name must not contain special characters besides the dot, hyphen and comma').notEmpty().matches(/^[a-z .\-,]+$/gi).isLength({ max: 500 })
                    .trim();
                req.check('deliveryZip', 'The zip code must not contain special characters besides the dot, hyphen and comma').notEmpty().matches(/^[a-z0-9 .\-,]+$/gi).isLength({ max: 500 })
                    .trim();
                req.check('shippingRate', 'Please choose a correct shipping rate.').notEmpty().isLength({ min: 3, max: 500 }).matches(/^[a-z0-9 .,-]+$/gi)
                .trim();
                req.check('rate', 'Something went wrong, please try again.').notEmpty().isLength({ min: 3, max: 500 }).isAlphanumeric()
                .trim();
            }
            errors = req.validationErrors();
            if (errors) {
                res.render('deals/deal_buy', { 
                    user: req.user,
                    errors: errors,
                    product: product,
                    csrfToken: req.body.csrfSecret,
                    pageTitle: `Buy ${product.name} - Deal Your Crypto`,
                    pageDescription: 'Description',
                    pageKeywords: 'Keywords'
                });
            } else {
                const user  = await User.findById(req.user._id);
                if ( user._id.toString() === product.author.id.toString() ) {
                    req.flash('error', 'You cannot purchase your own product.');
                    res.redirect('back');
                } else {
                    let totalPrice = product.btcPrice;
                    let shippingPrice = 0;
                    let productPrice = product.btcPrice;
                    console.log(`totalPrice: ${totalPrice}`);
                    console.log(`productPrice: ${productPrice}`);
                    console.log(`shippingPrice: ${shippingPrice}`);
                    if ( user.btcbalance >= totalPrice)  {
                        if (req.body.deliveryShipping === 'Shipping') {
                            var url = "https://api.savvy.io/v3/currencies?token=" + SAVVY_SECRET;
                            request(url, async function (error, response, body) {
                                if (!error && response.statusCode == 200) {
                                var json = JSON.parse(body);
                                var data = json.data;
                                console.log(`data: ${data}`)
                                var btcrate = data.btc.rate;
                                console.log(`btcrate: ${btcrate}`)
                                totalPrice += Number(1/btcrate * req.body.shippingRate);
                                console.log(`totalPrice din req: ${totalPrice}`);
                                shippingPrice = Number(1/btcrate * req.body.shippingRate);
                                console.log(`shippingPrice din req: ${shippingPrice}`);
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
                                    price: product.btcPrice,
                                    shippingPrice: shippingPrice,
                                    rate: req.body.rate,
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
                                await User.findByIdAndUpdate(product.author.id, {$inc: { processingDeals: 1 }});
                                await product.save();
                                await user.save();
                                // Send an email to the seller letting them know about the deal request
                                const user2 = await User.findById(product.author.id);
                                if(user2.email_notifications.deal === true) {
                                    ejs.renderFile(path.join(__dirname, "../views/email_templates/buyRequest.ejs"), {
                                        link: `http://${req.headers.host}/deals/${deal._id}`,
                                        footerlink: `http://${req.headers.host}/dashboard/notifications`,
                                        name: product.name,
                                        buyer: req.user.full_name,
                                        subject: `New buy request - Deal Your Crypto`,
                                    }, function (err, data) {
                                        if (err) {
                                            console.log(err);
                                            errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
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
                                                    errorLogger.error(`Status: ${error.status || 500}\r\nMessage: ${error.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                                    console.log(error);
                                                }
                                            });
                                        }
                                    });
                                }
                                dealLogger.info(`Message: User sent a buy request\r\nProduct: ${product._id}\r\nTotal Price: ${totalPrice}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                userLogger.info(`Message: User sent a buy request\r\nProduct: ${product._id}\r\nTotal Price: ${totalPrice}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                // Link chat to deal
                                res.redirect(307, `/messages/${product._id}/${deal._id}/createOngoing?_method=PUT`);
                                } else {
                                    req.flash('err', 'There\'s been an error with your request, please try again.');
                                    return res.redirect('back');
                                }
                            });
                        } else if (req.body.deliveryShipping === 'FaceToFace') {
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
                                price: product.btcPrice,
                                shippingPrice: shippingPrice,
                                rate: req.body.rate,
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
                            await User.findByIdAndUpdate(product.author.id, {$inc: { processingDeals: 1 }});
                            await product.save();
                            await user.save();
                            // Send an email to the seller letting them know about the deal request
                            const user2 = await User.findById(product.author.id);
                            if(user2.email_notifications.deal === true) {
                                ejs.renderFile(path.join(__dirname, "../views/email_templates/buyRequest.ejs"), {
                                    link: `http://${req.headers.host}/deals/${deal._id}`,
                                    footerlink: `http://${req.headers.host}/dashboard/notifications`,
                                    name: product.name,
                                    buyer: req.user.full_name,
                                    subject: `New buy request - Deal Your Crypto`,
                                }, function (err, data) {
                                    if (err) {
                                        console.log(err);
                                        errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
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
                                                errorLogger.error(`Status: ${error.status || 500}\r\nMessage: ${error.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                                console.log(error);
                                            }
                                        });
                                    }
                                });
                            }
                            dealLogger.info(`Message: User sent a buy request\r\nProduct: ${product._id}\r\nTotal Price: ${totalPrice}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                            userLogger.info(`Message: User sent a buy request\r\nProduct: ${product._id}\r\nTotal Price: ${totalPrice}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                            // Link chat to deal
                            res.redirect(307, `/messages/${product._id}/${deal._id}/createOngoing?_method=PUT`);
                        } else {
                            req.flash('error', 'Please select Face to Face or Shipping.');
                            return res.redirect('back');
                        }
                    } else {
                        req.flash('error', 'You do not have enough currency to purchase this product.');
                        return res.redirect('back');
                    }
                }
            }
        }
    }
};
