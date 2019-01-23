const User = require('../models/user');
const Deal = require('../models/deal');

module.exports = {
    async getDeal(req, res) {
        const deal = await Deal.findById(req.params.id);
        const seller = await User.findById(deal.product.author.id);
        const buyer = await User.findById(deal.buyer.id);
        res.render('deals/deal', { deal, seller, buyer, user: req.user });
    },
    async acceptDeal(req, res) {
        const deal = await Deal.findById(req.params.id);
        deal.status = 'Pending Delivery';
        await deal.save();
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
        res.redirect('back');
    },
    async completeDeal(req, res) {
        const deal = await Deal.findById(req.params.id);
        const seller = await User.findById(deal.product.author.id);
        deal.status = 'Completed';
        deal.completedAt = Date.now();
        seller.currency[deal.boughtWith] += deal.price;
        await deal.save();
        seller.markModified('currency');
        await seller.save();
        res.redirect('back');
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
        res.redirect('back');
    },
    async refundDeal(req, res) {
        const deal = await Deal.findById(req.params.id);
        const buyer = await User.findById(deal.buyer.id);
        deal.status = 'Refunded';
        deal.completedAt = Date.now();
        buyer.currency[deal.boughtWith] += deal.price;
        await deal.save();
        buyer.markModified('currency');
        await buyer.save();
        res.redirect('back');
    }
    
};