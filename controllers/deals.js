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
        res.render('deals/deal', { deal, seller, buyer, user: req.user, chat });
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
        deal.completedAt = Date.now();
        deal.refundableUntil = Date.now() + refundTimer;
        deal.status = 'Completed';
        await deal.save();
        if (!product.repeatable) {
            product.available = 'Closed';
            await product.save();
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
    },
    // Deny Refund
    async refundDeny(req, res) {
        const deal = await Deal.findById(req.params.id);
        deal.sellerReason = req.body.reason;
        deal.sellerMessage = req.body.message;
        deal.refund.status = 'Denied';
        deal.status = 'Refund denied';
        req.flash('success', 'Refund status updated: A moderator will take a look as soon as possible.');
        res.redirect('back');
    },
    // Send refund request message
    async refundRequest(req, res) {
        // Find the deal
        const deal = await Deal.findById( req.params.id );
        // Create the refund request
        deal.refund.status = 'Not fulfilled';
        deal.refund.reason = req.body.reason;
        deal.refund.message = req.body.message;
        deal.refund.option = req.body.option;
        deal.status = 'Processing Refund';
        await deal.save();
        req.flash('success', 'Refund request sent.');
        res.redirect(`/deals/${deal._id}`);
    },
    async reviewProduct(req, res) {
        const deal = await Deal.findById(req.params.id);
        res.render('deals/deal_review', { user: req.user, deal: deal });
    },

    
};