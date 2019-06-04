const User = require('../models/user');
const Deal = require('../models/deal');
const Notification = require('../models/notification');
const { logger, dealLogger, errorLogger } = require('../config/winston');
const moment = require('moment');
const ejs = require('ejs');
const path = require('path');
const Product = require('../models/product');
const Chat = require('../models/chat');
const nodemailer = require('nodemailer');
const request = require("request");
const shippo = require('shippo')('shippo_test_df6c272d5ff5a03ed46f7fa6371c73edd2964986');
const middleware = require('../middleware/index');
const Client = require('coinbase').Client;
const client = new Client({
  'apiKey': process.env.COINBASE_API_KEY,
  'apiSecret': process.env.COINBASE_API_SECRET,
});


const { asyncErrorHandler } = middleware; // destructuring assignment

const EMAIL_USER = process.env.EMAIL_USER || 'k4nsyiavbcbmtcxx@ethereal.email';
const EMAIL_API_KEY = process.env.EMAIL_API_KEY || 'Mx2qnJcNKM5mp4nrG3';
const EMAIL_PORT = process.env.EMAIL_PORT || '587';
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.ethereal.email';

const refundTimer = 60000;

// Deal payout fees (%)
const standardAccountFee = 15;
const premiumAccountFee = 10;
const partnerAccountFee = 10;

let transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_API_KEY,
    },
});

