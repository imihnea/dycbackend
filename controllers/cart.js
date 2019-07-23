const Product = require('../models/product');
const User = require('../models/user');
const Deal = require('../models/deal');
const Chat = require('../models/chat');
const Notification = require('../models/notification');
const moment = require('moment');
const ejs = require('ejs');
const path = require('path');
const nodemailer = require('nodemailer');
const { errorLogger, dealLogger } = require('../config/winston');

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

const { client:elasticClient } = require('../config/elasticsearch');
const { asyncErrorHandler } = require('../middleware/index');

module.exports = {
    async getCart(req, res) {
        const products = await Product.find({_id: {$in: req.session.cart}});
        let shipping = false;
        products.forEach((product, index) => {
            if (product.available != 'True') {
                products.splice(products[index], 1);
                req.session.cart.splice(req.session.cart.indexOf(product._id), 1);
            }
            if (product.dropshipped) {
                shipping = true;
            }
        });
        res.render('cart/cart', {
            user: req.user,
            products,
            oneDollar: req.oneDollar,
            shipping,
            pageTitle: 'Cart - Deal Your Crypto',
            pageDescription: 'Cart Page on Deal Your Crypto',
            pageKeywords: 'cart, page, deal, crypto, deal your crypto'
        });
    },
    addToCart(req, res) {
        if (req.session.cart) {
            req.session.cart.push(req.params.id);
        } else {
            req.session.cart = [req.params.id];
        }
        return res.redirect('/cart');
    },
    removeFromCart(req, res) {
        req.session.cart.splice(req.session.cart.indexOf(req.params.id), 1);
        req.flash('success', 'Product removed from cart');
        return res.redirect('back');
    },
    async checkout(req, res) {        
        const products = await Product.find({_id: {$in: req.session.cart}});
        let k = 0;
        products.forEach(product => {
            if (product.dropshipped) {
                k += 1;
            }
        });
        req.check('deliveryName', 'The name must be at least 3 characters long').notEmpty().isLength({ min: 3, max: 500 }).trim();
        req.check('deliveryName', 'The name must not contain any special characters besides the hyphen (-)').matches(/^[a-z -]+$/gi).trim();
        req.check('deliveryEmail', 'Please specify a valid email address').isEmail().normalizeEmail().isLength({ max: 500 })
            .trim();
        if (k > 0) {
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
        }
        const errors = req.validationErrors();
        if (errors) {
            res.render('cart/checkout', {
                user: req.user,
                errors,
                products
            });
        } else {
            const user = await User.findById(req.user._id);
            let totalPrice = 0;
            products.forEach(product => {
                totalPrice += (Number(product.usdPrice * req.oneDollar).toFixed(8));
            });
            if (totalPrice > user.btcbalance) {
                req.flash('error', 'You do not have enough currency');
                return res.redirect('/dashboard/addresses');
            } else {
                user.btcbalance -= totalPrice;
                await user.save();
                products.forEach(asyncErrorHandler( async product => {
                    let deal = {};
                    if (k == 0) {
                        if (req.body.deliveryState == undefined) {
                            req.body.deliveryState = '';
                        }
                        deal = {
                            product: {
                                id: product._id,
                                name: product.name,
                                imageUrl: product.images.sec[0].url,
                                author: product.author,
                                price: product.usdPrice,
                            },
                            buyer: {
                                id: user._id,
                                username: user.username,
                                name: user.full_name,
                                avatarUrl: user.avatar.url,
                                'delivery.shipping': req.body.deliveryShipping,
                                'delivery.name': req.body.deliveryName,
                                'delivery.email': req.body.deliveryEmail,
                                'delivery.street1': req.body.deliveryStreet1,
                                'delivery.country': req.body.deliveryCountry,
                                'delivery.city': req.body.deliveryCity,
                                'delivery.state': req.body.deliveryState,
                                'delivery.zip': req.body.deliveryZip
                            },
                            price: (product.usdPrice * req.oneDollar).toFixed(8),
                        };              
                    } else {
                        deal = {
                            product: {
                                id: product._id,
                                name: product.name,
                                imageUrl: product.images.sec[0].url,
                                author: product.author,
                                price: product.usdPrice,
                            },
                            buyer: {
                                id: user._id,
                                username: user.username,
                                name: user.full_name,
                                avatarUrl: user.avatar.url,
                                'delivery.shipping': req.body.deliveryShipping,
                                'delivery.name': req.body.deliveryName,
                                'delivery.email': req.body.deliveryEmail,

                            },
                            price: (product.usdPrice * req.oneDollar).toFixed(8),
                        }
                    }
                    // Create deal
                    deal = await Deal.create(deal); 
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
                    await Notification.create({
                        userid: product.author.id,
                        linkTo: `/deals/${deal._id}`,
                        imgLink: product.images.sec[0].url,
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
                    let chat = await Chat.find({ "user1.id": req.user._id, "product.id": product._id });
                    if ( chat._id ) {
                        // Link the chat to the deal
                        deal.chat = chat._id;
                        chat.deal = deal._id;
                        await deal.save();
                        await chat.save();
                    } else {
                        // Find the seller
                        const user2 = await User.findById( product.author.id );
                        const newChat = {
                            user1: { 
                                id: req.user._id, 
                                fullname: req.user.full_name,
                                username: req.user.username,
                                avatarUrl: req.user.avatar.url 
                            },
                            user2: { 
                                id: user2.id, 
                                fullname: user2.full_name,
                                username: user2.username,
                                avatarUrl: user2.avatar.url 
                            },
                            product: { 
                                id: product._id, 
                                name: product.name, 
                                imageUrl: product.images.sec[0].url, 
                                price: product.price,
                            },
                            deal: deal._id
                        };
                        chat = await Chat.create(newChat);
                        // Link the deal to the chat
                        deal.chat = chat._id;
                        await deal.save();
                    }
                }));
                req.session.cart = [];
                req.flash('success', 'Your requests have been placed');
                return res.redirect('/dashboard/ongoing');
            }
        }
    }
}