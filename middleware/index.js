const product = require('../models/product');
const Review = require('../models/review');
const Deal = require('../models/deal');
const Chat = require('../models/chat');

module.exports = {
  isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    req.flash('error', 'You must be signed in to do that!');
    res.redirect('/login');
  },
  checkUserproduct(req, res, next) {
    product.findById(req.params.id, (err, foundproduct) => {
      if (err || !foundproduct) {
        req.flash('error', 'Sorry, that product does not exist!');
        res.redirect('/categories/products');
      } else if (foundproduct.author.id.equals(req.user._id)) {
        req.product = foundproduct;
        next();
      } else {
        req.flash('error', 'You don\'t have permission to do that!');
        res.redirect(`/categories/products/${req.params.id}`);
      }
    });
  },
  // eslint-disable-next-line arrow-parens
  asyncErrorHandler: (fn) => (req, res, next) => {
    Promise
      .resolve(fn(req, res, next))
      .catch(next);
  },
  isReviewAuthor: async (req, res, next) => {
    const review = await Review.findById(req.params.review_id);
    if (review.author.equals(req.user._id)) {
      return next();
    }
    req.session.error = 'There was an error with your request, please try again';
    return res.redirect('back');
  },
  hasCompleteProfile(req, res, next) {
    if ((req.user.full_name) && (req.user.country) && (req.user.state) &&
    (req.user.city) && (req.user.zip) && (req.user.address1)) {
      return next();
    } else {
      req.flash('error', 'Please complete your profile first.');
      return res.redirect('/dashboard');
    }
  },
  checkIfBelongsDeal: async (req, res, next) => {
    const deal = await Deal.findById(req.params.id);
    if ((req.user._id.toString() === deal.buyer.id.toString()) || (req.user._id.toString() === deal.product.author.id.toString())) {
        return next();
    } else {
      req.flash('error', 'There has been an error.');
      return res.redirect('/dashboard');
    }
  },
  checkIfBelongsChat: async (req, res, next) => {
    const chat = await Chat.findById(req.params.id);
    if ((req.user._id.toString() === chat.user1.id.toString()) || (req.user._id.toString() === chat.user2.id.toString())) {
      return next();
    } else {
      req.flash('error', 'There has been an error.');
      return res.redirect('/dashboard');
    }
  }
};
