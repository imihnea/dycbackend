const User = require('../models/user');
const Deal = require('../models/deal');
const Product = require('../models/product');
const Chat = require('../models/chat');

const refundTimer = 60000;

module.exports = {
    async getDeal(req, res) {
        const deal = await Deal.findById(req.params.id);
        const seller = await User.findById(deal.product.author.id);
        const buyer = await User.findById(deal.buyer.id);
        const chat = await Chat.findById(deal.chat);
        res.render('deals/deal', { deal, seller, buyer, user: req.user, chat, errors: false });
    },
    async acceptDeal(req, res) {
        const deal = await Deal.findById(req.params.id);
        deal.status = 'Pending Delivery';
        await deal.save();
        req.flash('success', 'Deal accepted successfully.');
        res.redirect('back');
    },
    async declineDeal(req, res) {
        const deal = await Deal.findById(req.params.id);
        const buyer = await User.findById(deal.buyer.id);
        deal.status = 'Declined';
        buyer.currency[deal.boughtWith] += deal.price;
        await deal.save();
        buyer.markModified('currency');
        await buyer.save();
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
        res.redirect(`/deals/${deal._id}/review`);
    },
    async cancelDeal(req, res) {
        const deal = await Deal.findById(req.params.id);
        const buyer = await User.findById(deal.buyer.id);
        deal.status = 'Cancelled';
        deal.completedAt = Date.now();
        buyer.currency[deal.boughtWith] += deal.price;
        await deal.save();
        buyer.markModified('currency');
        await buyer.save();
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
            res.render('deals/deal', { deal, seller, buyer, user: req.user, chat, errors });
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
                buyer.currency[deal.boughtWith] += deal.price;
                buyer.markModified('currency');
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
            res.render('deals/deal', { deal, seller, buyer, user: req.user, chat, errors });
        } else {
            deal.sellerReason = req.body.reason;
            deal.sellerMessage = req.body.message;
            deal.refund.status = 'Denied';
            deal.status = 'Refund denied';
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
            res.render('deals/deal', { deal, seller, buyer, user: req.user, chat, errors });
        } else {
            deal.refund.status = 'Not fulfilled';
            deal.refund.timeOfRequest = Date.now();
            deal.refund.reason = req.body.reason;
            deal.refund.message = req.body.message;
            deal.refund.option = req.body.option;
            deal.status = 'Processing Refund';
            await deal.save();
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
                res.render('deals/deal_review', { user: req.user, deal: deal });
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
                res.render('deals/deal_review_user', { user: req.user, seller: user, deal });
            }
        }
    },   
};