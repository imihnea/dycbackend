const nodemailer = require('nodemailer');
const ObjectID = require("bson-objectid");
const ejs = require('ejs');
const path = require('path');
const Product = require('../models/product');
const User = require('../models/user');
const Deal = require('../models/deal');
const Review = require('../models/review');
const Notification = require('../models/notification');
const Report = require('../models/report');
const moment = require('moment');
const request = require("request");
const { errorLogger, userLogger, dealLogger } = require('../config/winston');
const middleware = require('../middleware/index');
const { createProfit } = require('../config/profit');
const Client = require('coinbase').Client;
const client = new Client({
  'apiKey': process.env.COINBASE_API_KEY,
  'apiSecret': process.env.COINBASE_API_SECRET,
});
const { client:elasticClient } = require('../config/elasticsearch');

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

const escapeHTML = (unsafe) => {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/@/g, "&commat;")
        .replace(/\^/g, "&Hat;")
        .replace(/:/g, "&colon;")
        .replace(/;/g, "&semi;")
        .replace(/#/g, "&num;")
        .replace(/\$/g, "&dollar;")
        .replace(/%/g, "&percent;")
        .replace(/\*/g, "&ast;")
        .replace(/\(/g, "&lpar;")
        .replace(/\)/g, "&rpar;")
        .replace(/_/g, "&UnderBar;")
        .replace(/=/g, "&equals;")
        .replace(/\+/g, "&plus;")
        .replace(/`/g, "&grave;")
        .replace(/\//g, "&sol;")
        .replace(/\\/g, "&bsol;")
        .replace(/\|/g, "&vert;")
        .replace(/\[/g, "&lsqb;")
        .replace(/\]/g, "&rsqb;")
        .replace(/\{/g, "&lcub;")
        .replace(/\}/g, "&rcub;")
        .replace(/'/g, "&#039;");
};

const cleanHTML = (unclean) => {
    return unclean
      .replace(/</g, "")
      .replace(/>/g, "");
};

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
        if (!product) {
            req.flash('error', 'That page does not exist');
            return res.redirect('/error');
        } 
        const reviews = await Review.paginate({ product: req.params.id },{
            sort: { createdAt: -1 },
            populate: 'product',
            page: req.query.page || 1,
            limit: 5,
        });
        reviews.page = Number(reviews.page);
        const floorRating = product.calculateAvgRating();
        elasticClient.update({
            index: 'products',
            type: 'products',
            id: `${product._id}`,
            body: {
                doc: {
                    avgRating: floorRating
                }
            }
        }, (err) => {
            if (err) {
                if (req.user) {
                    errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                } else {
                    errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                }
            }
        });
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
                  res.render('products/product_view', { 
                    product, 
                    similar: false, 
                    floorRating, 
                    reviews, 
                    reviewed,
                    fullUrl,
                    dealExists,
                    user: req.user,
                    oneDollar: req.oneDollar,
                    csrfToken: req.body.csrfSecret,
                    pageTitle: `${product.name} - Deal Your Crypto`,
                    pageDescription: `Get the best deal for ${product.name} and many more on Deal Your Crypto, the first marketplace dedicated to cryptocurrency.`,
                    pageKeywords: `${product.name}, buy with bitcoin, sell for bitcoin, bitcoin, bitcoin market, crypto, cryptocurrency`
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
                                    oneDollar: req.oneDollar,
                                    csrfToken: req.body.csrfSecret,
                                    pageTitle: `${product.name} - Deal Your Crypto`,
                                    pageDescription: `Get the best deal for ${product.name} and many more on Deal Your Crypto, the first marketplace dedicated to cryptocurrency.`,
                                    pageKeywords: `${product.name}, buy with bitcoin, sell for bitcoin, bitcoin, bitcoin market, crypto, cryptocurrency`
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
                                    oneDollar: req.oneDollar,
                                    csrfToken: req.body.csrfSecret,
                                    pageTitle: `${product.name} - Deal Your Crypto`,
                                    pageDescription: `Get the best deal for ${product.name} and many more on Deal Your Crypto, the first marketplace dedicated to cryptocurrency.`,
                                    pageKeywords: `${product.name}, buy with bitcoin, sell for bitcoin, bitcoin, bitcoin market, crypto, cryptocurrency`
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
                                oneDollar: req.oneDollar,
                                csrfToken: req.body.csrfSecret,
                                pageTitle: `${product.name} - Deal Your Crypto`,
                                pageDescription: `Get the best deal for ${product.name} and many more on Deal Your Crypto, the first marketplace dedicated to cryptocurrency.`,
                                pageKeywords: `${product.name}, buy with bitcoin, sell for bitcoin, bitcoin, bitcoin market, crypto, cryptocurrency`
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
                            oneDollar: req.oneDollar,
                            csrfToken: req.body.csrfSecret,
                            pageTitle: `${product.name} - Deal Your Crypto`,
                            pageDescription: `Get the best deal for ${product.name} and many more on Deal Your Crypto, the first marketplace dedicated to cryptocurrency.`,
                            pageKeywords: `${product.name}, buy with bitcoin, sell for bitcoin, bitcoin, bitcoin market, crypto, cryptocurrency`
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
                            oneDollar: req.oneDollar,
                            csrfToken: req.body.csrfSecret,
                            pageTitle: `${product.name} - Deal Your Crypto`,
                            pageDescription: `Get the best deal for ${product.name} and many more on Deal Your Crypto, the first marketplace dedicated to cryptocurrency.`,
                            pageKeywords: `${product.name}, buy with bitcoin, sell for bitcoin, bitcoin, bitcoin market, crypto, cryptocurrency`
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
                    res.render('products/product_view', { 
                        product, 
                        similar: false, 
                        floorRating, 
                        reviews,
                        fullUrl,
                        dealExists,
                        reviewed: true, 
                        user: false,
                        oneDollar: req.oneDollar,
                        pageTitle: `${product.name} - Deal Your Crypto`,
                        pageDescription: `Get the best deal for ${product.name} and many more on Deal Your Crypto, the first marketplace dedicated to cryptocurrency.`,
                        pageKeywords: `${product.name}, buy with bitcoin, sell for bitcoin, bitcoin, bitcoin market, crypto, cryptocurrency`
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
                                    oneDollar: req.oneDollar,
                                    pageTitle: `${product.name} - Deal Your Crypto`,
                                    pageDescription: `Get the best deal for ${product.name} and many more on Deal Your Crypto, the first marketplace dedicated to cryptocurrency.`,
                                    pageKeywords: `${product.name}, buy with bitcoin, sell for bitcoin, bitcoin, bitcoin market, crypto, cryptocurrency`
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
                                    oneDollar: req.oneDollar,
                                    pageTitle: `${product.name} - Deal Your Crypto`,
                                    pageDescription: `Get the best deal for ${product.name} and many more on Deal Your Crypto, the first marketplace dedicated to cryptocurrency.`,
                                    pageKeywords: `${product.name}, buy with bitcoin, sell for bitcoin, bitcoin, bitcoin market, crypto, cryptocurrency`
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
                                oneDollar: req.oneDollar,
                                pageTitle: `${product.name} - Deal Your Crypto`,
                                pageDescription: `Get the best deal for ${product.name} and many more on Deal Your Crypto, the first marketplace dedicated to cryptocurrency.`,
                                pageKeywords: `${product.name}, buy with bitcoin, sell for bitcoin, bitcoin, bitcoin market, crypto, cryptocurrency`
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
                            oneDollar: req.oneDollar,
                            pageTitle: `${product.name} - Deal Your Crypto`,
                            pageDescription: `Get the best deal for ${product.name} and many more on Deal Your Crypto, the first marketplace dedicated to cryptocurrency.`,
                            pageKeywords: `${product.name}, buy with bitcoin, sell for bitcoin, bitcoin, bitcoin market, crypto, cryptocurrency`
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
                            oneDollar: req.oneDollar,
                            pageTitle: `${product.name} - Deal Your Crypto`,
                            pageDescription: `Get the best deal for ${product.name} and many more on Deal Your Crypto, the first marketplace dedicated to cryptocurrency.`,
                            pageKeywords: `${product.name}, buy with bitcoin, sell for bitcoin, bitcoin, bitcoin market, crypto, cryptocurrency`
                        });
                    }
                  } 
                }
            });
        }
    },
    async postReport(req, res) {
        req.check('message', 'The message must be between 3 and 250 characters long').notEmpty().isLength({min: 3, max: 250});
        req.check('topic', 'The reason does not match').matches(/^(Scam|Fake|Harassment|Other)$/);
        const errors = req.validationErrors();
        if (errors) {
            req.flash('error', 'Please select a reason and type a message.');
            return res.redirect('back');
        }
        const deal = await Deal.findById(req.params.id);        
        if (deal.report.status == true) {
            req.flash('error', 'You have already reported this deal. We will take a look at it as soon as possible');
            return res.redirect('back');
        }
        const report = await Report.create({
            message: cleanHTML(req.body.message),
            reason: req.body.topic,
            deal: deal._id,
            from: req.user._id
        });
        deal.report.status = true;
        deal.report.report = report._id;
        await deal.save();
        req.flash('success', 'User reported successfully');
        return res.redirect('back');
    },
    async buyProduct(req, res) {
        // Get the user and the product
        const product = await Product.findById(req.params.id);
        req.check('deliveryShipping', 'Something went wrong, please try again.').matches(/(FaceToFace)/);
        let errors = req.validationErrors();
        if (errors) {
            req.flash('error', errors[0].msg);
            return res.redirect('back');
        } else {
            req.check('deliveryName', 'The name must be at least 3 characters long').notEmpty().isLength({ min: 3, max: 500 }).trim();
            req.check('deliveryName', 'The name must not contain any special characters besides the hyphen (-)').matches(/^[a-z -]+$/gi).trim();
            req.check('deliveryEmail', 'Please specify a valid email address').isEmail().normalizeEmail().isLength({ max: 500 })
                .trim();
            req.check('deliveryPhone', 'Please specify a valid phone number').notEmpty().matches(/^[()0-9+ -]+$/g).isLength({ max: 500 })
                .trim();
            // if (req.body.deliveryShipping == 'Shipping') {
            //     req.check('deliveryStreet1', 'Please input a valid address').notEmpty().matches(/^[a-z0-9., -]+$/gi).isLength({ max: 500 })
            //         .trim();
            //     req.check('deliveryCity', 'The city name must not contain special characters besides the dot, hyphen and comma').notEmpty().matches(/^[a-z .\-,]+$/gi).isLength({ max: 500 })
            //         .trim();
            //     if(req.body.deliveryState) {
            //         req.check('deliveryState', 'The state name must not contain special characters besides the dot, hyphen and comma').notEmpty().matches(/^[a-z .\-,]+$/gi).isLength({ max: 500 })
            //             .trim();
            //     }
            //     req.check('deliveryCountry', 'The country name must not contain special characters besides the dot, hyphen and comma').notEmpty().matches(/^[a-z .\-,]+$/gi).isLength({ max: 500 })
            //         .trim();
            //     req.check('deliveryZip', 'The zip code must not contain special characters besides the dot, hyphen and comma').notEmpty().matches(/^[a-z0-9 .\-,]+$/gi).isLength({ max: 500 })
            //         .trim();
            //     req.check('shippingRate', 'Please choose a correct shipping rate.').notEmpty().isLength({ min: 3, max: 500 }).matches(/^[a-z0-9 .,-]+$/gi)
            //     .trim();
            //     req.check('rate', 'Something went wrong, please try again.').notEmpty().isLength({ min: 3, max: 500 }).isAlphanumeric()
            //     .trim();
            // }
            errors = req.validationErrors();
            if (errors) {
                client.getExchangeRates({'currency': 'BTC'}, asyncErrorHandler(async (error, data) => {
                    if (!error) {
                        let btcrate = data.data.rates.USD;
                        res.render('deals/deal_buy', { 
                            user: req.user,
                            errors: errors,
                            product: product,
                            btcrate,
                            csrfToken: req.body.csrfSecret,
                            pageTitle: `Buy ${product.name} - Deal Your Crypto`,
                            pageDescription: `Buy ${product.name} for Bitcoin on Deal Your Crypto, the first marketplace dedicated to cryptocurrency.`,
                            pageKeywords: `buy with bitcoin, ${product.name}, bitcoin, bitcoin market, crypto, cryptocurrency`,
                        });
                    } else {
                        res.render('deals/deal_buy', { 
                            user: req.user,
                            errors: errors,
                            product: product,
                            btcrate: 0,
                            csrfToken: req.body.csrfSecret,
                            pageTitle: `Buy ${product.name} - Deal Your Crypto`,
                            pageDescription: `Buy ${product.name} for Bitcoin on Deal Your Crypto, the first marketplace dedicated to cryptocurrency.`,
                            pageKeywords: `buy with bitcoin, ${product.name}, bitcoin, bitcoin market, crypto, cryptocurrency`,
                        });
                    }
                }));
            } else {
                const user  = await User.findById(req.user._id);
                if ( user._id.toString() === product.author.id.toString() ) {
                    req.flash('error', 'You cannot purchase your own product.');
                    return res.redirect('back');
                } else {
                    let totalPrice = product.btcPrice;
                    let shippingPrice = 0;
                    let productPrice = product.btcPrice;
                    if ( user.btcbalance >= totalPrice)  {
                        // if (req.body.deliveryShipping === 'Shipping') {
                        //     client.getExchangeRates({'currency': 'BTC'}, asyncErrorHandler(async (error, data) => {
                        //         if (!error) {
                        //         let btcrate = data.data.rates.USD;
                        //         totalPrice += Number(1/btcrate * req.body.shippingRate);
                        //         shippingPrice = Number(1/btcrate * req.body.shippingRate);
                        //         let deal = {
                        //             product: {
                        //                 id: product._id,
                        //                 name: product.name,
                        //                 imageUrl: product.images[0].url,
                        //                 author: product.author,
                        //                 price: product.btcPrice,
                        //             },
                        //             buyer: {
                        //                 id: user._id,
                        //                 username: user.username,
                        //                 name: user.full_name,
                        //                 avatarUrl: user.avatar.url,
                        //                 'delivery.shipping': req.body.deliveryShipping,
                        //                 'delivery.name': req.body.deliveryName,
                        //                 'delivery.street1': req.body.deliveryStreet1,
                        //                 'delivery.city': req.body.deliveryCity,
                        //                 'delivery.state': req.body.deliveryState,
                        //                 'delivery.zip': req.body.deliveryZip,
                        //                 'delivery.country': req.body.deliveryCountry,
                        //                 'delivery.phone': req.body.deliveryPhone,
                        //                 'delivery.email': req.body.deliveryEmail,
                        //             },
                        //             price: product.btcPrice,
                        //             shippingPrice: shippingPrice,
                        //             rate: req.body.rate,
                        //         };
                        //         deal = await Deal.create(deal); 
                        //         // Update product and user
                        //         user.btcbalance -= totalPrice;
                        //         // The product will remain available if it's repeatable
                        //         if ( !product.repeatable ) {
                        //             product.available = "Closed";
                        //             elasticClient.delete({
                        //                 index: 'products',
                        //                 type: 'products',
                        //                 id: `${product._id}`
                        //               }, (err) => {
                        //                 if (err) {
                        //                     errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nCouldn't delete product ${product._id}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);          
                        //                   }
                        //             });   
                        //         }
                        //         if (product.nrBought) {
                        //             product.nrBought += 1;
                        //         } else {
                        //             product.nrBought = 1;
                        //         }
                        //         product.markModified('buyers');
                        //         await User.findByIdAndUpdate(product.author.id, {$inc: { processingDeals: 1, unreadNotifications: 1 }});
                        //         await product.save();
                        //         await user.save();
                        //         await Notification.create({
                        //             userid: product.author.id,
                        //             linkTo: `/deals/${deal._id}`,
                        //             imgLink: product.images[0].url,
                        //             message: `You have received a deal request`
                        //         });
                        //         // Send an email to the seller letting them know about the deal request
                        //         const user2 = await User.findById(product.author.id);
                        //         if(user2.email_notifications.deal === true) {
                        //             ejs.renderFile(path.join(__dirname, "../views/email_templates/buyRequest.ejs"), {
                        //                 link: `https://${req.headers.host}/deals/${deal._id}`,
                        //                 footerlink: `https://${req.headers.host}/dashboard/notifications`,
                        //                 name: product.name,
                        //                 buyer: req.user.full_name,
                        //                 subject: `New buy request - Deal Your Crypto`,
                        //             }, function (err, data) {
                        //                 if (err) {
                        //                     errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                        //                 } else {
                        //                     const mailOptions = {
                        //                         from: `Deal Your Crypto <noreply@dealyourcrypto.com>`, // sender address
                        //                         to: `${user2.email}`, // list of receivers
                        //                         subject: `New Deal Request - Deal Your Crypto`, // Subject line
                        //                         html: data, // html body
                        //                     };
                        //                     // send mail with defined transport object
                        //                     transporter.sendMail(mailOptions, (error) => {
                        //                         if (error) {
                        //                             errorLogger.error(`Status: ${error.status || 500}\r\nMessage: ${error.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                        //                         }
                        //                     });
                        //                 }
                        //             });
                        //         }
                        //         dealLogger.info(`Message: User sent a buy request\r\nProduct: ${product._id}\r\nTotal Price: ${totalPrice}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                        //         userLogger.info(`Message: User sent a buy request\r\nProduct: ${product._id}\r\nTotal Price: ${totalPrice}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                        //         // Link chat to deal
                        //         return res.redirect(307, `/messages/${product._id}/${deal._id}/createOngoing?_method=PUT`);
                        //         } else {
                        //             req.flash('err', 'There\'s been an error with your request, please try again.');
                        //             return res.redirect('back');
                        //         }
                        //     }));
                        /* } else */if (req.body.deliveryShipping === 'FaceToFace') {
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
                                    'delivery.phone': req.body.deliveryPhone,
                                    'delivery.email': req.body.deliveryEmail,
                                },
                                price: product.btcPrice,
                            };
                            deal = await Deal.create(deal); 
                            // Update product and user
                            user.btcbalance -= totalPrice;
                            // The product will remain available if it's repeatable
                            if ( !product.repeatable ) {
                                product.available = "Closed";
                                elasticClient.delete({
                                    index: 'products',
                                    type: 'products',
                                    id: `${product._id}`
                                  }, (err) => {
                                    if (err) {
                                        errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nCouldn't delete product ${product._id}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);          
                                      }
                                });
                            }
                            if (product.nrBought) {
                                product.nrBought += 1;
                            } else {
                                product.nrBought = 1;
                            }
                            product.markModified('buyers');
                            await User.findByIdAndUpdate(product.author.id, {$inc: { processingDeals: 1, unreadNotifications: 1 }});
                            await product.save();
                            await user.save();
                            await Notification.create({
                                userid: product.author.id,
                                linkTo: `/deals/${deal._id}`,
                                imgLink: product.images[0].url,
                                message: `You have received a deal request`
                            });
                            // Send an email to the seller letting them know about the deal request
                            const user2 = await User.findById(product.author.id);
                            if(user2.email_notifications.deal === true) {
                                ejs.renderFile(path.join(__dirname, "../views/email_templates/buyRequest.ejs"), {
                                    link: `https://${req.headers.host}/deals/${deal._id}`,
                                    footerlink: `https://${req.headers.host}/dashboard/notifications`,
                                    name: product.name,
                                    buyer: req.user.full_name,
                                    subject: `New buy request - Deal Your Crypto`,
                                }, function (err, data) {
                                    if (err) {
                                        errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                    } else {
                                        const mailOptions = {
                                            from: `Deal Your Crypto <noreply@dealyourcrypto.com>`, // sender address
                                            to: `${user2.email}`, // list of receivers
                                            subject: `New Deal Request - Deal Your Crypto`, // Subject line
                                            html: data, // html body
                                        };
                                        // send mail with defined transport object
                                        transporter.sendMail(mailOptions, (error) => {
                                            if (error) {
                                                errorLogger.error(`Status: ${error.status || 500}\r\nMessage: ${error.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                            }
                                        });
                                    }
                                });
                            }
                            dealLogger.info(`Message: User sent a buy request\r\nProduct: ${product._id}\r\nDeal: ${deal._id}\r\nTotal Price: ${totalPrice}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                            // Link chat to deal
                            return res.redirect(307, `/messages/${product._id}/${deal._id}/createOngoing?_method=PUT`);
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
    },
    async reportProduct(req, res) {
        const product = await Product.findById(req.params.id);
        let reported = 0;
        product.reports.forEach(report => {
            if (report.from.toString() == req.user._id.toString()) {
                reported = 1;
            }
        });
        if (reported == 1) {
            req.flash('error', 'You have already reported this product');
            return res.redirect('back');
        }
        req.check('message', 'The message must be between 3 and 250 characters long').notEmpty().isLength({min: 3, max: 250});
        req.check('reason', 'The reason does not match').matches(/^(Scam|No Product|Illegal|Other)$/);
        const errors = req.validationErrors();
        if (errors) {
            req.flash('error', 'The message must be between 3 and 250 characters long');
            return res.redirect('back');
        }
        const report = await Report.create({
            message: cleanHTML(req.body.message),
            reason: req.body.reason,
            product: req.params.id
        });
        product.reports.push({from: req.user._id, report: report._id});
        await product.save();
        req.flash('success', 'Product reported successfully');
        return res.redirect('back');
    }
};
