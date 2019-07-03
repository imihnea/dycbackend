const User = require('../models/user');
const Deal = require('../models/deal');
const Notification = require('../models/notification');
const Subscription = require('../models/subscription');
const { logger, dealLogger, errorLogger } = require('../config/winston');
const moment = require('moment');
const ejs = require('ejs');
const path = require('path');
const Product = require('../models/product');
const Chat = require('../models/chat');
const Dispute = require('../models/dispute');
const nodemailer = require('nodemailer');
const request = require("request");
const shippo = require('shippo')(`${process.env.SHIPPO_SECRET}`);
const middleware = require('../middleware/index');
const Client = require('coinbase').Client;
const client = new Client({
  'apiKey': process.env.COINBASE_API_KEY,
  'apiSecret': process.env.COINBASE_API_SECRET,
});
const cloudinary = require('cloudinary');
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
const { deleteProduct } = require('../config/elasticsearch');
const { createProfit } = require('../config/profit');


const { asyncErrorHandler } = middleware; // destructuring assignment

const EMAIL_USER = process.env.EMAIL_USER || 'k4nsyiavbcbmtcxx@ethereal.email';
const EMAIL_API_KEY = process.env.EMAIL_API_KEY || 'Mx2qnJcNKM5mp4nrG3';
const EMAIL_PORT = process.env.EMAIL_PORT || '587';
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.ethereal.email';

const refundTimer = 14 * 24 * 60 * 60 * 1000;

// Deal payout fees (%)
const standardAccountFee = 10;
const premiumAccountFee = 8;
const partnerAccountFee = 8;

let transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_API_KEY,
    },
});

