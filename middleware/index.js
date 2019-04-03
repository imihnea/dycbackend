const product = require('../models/product');
const Review = require('../models/review');
const Deal = require('../models/deal');
const Chat = require('../models/chat');

const jwt = require('jsonwebtoken');

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
    if ((req.user.full_name) && (req.user.country) && (req.user.state) 
    && (req.user.city) && (req.user.zip) && (req.user.address1)) {
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
  },
  assignCookie: (req, res, next) => {
    if (req.user) {
      const secret = `${process.env.CSRF_SECRET_1}`;
      res.cookie('_csrf', jwt.sign({ user: req.user._id }, secret, { expiresIn: '1h' }));
      // make a jwt out of the secret to confuse hackers
      const secret2 = `${process.env.CSRF_SECRET_2}`;
      req.body.csrfSecret = jwt.sign({decoder: secret}, secret2, {expiresIn: '1h'});
    }
    return next();
  },
  verifyCookie: (req, res, next) => {
    // decode the secret
    jwt.verify(req.body._csrf, `${process.env.CSRF_SECRET_2}`, (err, result) => {
      if (err) {
        req.flash('error', 'Something went wrong. Please try again.');
        return res.redirect('/dashboard');
      }
      // verify the jwt
      jwt.verify(req.cookies._csrf, result.decoder, (err) => {
        if (err) {
          req.flash('error', 'Something went wrong. Please try again.');
          return res.redirect('/dashboard');
        }
        return next();
      });
    });
  },
  verifyParam: (req, res, next) => {
    jwt.verify(req.params.csrfSecret, `${process.env.CSRF_SECRET_2}`, (err, result) => {
      if (err) {
        req.flash('error', 'Something went wrong1. Please try again.');
        return res.redirect('/dashboard');
      }
      jwt.verify(req.params._csrf, result.decoder, (err) => {
        if (err) {
          console.log(err);
          req.flash('error', 'Something went wrong. Please try again.');
          return res.redirect('/dashboard');
        }
        return next();
      });
    });
  }
};
