const product = require('../models/product');

module.exports = {
  isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
      next();
    }
    req.flash('error', 'You must be signed in to do that!');
    res.redirect('/login');
  },
  checkUserproduct(req, res, next) {
    product.findById(req.params.id, (err, foundproduct) => {
      if (err || !foundproduct) {
        req.flash('error', 'Sorry, that product does not exist!');
        res.redirect('categories/products');
      } else if (foundproduct.author.id.equals(req.user._id)) {
        req.product = foundproduct;
        next();
      } else {
        req.flash('error', 'You don\'t have permission to do that!');
        res.redirect(`categories/products/${req.params._id}`);
      }
    });
  },
};