module.exports = {
    async getDeal(req, res) {
        const deal = await Deal.findById(req.params.id);
        const seller = await User.findById(deal.product.author.id);
        const buyer = await User.findById(deal.buyer.id);
        const chat = await Chat.findById(deal.chat);
        res.render('deals/deal', { 
            deal, 
            seller, 
            buyer, 
            user: req.user, 
            chat, 
            errors: false,
            pageTitle: `${deal.product.name} - Deal Your Crypto`,
            pageDescription: 'Description',
            pageKeywords: 'Keywords'
        });
    },
    async getBuyDeal(req, res) {
        // shippo.carrieraccount.list({results:10})
        // .then(function(carrieraccount){
        //     console.log(carrieraccount);
        // });
        // shippo.address.list({results:2})   
        // .then(function(address){
        //     console.log(address);
        // });
        const product = await Product.findById(req.params.id);
        client.getExchangeRates({'currency': 'BTC'}, function(error, data) {
            if(error) {
                req.flash('err', 'There\'s been an error, please try again.');
                return res.redirect('back');
            } else {
                let btcrate = data.data.rates.USD;
                res.render('deals/deal_buy', {
                    user: req.user,
                    errors: false,
                    product: product,
                    btcrate,
                    csrfToken: req.body.csrfSecret,
                    pageTitle: `Buy ${product.name} - Deal Your Crypto`,
                    pageDescription: 'Description',
                    pageKeywords: 'Keywords',
                });
            }
        });
    },
    async acceptDeal(req, res) {
        const deal = await Deal.findById(req.params.id);
        deal.status = 'Pending Delivery';
        await deal.save();
        if (deal.buyer.delivery.shipping == 'FaceToFace') {
            dealLogger.info(`Message: Deal ${deal._id} accepted\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
            await User.findByIdAndUpdate(deal.product.author.id, {$inc: { processingDeals: -1 }});
            await Notification.create({
                userid: deal.buyer._id,
                linkTo: `/deals/${deal._id}`,
                imgLink: deal.product.imageUrl,
                message: `Your deal request has been accepted`
            });
            const buyer = await User.findById(deal.buyer.id);
            buyer.unreadNotifications += 1;
            await buyer.save();
            if(buyer.email_notifications.deal === true) {
                ejs.renderFile(path.join(__dirname, "../views/email_templates/acceptDeal.ejs"), {
                    link: `http://${req.headers.host}/deals/${deal._id}`,
                    footerlink: `http://${req.headers.host}/dashboard/notifications`,
                    name: deal.product.name,
                    subject: `Status changed for ${deal.product.name} - Deal Your Crypto`,
                }, function (err, data) {
                    if (err) {
                        errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                        console.log(err);
                    } else {
                    const mailOptions = {
                        from: `Deal Your Crypto <noreply@dealyourcrypto.com>`, // sender address
                        to: `${buyer.email}`, // list of receivers
                        subject: 'Deal Status Changed', // Subject line
                        html: data, // html body
                    };
                    transporter.sendMail(mailOptions, (error) => {
                        if (error) {
                            errorLogger.error(`Status: ${error.status || 500}\r\nMessage: ${error.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                            console.log(error);
                        }
                            req.flash('success', 'Deal accepted successfully.');
                            return res.redirect('back');
                        });
                    }
                });
            } else {
                req.flash('success', 'Deal accepted successfully.');
                return res.redirect('back');
            }
        } else if (deal.buyer.delivery.shipping == 'Shipping') {
            console.log(`rate: ${deal.rate}`);
            shippo.transaction.create({
                "rate": deal.rate,
                "label_file_type": "PDF",
                "async": true,
            }, asyncErrorHandler(async (err, transaction) => {
                // asynchronously called
                if(err) {
                    console.log(err);
                    errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                    return res.redirect('back');
                }
                const result = JSON.stringify(transaction);
                console.log(`Full transaction details: ${result}`);
                if(result.status === 'ERROR') {
                    req.flash('error', 'There\'s been an error creating the label, please try again.');
                    return res.redirect('back');
                } else {
                    dealLogger.info(`Message: Deal ${deal._id} accepted\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                    await User.findByIdAndUpdate(deal.product.author.id, {$inc: { processingDeals: -1 }});
                    await Notification.create({
                        userid: deal.buyer.id,
                        linkTo: `/deals/${deal._id}`,
                        imgLink: deal.product.imageUrl,
                        message: `Your deal request has been accepted`
                    });
                    const buyer = await User.findById(deal.buyer.id);
                    buyer.unreadNotifications += 1;
                    await buyer.save();
                    if(buyer.email_notifications.deal === true) {
                        ejs.renderFile(path.join(__dirname, "../views/email_templates/acceptDeal.ejs"), {
                            link: result.tracking_url_provider, // Tracking url
                            footerlink: `http://${req.headers.host}/dashboard/notifications`,
                            name: deal.product.name,
                            subject: `Status changed for ${deal.product.name} - Deal Your Crypto`,
                        }, function (err, data) {
                            if (err) {
                                errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                console.log(err);
                            } else {
                            const mailOptions = {
                                from: `Deal Your Crypto <noreply@dealyourcrypto.com>`, // sender address
                                to: `${buyer.email}`, // list of receivers
                                subject: 'Deal Status Changed', // Subject line
                                html: data, // html body
                            };
                            transporter.sendMail(mailOptions, (error) => {
                                if (error) {
                                    errorLogger.error(`Status: ${error.status || 500}\r\nMessage: ${error.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                    console.log(error);
                                }
                                    req.flash('success', 'Deal accepted successfully.');
                                    return res.redirect('back');
                                });
                            }
                        });
                    } else {
                        req.flash('success', 'Deal accepted successfully.');
                        return res.redirect('back');
                    }
                }
            }));
        }
    },
    async declineDeal(req, res) {
        const deal = await Deal.findById(req.params.id);
        const buyer = await User.findById(deal.buyer.id);
        deal.status = 'Declined';
        await deal.save();
        dealLogger.info(`Message: Deal ${deal._id} declined\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
        await User.findByIdAndUpdate(deal.product.author.id, {$inc: { processingDeals: -1 }});
        buyer.btcbalance += deal.price;
        buyer.unreadNotifications += 1;
        await buyer.save();
        await Notification.create({
            userid: deal.buyer.id,
            linkTo: `/deals/${deal._id}`,
            imgLink: deal.product.imageUrl,
            message: `Your deal request has been declined`
        });
        await Product.findByIdAndUpdate(deal.product.id, {$set: {available: 'True'}});
        if(buyer.email_notifications.deal === true) {
            ejs.renderFile(path.join(__dirname, "../views/email_templates/declineDeal.ejs"), {
                link: `http://${req.headers.host}/deals/${deal._id}`,
                footerlink: `http://${req.headers.host}/dashboard/notifications`,
                name: deal.product.name,
                subject: `Status changed for ${deal.product.name} - Deal Your Crypto`,
            }, function (err, data) {
                if (err) {
                    errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                    console.log(err);
                } else {
                const mailOptions = {
                    from: `Deal Your Crypto <noreply@dealyourcrypto.com>`, // sender address
                    to: `${buyer.email}`, // list of receivers
                    subject: 'Deal Status Changed', // Subject line
                    html: data, // html body
                };
                transporter.sendMail(mailOptions, (error) => {
                    if (error) {
                        errorLogger.error(`Status: ${error.status || 500}\r\nMessage: ${error.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                        console.log(error);
                    }
                        req.flash('success', 'Deal denied successfully.');
                        return res.redirect('back');
                    });
                }
            });
        } else {
            req.flash('success', 'Deal denied successfully.');
            return res.redirect('back');
        }
    },
    async completeDeal(req, res) {
        const deal = await Deal.findById(req.params.id);
        const product = await Product.findById(deal.product.id);
        const seller = await User.findById(deal.product.author.id);
        deal.completedAt = Date.now();
        if (deal.buyer.delivery.shipping == 'FaceToFace') {
            deal.refundableUntil = Date.now();
        } else if (deal.buyer.delivery.shipping == 'Shipping') {
            deal.refundableUntil = Date.now() + refundTimer;
        }
        deal.status = 'Completed';
        await deal.save();
        seller.nrSold += 1;
        seller.unreadNotifications += 1;
        await seller.save();
        await Notification.create({
            userid: seller._id,
            linkTo: `/deals/${deal._id}`,
            imgLink: deal.product.imageUrl,
            message: `Your deal request has been completed`
        });
        if (!product.repeatable) {
            product.available = 'Closed';
            await product.save();
            product.unIndex((err) => {
                if (err) {
                    console.log('Error while unindexing document.');
                    errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                    console.log(err);
                } else {
                    console.log('Document unindexed successfully.');
                }
            });
        }
        const buyer = await User.findById(deal.buyer.id);
        // Buyer email
        if(buyer.email_notifications.deal === true) {
            ejs.renderFile(path.join(__dirname, "../views/email_templates/completeDeal_buyer.ejs"), {
                link: `http://${req.headers.host}/deals/${deal._id}`,
                footerlink: `http://${req.headers.host}/dashboard/notifications`,
                name: deal.product.name,
                subject: `Status changed for ${deal.product.name} - Deal Your Crypto`,
            }, function (err, data) {
                if (err) {
                    console.log(err);
                } else {
                const mailOptions = {
                    from: `Deal Your Crypto <noreply@dealyourcrypto.com>`, // sender address
                    to: `${buyer.email}`, // list of receivers
                    subject: 'Deal Status Changed', // Subject line
                    html: data, // html body
                };
                transporter.sendMail(mailOptions, (error) => {
                    if (error) {
                        errorLogger.error(`Status: ${error.status || 500}\r\nMessage: ${error.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                        console.log(error);
                    }
                });
            }});
        }
        // Seller email
        if(seller.email_notifications.deal === true) {
            ejs.renderFile(path.join(__dirname, "../views/email_templates/completeDeal_seller.ejs"), {
                link: `http://${req.headers.host}/dashboard`,
                footerlink: `http://${req.headers.host}/dashboard/notifications`,
                name: deal.product.name,
                subject: `Status changed for ${deal.product.name} - Deal Your Crypto`,
            }, function (err, data) {
                if (err) {
                    errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                    console.log(err);
                } else {
                const mailOptions = {
                    from: `Deal Your Crypto <noreply@dealyourcrypto.com>`, // sender address
                    to: `${seller.email}`, // list of receivers
                    subject: 'Deal Status Changed', // Subject line
                    html: data, // html body
                };
                transporter.sendMail(mailOptions, (error) => {
                    if (error) {
                        errorLogger.error(`Status: ${error.status || 500}\r\nMessage: ${error.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                        console.log(error);
                    }
                });
            }});
        }
        dealLogger.info(`Message: Deal ${deal._id} completed\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
        return res.redirect(`/deals/${deal._id}/review`);
    },
    async cancelDeal(req, res) {
        const deal = await Deal.findById(req.params.id);
        if (deal.buyer.shipping === 'FaceToFace') {
            await User.findByIdAndUpdate(deal.buyer.id, {$inc: { btcbalance: deal.price }});
        } else if (deal.buyer.shipping === 'Shipping') {
            await User.findByIdAndUpdate(deal.buyer.id, {$inc: { btcbalance: (deal.price + deal.shippingPrice) }});
        }
        deal.status = 'Cancelled';
        deal.completedAt = Date.now();
        await deal.save();
        await User.findByIdAndUpdate(deal.product.author.id, {$inc: { processingDeals: -1 }});
        await Product.findByIdAndUpdate(deal.product.id, {$set: { available: 'True' }});
        // Seller email
        const seller = await User.findById(deal.product.author.id);
        seller.unreadNotifications += 1;
        await seller.save();
        await Notification.create({
            userid: seller._id,
            linkTo: `/deals/${deal._id}`,
            imgLink: deal.product.imageUrl,
            message: `Your deal request has been cancelled`
        });
        if(seller.email_notifications.deal === true) {
            ejs.renderFile(path.join(__dirname, "../views/email_templates/cancelDeal.ejs"), {
                link: `http://${req.headers.host}/dashboard`,
                footerlink: `http://${req.headers.host}/dashboard/notifications`,
                name: deal.product.name,
                subject: `Status changed for ${deal.product.name} - Deal Your Crypto`,
            }, function (err, data) {
                if (err) {
                    errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                    console.log(err);
                } else {
                const mailOptions = {
                    from: `Deal Your Crypto <noreply@dealyourcrypto.com>`, // sender address
                    to: `${seller.email}`, // list of receivers
                    subject: 'Deal Status Changed', // Subject line
                    html: data, // html body
                };
                // send mail with defined transport object
                transporter.sendMail(mailOptions, (error) => {
                    if (error) {
                        errorLogger.error(`Status: ${error.status || 500}\r\nMessage: ${error.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                        console.log(error);
                    }
                    dealLogger.info(`Message: Deal ${deal._id} cancelled\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                    req.flash('success', 'Deal cancelled successfully.');
                    return res.redirect('back');
                });
            }});
        } else {
            dealLogger.info(`Message: Deal ${deal._id} cancelled\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
            req.flash('success', 'Deal cancelled successfully.');
            return res.redirect('back');
        }
    },
    async refundDeal(req, res) {
        const deal = await Deal.findById(req.params.id);
        req.check('refundOption', 'Something went wrong. Please try again.').notEmpty().matches(/^(Money Back|New Product)$/);
        const errors = req.validationErrors();
        if (errors) {
            const seller = await User.findById(deal.product.author.id);
            const buyer = await User.findById(deal.buyer.id);
            const chat = await Chat.findById(deal.chat);
            res.render('deals/deal', { 
                deal, 
                seller, 
                buyer, 
                user: req.user, 
                chat, 
                errors,
                pageTitle: `${deal.product.name} - Deal Your Crypto`,
                pageDescription: 'Description',
                pageKeywords: 'Keywords'
            });
        } else {
            if (req.body.refundOption === 'Money Back') {
                // Find user
                const buyer = await User.findById(deal.buyer.id);
                // Refund deal
                deal.completedAt = Date.now();
                deal.refund.status = 'Fulfilled'
                deal.refund.sellerOption = req.body.refundOption;
                deal.status = 'Refunded';
                await deal.save();
                buyer.btcbalance += deal.price;
                buyer.unreadNotifications += 1;
                await buyer.save();
                await Notification.create({
                    userid: buyer._id,
                    linkTo: `/deals/${deal._id}`,
                    imgLink: deal.product.imageUrl,
                    message: `Your refund request has been accepted`
                });
                const seller = await User.findById(deal.product.author.id);
                seller.refundRequests -= 1;
                await seller.save();
                dealLogger.info(`Message: Deal ${deal._id} refunded - money back\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                if(seller.email_notifications.deal === true) {
                    ejs.renderFile(path.join(__dirname, "../views/email_templates/refundAccepted.ejs"), {
                        link: `http://${req.headers.host}/dashboard`,
                        footerlink: `http://${req.headers.host}/dashboard/notifications`,
                        name: deal.product.name,
                        subject: `Status changed for ${deal.product.name} - Deal Your Crypto`,
                    }, function (err, data) {
                        if (err) {
                            errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                            console.log(err);
                        } else {
                        const mailOptions = {
                            from: `Deal Your Crypto <noreply@dealyourcrypto.com>`, // sender address
                            to: `${seller.email}`, // list of receivers
                            subject: 'Deal Status Changed', // Subject line
                            html: data, // html body
                        };
                        // send mail with defined transport object
                        transporter.sendMail(mailOptions, (error) => {
                            if (error) {
                                errorLogger.error(`Status: ${error.status || 500}\r\nMessage: ${error.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                console.log(error);
                            }
                        });
                    }});
                }
                req.flash('success', 'Refund status updated: Deal refunded successfully.');
                return res.redirect('back');
            } else {
                deal.status = 'Refund Pending';
                deal.refund.status = 'Pending Delivery';
                deal.refund.sellerOption = req.body.refundOption;
                await deal.save();
                const seller = await User.findById(deal.product.author.id);
                seller.refundRequests -= 1;
                await seller.save();
                const buyer = await User.findById(deal.buyer.id);
                buyer.unreadNotifications += 1;
                await buyer.save();
                await Notification.create({
                    userid: deal.buyer.id,
                    linkTo: `/deals/${deal._id}`,
                    imgLink: deal.product.imageUrl,
                    message: `Your refund request has been accepted`
                });
                if(seller.email_notifications.deal === true) {
                    ejs.renderFile(path.join(__dirname, "../views/email_templates/refundAccepted.ejs"), {
                        link: `http://${req.headers.host}/dashboard`,
                        footerlink: `http://${req.headers.host}/dashboard/notifications`,
                        name: deal.product.name,
                        subject: `Status changed for ${deal.product.name} - Deal Your Crypto`,
                    }, function (err, data) {
                        if (err) {
                            errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                            console.log(err);
                        } else {
                        const mailOptions = {
                            from: `Deal Your Crypto <noreply@dealyourcrypto.com>`, // sender address
                            to: `${seller.email}`, // list of receivers
                            subject: 'Deal Status Changed', // Subject line
                            html: data, // html body
                        };
                        // send mail with defined transport object
                        transporter.sendMail(mailOptions, (error) => {
                            if (error) {
                                errorLogger.error(`Status: ${error.status || 500}\r\nMessage: ${error.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                console.log(error);
                            }
                        });
                    }});
                }
                dealLogger.info(`Message: Deal ${deal._id} refund - replacement pending delivery\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                req.flash('success', 'Refund status updated: Deal refund pending.');
                return res.redirect('back');
            }
        }
    },
    async completeRefund(req, res) {
        const deal = await Deal.findById(req.params.id);
        if (deal.refund.status == 'Pending Delivery') {
            deal.status = 'Refunded';
            deal.refund.status = 'Fulfilled';
            await deal.save();
            dealLogger.info(`Message: Deal ${deal._id} refund - refund completed\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
            const seller = await User.findById(deal.product.author.id);
            seller.nrSold += 1;
            seller.unreadNotifications += 1;
            await seller.save();
            await Notification.create({
                userid: seller._id,
                linkTo: `/deals/${deal._id}`,
                imgLink: deal.product.imageUrl,
                message: `Refund complete`
            });
            if(seller.email_notifications.deal === true) {
                ejs.renderFile(path.join(__dirname, "../views/email_templates/refundCompleted.ejs"), {
                    link: `http://${req.headers.host}/dashboard`,
                    footerlink: `http://${req.headers.host}/dashboard/notifications`,
                    name: deal.product.name,
                    subject: `Status changed for ${deal.product.name} - Deal Your Crypto`,
                }, function (err, data) {
                    if (err) {
                        errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                        console.log(err);
                    } else {
                    const mailOptions = {
                        from: `Deal Your Crypto <noreply@dealyourcrypto.com>`, // sender address
                        to: `${seller.email}`, // list of receivers
                        subject: 'Deal Status Changed', // Subject line
                        html: data, // html body
                    };
                    // send mail with defined transport object
                    transporter.sendMail(mailOptions, (error) => {
                        if (error) {
                            errorLogger.error(`Status: ${error.status || 500}\r\nMessage: ${error.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                            console.log(error);
                        }
                    });
                }});
            }
            if(buyer.email_notifications.deal === true) {
                ejs.renderFile(path.join(__dirname, "../views/email_templates/refundAccepted.ejs"), {
                    link: `http://${req.headers.host}/dashboard`,
                    footerlink: `http://${req.headers.host}/dashboard/notifications`,
                    name: deal.product.name,
                    subject: `Status changed for ${deal.product.name} - Deal Your Crypto`,
                }, function (err, data) {
                    if (err) {
                        errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                        console.log(err);
                    } else {
                    const mailOptions = {
                        from: `Deal Your Crypto <noreply@dealyourcrypto.com>`, // sender address
                        to: `${buyer.email}`, // list of receivers
                        subject: 'Deal Status Changed', // Subject line
                        html: data, // html body
                    };
                    // send mail with defined transport object
                    transporter.sendMail(mailOptions, (error) => {
                        if (error) {
                            errorLogger.error(`Status: ${error.status || 500}\r\nMessage: ${error.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                            console.log(error);
                        }
                    });
                }});
            }
            req.flash('success', 'Refund status updated: Deal refunded successfully');
            return res.redirect('back');
        } else {
            req.flash('error', 'The page you are looking for could not be found.');
            return res.redirect('/error');
        }
    },
    // Deny Refund
    async refundDeny(req, res) {
        const deal = await Deal.findById(req.params.id);
        req.check('reason', 'Something went wrong, please try again.').matches(/^(Scam attempt)$/).notEmpty();
        req.check('message', 'The message contains illegal characters.').matches(/^[a-zA-Z0-9.,?! ]+$/gm).notEmpty();
        req.check('message', 'The message needs to contain at most 500 characters').isLength({ max: 500 });
        const errors = req.validationErrors();
        if (errors) {
            const seller = await User.findById(deal.product.author.id);
            const buyer = await User.findById(deal.buyer.id);
            const chat = await Chat.findById(deal.chat);
            res.render('deals/deal', { 
                deal, 
                seller, 
                buyer, 
                user: req.user, 
                chat, 
                errors,
                pageTitle: `${deal.product.name} - Deal Your Crypto`,
                pageDescription: 'Description',
                pageKeywords: 'Keywords'
            });
        } else {
            deal.sellerReason = req.body.reason;
            deal.sellerMessage = req.body.message;
            deal.refund.status = 'Denied';
            deal.status = 'Refund denied';
            const seller = await User.findById(deal.product.author.id);
            seller.refundRequests -= 1;
            await seller.save();
            const buyer = await User.findById(deal.buyer.id);
            buyer.unreadNotifications += 1;
            await buyer.save();
            await Notification.create({
                userid: deal.buyer.id,
                linkTo: `/deals/${deal._id}`,
                imgLink: deal.product.imageUrl,
                message: `Your refund request has been declined`
            });
            if(buyer.email_notifications.deal === true) {
                ejs.renderFile(path.join(__dirname, "../views/email_templates/refundDenied.ejs"), {
                    link: `http://${req.headers.host}/deals/${deal._id}`,
                    footerlink: `http://${req.headers.host}/dashboard/notifications`,
                    name: deal.product.name,
                    subject: `Refund denied for ${deal.product.name} - Deal Your Crypto`,
                }, function (err, data) {
                    if (err) {
                        errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                        console.log(err);
                    } else {
                    const mailOptions = {
                        from: `Deal Your Crypto <noreply@dealyourcrypto.com>`, // sender address
                        to: `${buyer.email}`, // list of receivers
                        subject: 'Refund denied', // Subject line
                        html: data, // html body
                    };
                    transporter.sendMail(mailOptions, (error) => {
                        if (error) {
                            errorLogger.error(`Status: ${error.status || 500}\r\nMessage: ${error.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                            console.log(error);
                        }
                    });
                }});
            }
            dealLogger.info(`Message: Deal ${deal._id} - refund denied\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
            req.flash('success', 'Refund status updated: A moderator will take a look as soon as possible.');
            return res.redirect('back');
        }
    },
    // Send refund request message
    async refundRequest(req, res) {
        // Create the refund request
        req.check('reason', 'Something went wrong, please try again.').matches(/^(Product doesn't match|Faulty product|Product hasn't arrived)$/).notEmpty();
        req.check('message', 'The message contains illegal characters.').matches(/^[a-zA-Z0-9.,?! \r\n|\r|\n]+$/gm).notEmpty();
        req.check('message', 'The message needs to contain at most 500 characters').isLength({ max: 500 });
        req.check('option', 'Something went wrong, please try again.').matches(/^(Money Back|New Product)$/).notEmpty();
        const errors = req.validationErrors();
        if (errors) {
            // Find the deal
            const deal = await Deal.findById( req.params.id );
            const seller = await User.findById(deal.product.author.id);
            const buyer = await User.findById(deal.buyer.id);
            const chat = await Chat.findById(deal.chat);
            res.render('deals/deal', { 
                deal, 
                seller, 
                buyer, 
                user: req.user, 
                chat, 
                errors,
                pageTitle: `${deal.product.name} - Deal Your Crypto`,
                pageDescription: 'Description',
                pageKeywords: 'Keywords'
            });
        } else {
            // Find the deal
            const deal = await Deal.findById( req.params.id );
            const seller = await User.findById(deal.product.author.id);
            if (deal.status === 'Completed') {
                seller.nrSold -= 1;
            }
            deal.refund.status = 'Not fulfilled';
            deal.refund.timeOfRequest = Date.now();
            deal.refund.reason = req.body.reason;
            deal.refund.message = req.body.message;
            deal.refund.option = req.body.option;
            deal.status = 'Processing Refund';
            await deal.save();
            seller.refundRequests += 1;
            seller.unreadNotifications += 1;
            await seller.save();
            await Notification.create({
                userid: seller._id,
                linkTo: `/deals/${deal._id}`,
                imgLink: deal.product.imageUrl,
                message: `You have received a refund request`
            });
            if(seller.email_notifications.deal === true) {
                ejs.renderFile(path.join(__dirname, "../views/email_templates/refundRequest.ejs"), {
                    link: `http://${req.headers.host}/deals/${deal._id}`,
                    footerlink: `http://${req.headers.host}/dashboard/notifications`,
                    name: deal.product.name,
                    subject: `Refund requested for ${deal.product.name} - Deal Your Crypto`,
                }, function (err, data) {
                    if (err) {
                        errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                        console.log(err);
                    } else {
                    const mailOptions = {
                        from: `Deal Your Crypto <noreply@dealyourcrypto.com>`, // sender address
                        to: `${seller.email}`, // list of receivers
                        subject: 'Refund Requested', // Subject line
                        html: data, // html body
                    };
                    // send mail with defined transport object
                    transporter.sendMail(mailOptions, (error) => {
                        if (error) {
                            errorLogger.error(`Status: ${error.status || 500}\r\nMessage: ${error.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                            console.log(error);
                        }
                    });
                }});
            }
            dealLogger.info(`Message: Deal ${deal._id} - refund requested\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
            req.flash('success', 'Refund request sent.');
            return res.redirect(`/deals/${deal._id}`);
        }
    },
    async reviewProduct(req, res) {
        const deal = await Deal.findById(req.params.id);
        let product = await Product.findById(deal.product.id);
        product = await Product.findById(deal.product.id).populate('reviews').exec();
        const haveReviewed = product.reviews.filter((review) => {
            return review.author.equals(req.user._id);
        }).length;
        if(haveReviewed) {
            dealLogger.info(`Message: Deal ${deal._id} - product ${product._id} reviewed\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
            req.flash('success', 'Deal completed successfully.');
            return res.redirect(`/deals/${deal.id}`);
        } else {
            res.render('deals/deal_review', { 
                user: req.user, 
                deal: deal,
                pageTitle: `${deal.product.name} Review - Deal Your Crypto`,
                pageDescription: 'Description',
                pageKeywords: 'Keywords'
            });
        }
    },
    async createAddress(req, res) {
        const product = await Product.findById(req.params.id);
        console.log(req.body);
        let addressFrom = {
            "name":product.delivery.name,
            "street1":product.delivery.street1,
            "city":product.delivery.city,
            "state":product.delivery.state,
            "zip":product.delivery.zip,
            "country":product.delivery.country,
            "phone":product.delivery.phone,
            "email":product.delivery.email,
        };
        let addressTo = {
            "name":req.body.deliveryName,
            "street1":req.body.deliveryStreet1,
            "city":req.body.deliveryCity,
            "state":req.body.deliveryState,
            "zip":req.body.deliveryZip,
            "country":req.body.deliveryCountry,
            "phone":req.body.deliveryPhone,
            "email":req.body.deliveryEmail,
        };
        let parcel = {
            "length": product.parcel.parcel_length,
            "width": product.parcel.parcel_width,
            "height": product.parcel.parcel_height,
            "distance_unit": product.parcel.parcel_distance_unit,
            "weight": product.parcel.parcel_weight,
            "mass_unit": product.parcel.parcel_weight_unit,
        };
        let carriers = [];
        if(product.carrier.dhl_express === true) {
            let dhl = '3924c836947b4d4ca1d1a5c8bfe5b59b';
            carriers.push(dhl);
        }
        if(product.carrier.usps === true) {
            let usps = '32e1acf739a94a7f86cd168d63bc2df1';
            carriers.push(usps);
        }
        if(product.carrier.sendle === true) {
            let sendle = '89b81121d6d843228b9651748e2b96c7';
            carriers.push(sendle);
        }
        if(product.carrier.parcelforce === true) {
            let parcelforce = 'a97e0d2a493a468baf95b87f00b84de1';
            carriers.push(parcelforce);
        }
        if(product.carrier.deutsche_post === true) {
            let deutsche_post = '604de049b92846e899a03dfd48247087';
            carriers.push(deutsche_post);
        }
        if(product.carrier.couriersplease === true) {
            let couriersplease = 'a4c6ed9236a64b88b217d3b8b849db8f';
            carriers.push(couriersplease);
        }
        if(product.carrier.fastway === true) {
            let fastway = '435ad5f12e2c44a7b9163e73abe28bf6';
            carriers.push(fastway);
        }
        shippo.address.create({
            "name":req.body.deliveryName,
            "street1":req.body.deliveryStreet1,
            "city":req.body.deliveryCity,
            "state":req.body.deliveryState,
            "zip":req.body.deliveryZip,
            "country":req.body.deliveryCountry,
            "phone":req.body.deliveryPhone,
            "email":req.body.deliveryEmail,
        }, (err, address) => {
            if(err) {
                console.log('eroare la creere adresa')
                res.send(err);
            } else {
                shippo.address.validate(address.object_id, asyncErrorHandler(async (err, address1) => {
                    // asynchronously called
                    if(err) {
                        console.log('eroare la validare')
                        res.send(err);
                    } else {
                        if(address.validation_results.is_valid === false) {
                            console.log('e invalida')
                            res.send(address1);
                        } else {
                            shippo.shipment.create({
                                "address_from": addressFrom,
                                "address_to": addressTo,
                                "parcels": parcel,
                                "carrier_accounts": carriers,
                            }, (err, data) => {
                                if(err) {
                                    console.log('eroare la creere shipment')
                                    res.send(err);
                                } else {
                                    console.log(data);
                                    res.send(data);
                                }
                            })
                        }
                    }
                }));
            }
        });
    },
    async verifyAddress(req, res) {
        shippo.address.create({
            "name":req.body.deliveryName,
            "street1":req.body.deliveryStreet1,
            "city":req.body.deliveryCity,
            "state":req.body.deliveryState,
            "zip":req.body.deliveryZip,
            "country":req.body.deliveryCountry,
            "phone":req.body.deliveryPhone,
            "email":req.body.deliveryEmail,
        }, (err, address) => {
            if(err) {
                console.log('eroare la creere adresa')
                res.send(err);
            } else {
                shippo.address.validate(address.object_id, asyncErrorHandler(async (err, address1) => {
                    // asynchronously called
                    if(err) {
                        console.log('eroare la validare')
                        res.send(err);
                    } else {
                        res.send(address1);
                    }
                }));
            }
        });
    },
};