const cleanHTML = (unclean) => {
    return unclean
      .replace(/</g, "")
      .replace(/>/g, "");
};

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
            pageDescription: `Check out deal ${deal} on the first marketplace dedicated to cryptocurrency.`,
            pageKeywords: 'deal, personal deal, chat, deal your crypto, dealyourcrypto, crypto deal, deal crypto'
        });
    },
    async getBuyDeal(req, res) {
        // shippo.carrieraccount.list({results:10})
        // .then(function(carrieraccount){
        //     console.log(carrieraccount);
        // }); if you need to see new courier ids uncomment this
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
                    pageDescription: `Buy ${product.name} for Bitcoin on Deal Your Crypto, the first marketplace dedicated to cryptocurrency.`,
                    pageKeywords: `buy with bitcoin, ${product.name}, bitcoin, bitcoin market, crypto, cryptocurrency`,
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
                    link: `https://${req.headers.host}/deals/${deal._id}`,
                    footerlink: `https://${req.headers.host}/dashboard/notifications`,
                    name: deal.product.name,
                    subject: `Status changed for ${deal.product.name} - Deal Your Crypto`,
                }, function (err, data) {
                    if (err) {
                        errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
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
        // } else if (deal.buyer.delivery.shipping == 'Shipping') {
        //     shippo.transaction.create({
        //         "rate": deal.rate,
        //         "label_file_type": "PDF",
        //         "async": true,
        //     }, asyncErrorHandler(async (err, transaction) => {
        //         // asynchronously called
        //         if(err) {
        //             errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
        //             return res.redirect('back');
        //         }
        //         const result = JSON.stringify(transaction);
        //         if(result.status === 'ERROR') {
        //             req.flash('error', 'There\'s been an error creating the label, please try again.');
        //             return res.redirect('back');
        //         } else {
        //             deal.carrier = transaction.carrier;
        //             deal.tracking_number = transaction.tracking_number;
        //             deal.transaction = transaction.transaction;
        //             dealLogger.info(`Message: Deal ${deal._id} accepted\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
        //             await User.findByIdAndUpdate(deal.product.author.id, {$inc: { processingDeals: -1 }});
        //             await Notification.create({
        //                 userid: deal.buyer.id,
        //                 linkTo: `/deals/${deal._id}`,
        //                 imgLink: deal.product.imageUrl,
        //                 message: `Your deal request has been accepted`
        //             });
        //             const buyer = await User.findById(deal.buyer.id);
        //             buyer.unreadNotifications += 1;
        //             await buyer.save();
        //             if(buyer.email_notifications.deal === true) {
        //                 ejs.renderFile(path.join(__dirname, "../views/email_templates/acceptDeal.ejs"), {
        //                     link: result.tracking_url_provider, // Tracking url
        //                     footerlink: `https://${req.headers.host}/dashboard/notifications`,
        //                     name: deal.product.name,
        //                     subject: `Status changed for ${deal.product.name} - Deal Your Crypto`,
        //                 }, function (err, data) {
        //                     if (err) {
        //                         errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
        //                     } else {
        //                     const mailOptions = {
        //                         from: `Deal Your Crypto <noreply@dealyourcrypto.com>`, // sender address
        //                         to: `${buyer.email}`, // list of receivers
        //                         subject: 'Deal Status Changed', // Subject line
        //                         html: data, // html body
        //                     };
        //                     transporter.sendMail(mailOptions, (error) => {
        //                         if (error) {
        //                             errorLogger.error(`Status: ${error.status || 500}\r\nMessage: ${error.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
        //                         }
        //                             req.flash('success', 'Deal accepted successfully.');
        //                             return res.redirect('back');
        //                         });
        //                     }
        //                 });
        //             } else {
        //                 req.flash('success', 'Deal accepted successfully.');
        //                 return res.redirect('back');
        //             }
        //         }
        //     }));
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
                link: `https://${req.headers.host}/deals/${deal._id}`,
                footerlink: `https://${req.headers.host}/dashboard/notifications`,
                name: deal.product.name,
                subject: `Status changed for ${deal.product.name} - Deal Your Crypto`,
            }, function (err, data) {
                if (err) {
                    errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
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
        let sellerPayout;
        if (deal.buyer.delivery.shipping == 'FaceToFace') {
            deal.refundableUntil = Date.now();
            let withdrawAmount = 0;  
            await Subscription.find({userid: seller._id}, (err, res) => {
                if (err) {
                    errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message} - Deals - Pay deals - subscription\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                } else {
                    if (res.length > 0) {
                        sellerPayout = Number((deal.price - ( deal.price * premiumAccountFee * 0.01)).toFixed(8));
                        seller.btcbalance += sellerPayout;
                        // add profit to db
                        withdrawAmount = (deal.price * premiumAccountFee * 0.01).toFixed(8);
                        createProfit(seller._id, withdrawAmount, 'Income Fee');
                    } else {
                        switch(seller.accountType) {
                            case 'Standard':
                                sellerPayout = Number((deal.price - ( deal.price * standardAccountFee * 0.01)).toFixed(8));
                                seller.btcbalance += sellerPayout;
                                // add profit to db
                                withdrawAmount = (deal.price * standardAccountFee * 0.01).toFixed(8);
                                createProfit(seller._id, withdrawAmount, 'Income Fee');
                                break;
                            case 'Partner':
                                sellerPayout = Number((deal.price - ( deal.price * partnerAccountFee * 0.01)).toFixed(8));
                                seller.btcbalance += sellerPayout;
                                // add profit to db
                                withdrawAmount = (deal.price * partnerAccountFee * 0.01).toFixed(8);
                                createProfit(seller._id, withdrawAmount, 'Income Fee');
                                break;
                            default:
                                break;
                        }
                    }
                }
            });
            deal.paid = true;
        // } else if (deal.buyer.delivery.shipping == 'Shipping') {
        //     deal.refundableUntil = Date.now() + refundTimer;
        }
        deal.payout = sellerPayout;
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
            deleteProduct(product._id);
        }
        const buyer = await User.findById(deal.buyer.id);
        // Buyer email
        if(buyer.email_notifications.deal === true) {
            ejs.renderFile(path.join(__dirname, "../views/email_templates/completeDeal_buyer.ejs"), {
                link: `https://${req.headers.host}/deals/${deal._id}`,
                footerlink: `https://${req.headers.host}/dashboard/notifications`,
                name: deal.product.name,
                subject: `Status changed for ${deal.product.name} - Deal Your Crypto`,
            }, function (err, data) {
                if (err) {
                    errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);                   
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
                    }
                });
            }});
        }
        // Seller email
        if(seller.email_notifications.deal === true) {
            ejs.renderFile(path.join(__dirname, "../views/email_templates/completeDeal_seller.ejs"), {
                link: `https://${req.headers.host}/dashboard`,
                footerlink: `https://${req.headers.host}/dashboard/notifications`,
                name: deal.product.name,
                subject: `Status changed for ${deal.product.name} - Deal Your Crypto`,
            }, function (err, data) {
                if (err) {
                    errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
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
        // } else if (deal.buyer.shipping === 'Shipping') {
        //     await User.findByIdAndUpdate(deal.buyer.id, {$inc: { btcbalance: (deal.price + deal.shippingPrice) }});
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
                link: `https://${req.headers.host}/dashboard`,
                footerlink: `https://${req.headers.host}/dashboard/notifications`,
                name: deal.product.name,
                subject: `Status changed for ${deal.product.name} - Deal Your Crypto`,
            }, function (err, data) {
                if (err) {
                    errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
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
    // async refundDeal(req, res) {
    //     const deal = await Deal.findById(req.params.id);
    //     if (deal.buyer.delivery.shipping !== 'Shipping') {
    //         req.flash('error', 'We do not refund seller handled deals. You must discuss it with them.');
    //         return res.redirect('back');
    //     }
    //     req.check('refundOption', 'Something went wrong. Please try again.').notEmpty().matches(/^(Money Back|New Product)$/);
    //     const errors = req.validationErrors();
    //     if (errors) {
    //         const seller = await User.findById(deal.product.author.id);
    //         const buyer = await User.findById(deal.buyer.id);
    //         const chat = await Chat.findById(deal.chat);
    //         res.render('deals/deal', { 
    //             deal, 
    //             seller, 
    //             buyer, 
    //             user: req.user, 
    //             chat, 
    //             errors,
    //             pageTitle: `${deal.product.name} - Deal Your Crypto`,
    //             pageDescription: `Get the best deal for ${product.name} on Deal Your Crypto, the first marketplace dedicated to cryptocurrency.`,
    //             pageKeywords: `buy with bitcoin, ${product.name}, best deal, bitcoin, bitcoin market, crypto, cryptocurrency`,
    //         });
    //     } else {
    //         if (req.body.refundOption === 'Money Back') {
    //             // Find user
    //             // const buyer = await User.findById(deal.buyer.id);
    //             // Refund deal
    //             deal.completedAt = Date.now();
    //             deal.refund.status = 'Pending Delivery'
    //             deal.refund.sellerOption = req.body.refundOption;
    //             deal.status = 'Refund Pending';
    //             await deal.save();
    //             // buyer.btcbalance += deal.price;
    //             // buyer.unreadNotifications += 1;
    //             // await buyer.save();
    //             await Notification.create({
    //                 userid: deal.buyer._id,
    //                 linkTo: `/deals/${deal._id}`,
    //                 imgLink: deal.product.imageUrl,
    //                 message: `Your refund request has been accepted`
    //             });
    //             const seller = await User.findById(deal.product.author.id);
    //             seller.refundRequests -= 1;
    //             await seller.save();
    //             dealLogger.info(`Message: Deal ${deal._id} refund accepted\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
    //             if(seller.email_notifications.deal === true) {
    //                 ejs.renderFile(path.join(__dirname, "../views/email_templates/refundAccepted.ejs"), {
    //                     link: `https://${req.headers.host}/dashboard`,
    //                     footerlink: `https://${req.headers.host}/dashboard/notifications`,
    //                     name: deal.product.name,
    //                     subject: `Status changed for ${deal.product.name} - Deal Your Crypto`,
    //                 }, function (err, data) {
    //                     if (err) {
    //                         errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
    //                     } else {
    //                     const mailOptions = {
    //                         from: `Deal Your Crypto <noreply@dealyourcrypto.com>`, // sender address
    //                         to: `${seller.email}`, // list of receivers
    //                         subject: 'Deal Status Changed', // Subject line
    //                         html: data, // html body
    //                     };
    //                     // send mail with defined transport object
    //                     transporter.sendMail(mailOptions, (error) => {
    //                         if (error) {
    //                             errorLogger.error(`Status: ${error.status || 500}\r\nMessage: ${error.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
    //                         }
    //                     });
    //                 }});
    //             }
    //             req.flash('success', 'Refund status updated: Deal refunded successfully.');
    //             return res.redirect('back');
    //         }
    //     }
    // },
    // async completeRefund(req, res) {
    //     const deal = await Deal.findById(req.params.id);
    //     if (deal.buyer.delivery.shipping !== 'Shipping') {
    //         req.flash('error', 'We do not refund seller handled deals. You must talk to them about it.');
    //         return res.redirect('back');
    //     }
    //     if (deal.refund.status == 'Pending Delivery') {
    //         deal.status = 'Refunded';
    //         deal.refund.status = 'Fulfilled';
    //         await deal.save();
    //         dealLogger.info(`Message: Deal ${deal._id} refund - refund completed\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
    //         const seller = await User.findById(deal.product.author.id);
    //         seller.nrSold += 1;
    //         seller.unreadNotifications += 1;
    //         await seller.save();
    //         const buyer = await User.findById(deal.buyer.id);
    //         buyer.btcbalance += deal.price;
    //         await buyer.save();
    //         await Notification.create({
    //             userid: buyer._id,
    //             linkTo: `/deals/${deal._id}`,
    //             imgLink: deal.product.imageUrl,
    //             message: `Refund complete`
    //         });
    //         const product = await Product.findById(deal.product.id);
    //         if (!product.repeatable) {
    //             product.available = 'Closed';
    //             await product.save();
    //             deleteProduct(product._id);
    //         }
    //         // if(seller.email_notifications.deal === true) {
    //         //     ejs.renderFile(path.join(__dirname, "../views/email_templates/refundCompleted.ejs"), {
    //         //         link: `https://${req.headers.host}/dashboard`,
    //         //         footerlink: `https://${req.headers.host}/dashboard/notifications`,
    //         //         name: deal.product.name,
    //         //         subject: `Status changed for ${deal.product.name} - Deal Your Crypto`,
    //         //     }, function (err, data) {
    //         //         if (err) {
    //         //             errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
    //         //         } else {
    //         //         const mailOptions = {
    //         //             from: `Deal Your Crypto <noreply@dealyourcrypto.com>`, // sender address
    //         //             to: `${seller.email}`, // list of receivers
    //         //             subject: 'Deal Status Changed', // Subject line
    //         //             html: data, // html body
    //         //         };
    //         //         // send mail with defined transport object
    //         //         transporter.sendMail(mailOptions, (error) => {
    //         //             if (error) {
    //         //                 errorLogger.error(`Status: ${error.status || 500}\r\nMessage: ${error.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
    //         //             }
    //         //         });
    //         //     }});
    //         // }
    //         if(buyer.email_notifications.deal === true) {
    //             ejs.renderFile(path.join(__dirname, "../views/email_templates/refundCompleted.ejs"), {
    //                 link: `https://${req.headers.host}/dashboard`,
    //                 footerlink: `https://${req.headers.host}/dashboard/notifications`,
    //                 name: deal.product.name,
    //                 subject: `Status changed for ${deal.product.name} - Deal Your Crypto`,
    //             }, function (err, data) {
    //                 if (err) {
    //                     errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
    //                 } else {
    //                 const mailOptions = {
    //                     from: `Deal Your Crypto <noreply@dealyourcrypto.com>`, // sender address
    //                     to: `${buyer.email}`, // list of receivers
    //                     subject: 'Deal Status Changed', // Subject line
    //                     html: data, // html body
    //                 };
    //                 // send mail with defined transport object
    //                 transporter.sendMail(mailOptions, (error) => {
    //                     if (error) {
    //                         errorLogger.error(`Status: ${error.status || 500}\r\nMessage: ${error.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
    //                     }
    //                 });
    //             }});
    //         }
    //         req.flash('success', 'Refund status updated: Deal refunded successfully');
    //         return res.redirect('back');
    //     } else {
    //         req.flash('error', 'The page you are looking for could not be found.');
    //         return res.redirect('/error');
    //     }
    // },
    // // Deny Refund
    // async refundDeny(req, res) {
    //     const deal = await Deal.findById(req.params.id);
    //     req.check('reason', 'Something went wrong, please try again.').matches(/^(Scam attempt|Other|Fraudulent request)$/).notEmpty();
    //     req.check('message', 'The message cannot be empty.').notEmpty();
    //     req.check('message', 'The message needs to contain at most 500 characters').isLength({ max: 500 });
    //     const errors = req.validationErrors();
    //     if (errors) {
    //         const seller = await User.findById(deal.product.author.id);
    //         const buyer = await User.findById(deal.buyer.id);
    //         const chat = await Chat.findById(deal.chat);
    //         res.render('deals/deal', { 
    //             deal, 
    //             seller, 
    //             buyer, 
    //             user: req.user, 
    //             chat, 
    //             errors,
    //             pageTitle: `${deal.product.name} - Deal Your Crypto`,
    //             pageDescription: `Get the best deal for ${product.name} on Deal Your Crypto, the first marketplace dedicated to cryptocurrency.`,
    //             pageKeywords: `buy with bitcoin, ${product.name}, best deal, bitcoin, bitcoin market, crypto, cryptocurrency`,
    //         });
    //     } else {
    //         await Dispute.create({
    //             deal: deal._id,
    //             chat: deal.chat,
    //             product: {
    //                 id: deal.product.id,
    //                 name: deal.product.name,
    //                 imageUrl: deal.product.imageUrl,
    //                 price: deal.product.price
    //             },
    //             buyer: {
    //                 id: deal.buyer.id,
    //                 name: deal.buyer.name
    //             },
    //             seller: {
    //                 id: deal.product.author.id,
    //                 name: deal.product.author.name,
    //                 username: deal.product.author.username
    //             },
    //             refund: {
    //                 reason: deal.refund.reason,
    //                 message: deal.refund.message,
    //                 images: deal.refund.images,
    //                 timeOfRequest: deal.refund.timeOfRequest,
    //                 sellerReason: req.body.reason,
    //                 sellerMessage: req.body.message
    //             },
    //             price: deal.price,
    //             shippingPrice: deal.shippingPrice,
    //             rate: deal.rate
    //         });
    //         deal.sellerReason = req.body.reason;
    //         deal.sellerMessage = req.body.message;
    //         deal.status = 'Processing dispute';
    //         const seller = await User.findById(deal.product.author.id);
    //         seller.refundRequests -= 1;
    //         await seller.save();
    //         const buyer = await User.findById(deal.buyer.id);
    //         buyer.unreadNotifications += 1;
    //         await buyer.save();
    //         await Notification.create({
    //             userid: deal.buyer.id,
    //             linkTo: `/deals/${deal._id}`,
    //             imgLink: deal.product.imageUrl,
    //             message: `Your refund request has been declined, a dispute has been created. A member of the staff will resolve it as soon as possible.`
    //         });
    //         // if(buyer.email_notifications.deal === true) {
    //         //     ejs.renderFile(path.join(__dirname, "../views/email_templates/refundDenied.ejs"), {
    //         //         link: `https://${req.headers.host}/deals/${deal._id}`,
    //         //         footerlink: `https://${req.headers.host}/dashboard/notifications`,
    //         //         name: deal.product.name,
    //         //         subject: `Refund denied for ${deal.product.name} - Deal Your Crypto`,
    //         //     }, function (err, data) {
    //         //         if (err) {
    //         //             errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
    //         //         } else {
    //         //         const mailOptions = {
    //         //             from: `Deal Your Crypto <noreply@dealyourcrypto.com>`, // sender address
    //         //             to: `${buyer.email}`, // list of receivers
    //         //             subject: 'Refund denied', // Subject line
    //         //             html: data, // html body
    //         //         };
    //         //         transporter.sendMail(mailOptions, (error) => {
    //         //             if (error) {
    //         //                 errorLogger.error(`Status: ${error.status || 500}\r\nMessage: ${error.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
    //         //             }
    //         //         });
    //         //     }});
    //         // }
    //         dealLogger.info(`Message: Deal ${deal._id} - refund denied\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
    //         req.flash('success', 'Refund status updated: A moderator will take a look as soon as possible.');
    //         return res.redirect('back');
    //     }
    // },
    // // Send refund request message
    // async refundRequest(req, res) {
    //     const deal = await Deal.findById( req.params.id );
    //     if (deal.buyer.delivery.shipping !== 'Shipping') {
    //         req.flash('error', 'We do not refund seller handled deals. You must talk to them about it.');
    //         return res.redirect('back');
    //     }
    //     // Create the refund request
    //     if (req.files.length === 0){
    //         req.flash('error', 'You need to upload at least one image.');
    //         return res.redirect('back');
    //     } else {
    //         req.check('reason', 'Something went wrong, please try again.').matches(/^(Product doesn't match|Faulty product|Other)$/).notEmpty();
    //         req.check('message', 'The message needs to contain at least 10 and at most 500 characters').isLength({ min: 10, max: 500 });
    //         req.check('option', 'Something went wrong, please try again.').matches(/^(Money Back|New Product)$/).notEmpty();
    //         const errors = req.validationErrors();
    //         if (errors) {
    //             const seller = await User.findById(deal.product.author.id);
    //             const buyer = await User.findById(deal.buyer.id);
    //             const chat = await Chat.findById(deal.chat);
    //             res.render('deals/deal', { 
    //                 deal, 
    //                 seller, 
    //                 buyer, 
    //                 user: req.user, 
    //                 chat, 
    //                 errors,
    //                 pageTitle: `${deal.product.name} - Deal Your Crypto`,
    //                 pageDescription: `Get the best deal for ${product.name} on Deal Your Crypto, the first marketplace dedicated to cryptocurrency.`,
    //                 pageKeywords: `buy with bitcoin, ${product.name}, best deal, bitcoin, bitcoin market, crypto, cryptocurrency`,
    //             });
    //         } else {                
    //             await cloudinary.v2.uploader.upload(file.path, {
    //               moderation: "aws_rek:suggestive:ignore",
    //             }, (err, result) => {
    //               if(err) {
    //                 console.log(err);
    //               } else if (result.moderation[0].status === 'rejected') {
    //                   deal.refund.images.push({
    //                     url: 'https://res.cloudinary.com/deal-your-crypto/image/upload/v1561981652/nudity_etvikx.png',
    //                     public_id: result.public_id,
    //                   });
    //               } else {
    //                 deal.refund.images.push({
    //                   url: result.secure_url,
    //                   public_id: result.public_id,
    //                 });
    //               }
    //             });
    //             const seller = await User.findById(deal.product.author.id);
    //             if (deal.status === 'Completed') {
    //                 seller.nrSold -= 1;
    //             }
    //             deal.refund.status = 'Not fulfilled';
    //             deal.refund.timeOfRequest = Date.now();
    //             deal.refund.reason = req.body.reason;
    //             deal.refund.message = cleanHTML(req.body.message);
    //             deal.refund.option = req.body.option;
    //             deal.status = 'Processing Refund';
    //             await deal.save();
    //             seller.refundRequests += 1;
    //             seller.unreadNotifications += 1;
    //             await seller.save();
    //             await Notification.create({
    //                 userid: seller._id,
    //                 linkTo: `/deals/${deal._id}`,
    //                 imgLink: deal.product.imageUrl,
    //                 message: `You have received a refund request`
    //             });
    //             if(seller.email_notifications.deal === true) {
    //                 ejs.renderFile(path.join(__dirname, "../views/email_templates/refundRequest.ejs"), {
    //                     link: `https://${req.headers.host}/deals/${deal._id}`,
    //                     footerlink: `https://${req.headers.host}/dashboard/notifications`,
    //                     name: deal.product.name,
    //                     subject: `Refund requested for ${deal.product.name} - Deal Your Crypto`,
    //                 }, function (err, data) {
    //                     if (err) {
    //                         errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
    //                     } else {
    //                     const mailOptions = {
    //                         from: `Deal Your Crypto <noreply@dealyourcrypto.com>`, // sender address
    //                         to: `${seller.email}`, // list of receivers
    //                         subject: 'Refund Requested', // Subject line
    //                         html: data, // html body
    //                     };
    //                     // send mail with defined transport object
    //                     transporter.sendMail(mailOptions, (error) => {
    //                         if (error) {
    //                             errorLogger.error(`Status: ${error.status || 500}\r\nMessage: ${error.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
    //                         }
    //                     });
    //                 }});
    //             }
    //             dealLogger.info(`Message: Deal ${deal._id} - refund requested\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
    //             req.flash('success', 'Refund request sent.');
    //             return res.redirect(`/deals/${deal._id}`);
    //         }
    //     }
    // },
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
                pageDescription: `Leave a review for ${product.name} on Deal Your Crypto, the first marketplace dedicated to cryptocurrency.`,
                pageKeywords: `buy with bitcoin, ${product.name}, review, bitcoin, bitcoin market, crypto, cryptocurrency`,
            });
        }
    },
    // async createAddress(req, res) {
    //     const product = await Product.findById(req.params.id);
    //     let addressFrom = {
    //         "name":product.delivery.name,
    //         "street1":product.delivery.street1,
    //         "city":product.delivery.city,
    //         "state":product.delivery.state,
    //         "zip":product.delivery.zip,
    //         "country":product.delivery.country,
    //         "phone":product.delivery.phone,
    //         "email":product.delivery.email,
    //     };
    //     let addressTo = {
    //         "name":req.body.deliveryName,
    //         "street1":req.body.deliveryStreet1,
    //         "city":req.body.deliveryCity,
    //         "state":req.body.deliveryState,
    //         "zip":req.body.deliveryZip,
    //         "country":req.body.deliveryCountry,
    //         "phone":req.body.deliveryPhone,
    //         "email":req.body.deliveryEmail,
    //     };
    //     let parcel = {
    //         "length": product.parcel.parcel_length,
    //         "width": product.parcel.parcel_width,
    //         "height": product.parcel.parcel_height,
    //         "distance_unit": product.parcel.parcel_distance_unit,
    //         "weight": product.parcel.parcel_weight,
    //         "mass_unit": product.parcel.parcel_weight_unit,
    //     };
    //     let carriers = [];
    //     if(product.carrier.dhl_express === true) {
    //         let dhl = '3eed752394b1430c86da206392a6b409';
    //         carriers.push(dhl);
    //     }
    //     if(product.carrier.usps === true) {
    //         let usps = 'e9ce10a08a1440f1a6e0c7d9450ecd0c';
    //         carriers.push(usps);
    //     }
    //     if(product.carrier.sendle === true) {
    //         let sendle = '6405c45a77f24c7197fa8db84ab58d75';
    //         carriers.push(sendle);
    //     }
    //     if(product.carrier.parcelforce === true) {
    //         let parcelforce = '6d584261be87429fb125204a0a469458';
    //         carriers.push(parcelforce);
    //     }
    //     if(product.carrier.deutsche_post === true) {
    //         let deutsche_post = 'e4ad18f46aff495f999998a8b30a8619';
    //         carriers.push(deutsche_post);
    //     }
    //     if(product.carrier.couriersplease === true) {
    //         let couriersplease = '3ed3f7828a444079aa917388bdac78dd';
    //         carriers.push(couriersplease);
    //     }
    //     if(product.carrier.fastway === true) {
    //         let fastway = 'edcbb2595aa24b23bd87a88c6509ad31';
    //         carriers.push(fastway);
    //     }
    //     shippo.address.create({
    //         "name":req.body.deliveryName,
    //         "street1":req.body.deliveryStreet1,
    //         "city":req.body.deliveryCity,
    //         "state":req.body.deliveryState,
    //         "zip":req.body.deliveryZip,
    //         "country":req.body.deliveryCountry,
    //         "phone":req.body.deliveryPhone,
    //         "email":req.body.deliveryEmail,
    //     }, (err, address) => {
    //         if(err) {
    //             res.send(err);
    //         } else {
    //             shippo.address.validate(address.object_id, asyncErrorHandler(async (err, address1) => {
    //                 // asynchronously called
    //                 if(err) {
    //                     res.send(err);
    //                 } else {
    //                     if(address.validation_results.is_valid === false) {
    //                         res.send(address1);
    //                     } else {
    //                         shippo.shipment.create({
    //                             "address_from": addressFrom,
    //                             "address_to": addressTo,
    //                             "parcels": parcel,
    //                             "carrier_accounts": carriers,
    //                         }, (err, data) => {
    //                             if(err) {
    //                                 res.send(err);
    //                             } else {
    //                                 res.send(data);
    //                             }
    //                         })
    //                     }
    //                 }
    //             }));
    //         }
    //     });
    // },
    // async verifyAddress(req, res) {
    //     shippo.address.create({
    //         "name":req.body.deliveryName,
    //         "street1":req.body.deliveryStreet1,
    //         "city":req.body.deliveryCity,
    //         "state":req.body.deliveryState,
    //         "zip":req.body.deliveryZip,
    //         "country":req.body.deliveryCountry,
    //         "phone":req.body.deliveryPhone,
    //         "email":req.body.deliveryEmail,
    //     }, (err, address) => {
    //         if(err) {
    //             res.send(err);
    //         } else {
    //             shippo.address.validate(address.object_id, asyncErrorHandler(async (err, address1) => {
    //                 // asynchronously called
    //                 if(err) {
    //                     res.send(err);
    //                 } else {
    //                     res.send(address1);
    //                 }
    //             }));
    //         }
    //     });
    // },
    async updateProof(req, res) {
        let deal = await Deal.findById(req.params.id);
        if (req.file) {
            const oldProof = deal.proof.imageid;
            try{
                await cloudinary.v2.uploader.upload(req.file.path, 
                {
                    moderation: "aws_rek:suggestive:ignore",
                    // transformation: [
                    // {quality: "jpegmini:1", sign_url: true},
                    // {width: "auto", dpr: "auto"}
                    // ]
                }, (err, result) => {
                    if(err) {
                    errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                    } else if (result.moderation[0].status === 'rejected') {
                        deal.proof.image = 'https://res.cloudinary.com/deal-your-crypto/image/upload/v1561632802/nudity_hkebe6.png';
                        deal.proof.imageid = result.public_id;
                    } else {
                        deal.proof.image = result.secure_url;
                        deal.proof.imageid = result.public_id;
                    }
                });
            } catch (error) {
                req.flash('error', error.message);
                return res.redirect('back');
            }
            if (oldProof) {
                await cloudinary.v2.uploader.destroy(oldProof, (err) => {
                    if (err) {
                        errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                    }
                });
            }
        }
        if (req.body.textProof) {
            req.check('textProof', 'The text contains illegal characters.').matches(/^[a-zA-Z0-9 `!@#$%^&*()_\-=+,<>./"?;:'\][{}\\|\r\n]+$/g).notEmpty();
            req.check('textProof', 'The text must contain at most 500 characters').isLength({ max: 500 });
            const errors = req.validationErrors();
            if (errors) {
                req.flash('The text contains illegal characters.');
                return res.redirect('back');
            }
            deal.proof.text = cleanHTML(req.body.textProof);
        }
        deal.proof.lastUpdated = Date.now();
        await deal.save();
        await Notification.create({
            userid: deal.buyer.id,
            linkTo: `/deals/${deal._id}`,
            imgLink: deal.product.imageUrl,
            message: `Proof of delivery has been updated`
        });
        req.flash('success', 'Proof updated successfully');
        return res.redirect('back');
    },
    // async updateRefundProof(req, res) {
    //     let deal = await Deal.findById(req.params.id);
    //     if (req.file) {
    //         const oldProof = deal.refund.proof.imageid;
    //         try{
    //             await cloudinary.v2.uploader.upload(req.file.path, 
    //             {
    //                 moderation: "aws_rek:suggestive:ignore",
    //                 // transformation: [
    //                 // {quality: "jpegmini:1", sign_url: true},
    //                 // {width: "auto", dpr: "auto"}
    //                 // ]
    //             }, (err, result) => {
    //                 if(err) {
    //                 errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
    //                 } else if (result.moderation[0].status === 'rejected') {
    //                     deal.refund.proof.image = 'https://res.cloudinary.com/deal-your-crypto/image/upload/v1561632802/nudity_hkebe6.png';
    //                     deal.refund.proof.imageid = result.public_id;
    //                 } else {
    //                     deal.refund.proof.image = result.secure_url;
    //                     deal.refund.proof.imageid = result.public_id;
    //                 }
    //             });
    //         } catch (error) {
    //             req.flash('error', error.message);
    //             return res.redirect('back');
    //         }
    //         if (oldProof) {
    //             await cloudinary.v2.uploader.destroy(oldProof, (err) => {
    //                 if (err) {
    //                     errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
    //                 }
    //             });
    //         }
    //     }
    //     if (req.body.textProof) {
    //         req.check('textProof', 'The text contains illegal characters.').matches(/^[a-zA-Z0-9 `!@#$%^&*()_\-=+,<>./"?;:'\][{}\\|\r\n]+$/g).notEmpty();
    //         req.check('textProof', 'The text must contain at most 500 characters').isLength({ max: 500 });
    //         const errors = req.validationErrors();
    //         if (errors) {
    //             req.flash('The text contains illegal characters.');
    //             return res.redirect('back');
    //         }
    //         deal.refund.proof.text = cleanHTML(req.body.textProof);
    //     }
    //     deal.refund.proof.lastUpdated = Date.now();
    //     await deal.save();
    //     await Notification.create({
    //         userid: deal.buyer._id,
    //         linkTo: `/deals/${deal._id}`,
    //         imgLink: deal.product.imageUrl,
    //         message: `Proof of delivery has been updated`
    //     });
    //     req.flash('success', 'Proof updated successfully');
    //     return res.redirect('back');
    // },
    async destroyDeal(req, res) {
        const deal = await Deal.findById(req.params.id);
        if (!['Completed', 'Refunded', 'Declined', 'Cancelled', 'Refund denied'].includes(deal.status)) {
            req.flash('error', 'You cannot delete the deal while it is ongoing');
            return res.redirect('/dashboard');
        } else {
            if (deal.refundableUntil) {
                if (deal.refundableUntil > Date.now()) {
                    req.flash('error', 'You cannot delete the deal while it can still be refunded');
                    return res.redirect('/dashboard');
                } else {
                    await Chat.deleteOne({_id: deal.chat});
                    if (deal.proof.imageid) {
                        await cloudinary.v2.uploader.destroy(deal.proof.imageid, (err) => {
                            if (err) {
                                errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                            }
                        });
                    }
                    await deal.remove();
                    req.flash('success', 'Deal deleted successfully');
                    return res.redirect('/dashboard');
                }
            } else {
                await Chat.deleteOne({_id: deal.chat});
                if (deal.proof.imageid) {
                    await cloudinary.v2.uploader.destroy(deal.proof.imageid, (err) => {
                        if (err) {
                            errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                        }
                    });
                }
                await deal.remove();
                req.flash('success', 'Deal deleted successfully');
                return res.redirect('/dashboard');
            }
        }
    }   
};
