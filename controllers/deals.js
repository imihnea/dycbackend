const User = require('../models/user');
const Deal = require('../models/deal');
const Product = require('../models/product');
const Chat = require('../models/chat');
const nodemailer = require('nodemailer');
const EMAIL_USER = process.env.EMAIL_USER || 'k4nsyiavbcbmtcxx@ethereal.email';
const EMAIL_API_KEY = process.env.EMAIL_API_KEY || 'Mx2qnJcNKM5mp4nrG3';
const EMAIL_PORT = process.env.EMAIL_PORT || '587';
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.ethereal.email';

const refundTimer = 60000;

// Deal payout fees (%)
const standardAccountFee = 15;
const premiumAccountFee = 10;
const partnerAccountFee = 10;

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
    async acceptDeal(req, res) {
        const deal = await Deal.findById(req.params.id);
        deal.status = 'Pending Delivery';
        await deal.save();
        const buyer = await User.findById(deal.buyer.id);
        const output = `
        <h1>Deal Status Changed: Pending Delivery</h1>
        <p>${req.user.full_name} has accepted your deal request for ${deal.product.name}.</p>
        <p>The product is being delivered. The deal cannot be cancelled anymore and the shipping address cannot be changed.</p>
        <p>Click <a href="http://${req.headers.host}/deals/${deal._id}">here</a> to see the deal.</p>
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
                to: `${buyer.email}`, // list of receivers
                subject: 'Deal Status Changed', // Subject line
                html: output, // html body
            };
            // send mail with defined transport object
            transporter.sendMail(mailOptions, (error) => {
                if (error) {
                console.log(error);
                }
            });
        });
        req.flash('success', 'Deal accepted successfully.');
        res.redirect('back');
    },
    async declineDeal(req, res) {
        const deal = await Deal.findById(req.params.id);
        const buyer = await User.findById(deal.buyer.id);
        deal.status = 'Declined';
        await deal.save();
        buyer.btcbalance += deal.price;
        await buyer.save();
        const output = `
        <h1>Deal Status Changed: Declined</h1>
        <p>${req.user.full_name} has declined your deal request for ${product.name}.</p>
        <p>Your currency has been returned to your account.</p>
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
                to: `${buyer.email}`, // list of receivers
                subject: 'Deal Status Changed', // Subject line
                html: output, // html body
            };
            // send mail with defined transport object
            transporter.sendMail(mailOptions, (error) => {
                if (error) {
                console.log(error);
                }
            });
        });
        req.flash('success', 'Deal denied successfully.');
        res.redirect('back');
    },
    async completeDeal(req, res) {
        const deal = await Deal.findById(req.params.id);
        const product = await Product.findById(deal.product.id);
        const seller = await User.findById(deal.product.author.id);
        deal.completedAt = Date.now();
        deal.refundableUntil = Date.now() + refundTimer;
        deal.status = 'Completed';
        await deal.save();
        seller.nrSold += 1;
        await seller.save();
        if (!product.repeatable) {
            product.available = 'Closed';
            await product.save();
            product.unIndex((err) => {
                if (err) {
                    console.log('Error while unindexing document.');
                    console.log(err);
                } else {
                    console.log('Document unindexed successfully.');
                }
            });
        }
        const buyer = await User.findById(deal.buyer.id);
        // Buyer email
        let output = `
        <h1>Deal Status Changed: Completed</h1>
        <p>Deal: ${product.name}</p>
        <p>Price: ${deal.price}</p>
        <p>Status: Completed</p>
        <p>The refund term is 14 days. Access this <a href="${req.headers.host}/deals/${deal._id}">link</a> to request a refund.</p>
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
                to: `${buyer.email}`, // list of receivers
                subject: 'Deal Status Changed', // Subject line
                html: output, // html body
            };
            // send mail with defined transport object
            transporter.sendMail(mailOptions, (error) => {
                if (error) {
                console.log(error);
                }
            });
        });
        // Seller email
        output = `
        <h1>Deal Status Changed: Completed</h1>
        <p>Deal: ${product.name}</p>
        <p>Price: ${deal.price}</p>
        <p>Status: Completed</p>
        <p>The refund term is 14 days. The currency will be available for withdrawal once the refund term ends.</p>
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
                to: `${seller.email}`, // list of receivers
                subject: 'Deal Status Changed', // Subject line
                html: output, // html body
            };
            // send mail with defined transport object
            transporter.sendMail(mailOptions, (error) => {
                if (error) {
                console.log(error);
                }
            });
        });
        res.redirect(`/deals/${deal._id}/review`);
    },
    async cancelDeal(req, res) {
        const deal = await Deal.findById(req.params.id);
        const buyer = await User.findById(deal.buyer.id);
        deal.status = 'Cancelled';
        deal.completedAt = Date.now();
        await deal.save();
        buyer.btcbalance += deal.price;
        await buyer.save();
        // Seller email
        const seller = await User.findById(deal.product.author.id);
        const output = `
        <h1>Deal Status Changed: Cancelled</h1>
        <p>Deal: ${product.name}</p>
        <p>Price: ${deal.price}</p>
        <p>Status: Cancelled</p>
        <p>The buyer has cancelled the deal.</p>
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
                to: `${seller.email}`, // list of receivers
                subject: 'Deal Status Changed', // Subject line
                html: output, // html body
            };
            // send mail with defined transport object
            transporter.sendMail(mailOptions, (error) => {
                if (error) {
                console.log(error);
                }
            });
        });
        req.flash('success', 'Deal cancelled successfully.');
        res.redirect('back');
    },
    async refundDeal(req, res) {
        const deal = await Deal.findById(req.params.id);
        req.check('refundOption', 'Something went wrong. Please try again.').matches(/^(Money Back|New Object)$/).notEmpty();
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
                await buyer.save();
                req.flash('success', 'Refund status updated: Deal refunded successfully.');
                res.redirect('back');
            } else {
                deal.status = 'Refunded';
                deal.refund.status = 'Pending Delivery';
                deal.refund.sellerOption = req.body.refundOption;
                await deal.save();
                req.flash('success', 'Refund status updated: Deal refund pending.');
                res.redirect('back');
            }
        }
    },
    // Deny Refund
    async refundDeny(req, res) {
        const deal = await Deal.findById(req.params.id);
        req.check('reason', 'Something went wrong, please try again.').matches(/^(Scam attempt)$/).notEmpty();
        req.check('message', 'The message contains illegal characters.').matches(/^[a-zA-Z0-9.,?! ]+$/gm).notEmpty();
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
            const buyer = await User.findById(deal.buyer.id);
            const output = `
            <h1>Deal Status Changed: Refund Denied</h1>
            <p>Deal: ${product.name}</p>
            <p>Price: ${deal.price}</p>
            <p>Status: Refund Denied</p>
            <p>A moderator will check if the refund was denied for a good reason.</p>
            <p>Click <a href="http://${req.headers.host}/deals/${deal._id}">here</a> to view the deal.</p>
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
                    to: `${buyer.email}`, // list of receivers
                    subject: 'Deal Status Changed', // Subject line
                    html: output, // html body
                };
                // send mail with defined transport object
                transporter.sendMail(mailOptions, (error) => {
                    if (error) {
                    console.log(error);
                    }
                });
            });
            req.flash('success', 'Refund status updated: A moderator will take a look as soon as possible.');
            res.redirect('back');
        }
    },
    // Send refund request message
    async refundRequest(req, res) {
        // Find the deal
        const deal = await Deal.findById( req.params.id );
        // Create the refund request
        req.check('reason', 'Something went wrong, please try again.').matches(/^(Product doesn't match|Faulty product|Product hasn't arrived)$/).notEmpty();
        req.check('message', 'The message contains illegal characters.').matches(/^[a-zA-Z0-9.,?! ]+$/gm).notEmpty();
        req.check('option', 'Something went wrong, please try again.').matches(/^(Money Back|New Object)$/).notEmpty();
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
            deal.refund.status = 'Not fulfilled';
            deal.refund.timeOfRequest = Date.now();
            deal.refund.reason = req.body.reason;
            deal.refund.message = req.body.message;
            deal.refund.option = req.body.option;
            deal.status = 'Processing Refund';
            await deal.save();
            const seller = await User.findById(deal.product.author.id);
            const output = `
            <h1>Deal Status Changed: Refund Requested</h1>
            <p>Deal: ${deal.product.name}</p>
            <p>Price: ${deal.price}</p>
            <p>Status: Refund Requested</p>
            <p>Click <a href="http://${req.headers.host}/deals/${deal._id}">here</a> to view the full details of the request.</p>
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
                    to: `${seller.email}`, // list of receivers
                    subject: 'Deal Status Changed', // Subject line
                    html: output, // html body
                };
                // send mail with defined transport object
                transporter.sendMail(mailOptions, (error) => {
                    if (error) {
                    console.log(error);
                    }
                });
            });
            req.flash('success', 'Refund request sent.');
            res.redirect(`/deals/${deal._id}`);
        }
    },
    async reviewProduct(req, res) {
        const deal = await Deal.findById(req.params.id);
        // find the product by its id and populate reviews
        let product = await Product.findById(deal.product.id);
        if (product.repeatable) {
            product = await Product.findById(deal.product.id).populate('reviews').exec();
            // filter product.reviews to see if any of the reviews were created by logged in user
            // .filter() returns a new array, so use .length to see if array is empty or not
            let haveReviewed = product.reviews.filter(review => {
                return review.author.equals(req.user._id);
            }).length;
            // check if haveReviewed is 0 (false) or 1 (true)
            if(haveReviewed) {
                // redirect back to deal
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
        } else {
            // find the user by its id and populate reviews
            let user = await User.findById(product.author.id).populate('reviews').exec();
            // filter user.reviews to see if any of the reviews were created by logged in user
            // .filter() returns a new array, so use .length to see if array is empty or not
            let haveReviewed = user.reviews.filter(review => {
                return review.author.equals(req.user._id);
            }).length;
            // check if haveReviewed is 0 (false) or 1 (true)
            if(haveReviewed) {
                // flash an error and redirect back to user
                req.flash('success', 'Deal completed successfully.');
                return res.redirect(`/deals/${deal.id}`);
            } else {
                res.render('deals/deal_review_user', { 
                    user: req.user, 
                    seller: user, 
                    deal,
                    pageTitle: `${deal.product.name} - Deal Your Crypto`,
                    pageDescription: 'Description',
                    pageKeywords: 'Keywords'
                });
            }
        }
    },   
};

// Pay deals which cannot be refunded anymore
setInterval(async () => {
    // get deals that need to be paid
    let deal = await Deal.find({"status": "Completed", "paid": "false", "refundableUntil": { $lt: Date.now() }});
    deal.forEach((item) => {
        // get user who has to be paid
        User.findById(item.product.author.id, (err, seller) => {
            if (err) {
                console.log(err);
            } else {
                // pay user
                switch(seller.accountType) {
                    case 'Standard':
                        seller.btcbalance += item.price - ( item.price * standardAccountFee * 0.01);
                        // Withdraw to our wallet
                        // withdrawAmount = item.price * standardAccountFee * 0.01;
                        break;
                    case 'Premium':
                        seller.btcbalance += item.price - ( item.price * premiumAccountFee * 0.01);
                        // Withdraw to our wallet
                        // withdrawAmount = item.price * premiumAccountFee * 0.01;
                        break;
                    case 'Partner':
                        seller.btcbalance += item.price - ( item.price * partnerAccountFee * 0.01);
                        // Withdraw to our wallet
                        // withdrawAmount = item.price * partnerAccountFee * 0.01;
                        break;
                    default:
                        break;
                }
                seller.save();
                // set deal as paid  
                item.paid = true;
                item.save();
            }
        });
    });
  }, 1000);