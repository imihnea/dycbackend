const express = require('express');

const product = require('../models/product');

const router = express.Router();

const middleware = require('../middleware');

const { isLoggedIn, checkUserproduct } = middleware; // destructuring assignment

// show all categories
router.get('/', (req, res) => {
  // Get all categories from DB
  product.find({}, (err, allproducts) => {
    if (err) {
      req.flash('error', err.message);
    } else {
      res.render('index/categories', { products: allproducts, page: 'categories' });
    }
  });
});

// show all products inside specific category
router.get('/products', (req, res) => {
// Get all products from DB
  product.find({}, (err, allproducts) => {
    if (err) {
      req.flash('error', err.message);
    } else {
      res.render('products/product_all', { products: allproducts, page: 'products' });
    }
  });
});
// CREATE - add new product to DB
router.post('/products', isLoggedIn, (req, res) => {
// get data from form and add to products array
  const name = req.body.name;
  const image = req.body.image;
  const desc = req.body.description;
  const category = req.body.category;
  const accepted = req.body.accepted;
  const author = {
    id: req.user._id,
    username: req.user.username,
  };
  const price = req.body.price;
  const newproduct = {
    name: name,
    image: image,
    category: category,
    description: desc,
    price: price,
    author: author,
    accepted: accepted,
  };
    // Create a new product and save to DB
  product.create(newproduct, (err) => {
    if (err) {
      req.flash('error', err.message);
    } else {
      req.flash('success', 'Successfully added a new product!');
      // redirect back to products page
      res.redirect('/categories/products');
    }
  });
});

// NEW - show form to create new product
router.get('/products/new', isLoggedIn, (req, res) => {
  res.render('products/product_new');
});

// SHOW - shows more info about one product
router.get('/products/:id', (req, res) => {
// find the product with provided ID
  product.findById(req.params.id).exec((err, foundproduct) => {
    if (err || !foundproduct) {
      req.flash('error', 'Sorry, that product does not exist!');
      return res.redirect('/products');
    }
    // render show template with that product
    res.render('products/product', { product: foundproduct });
  });
});

// EDIT - shows edit form for a product
router.get('/products/:id/edit', isLoggedIn, checkUserproduct, (req, res) => {
  product.findById(req.params.id, (err, foundproduct) => {
    if (err) {
      req.flash('error', err.message);
      res.redirect('/categories/products');
    } else {
    // render edit template with that product
      res.render('products/product_edit', { product: foundproduct });
    }
  });
});

// PUT - updates product in the database
router.put('/products/:id', isLoggedIn, checkUserproduct, (req, res) => {
  product.findByIdAndUpdate(req.params.id, req.body.product, (err) => {
    if (err) {
      req.flash('error', 'Error editing product!');
      res.redirect('/categories/products');
    } else {
      req.flash('success', 'Successfully edited product!');
      res.redirect(`/categories/products/${product._id}`);
    }
  });
});

// DELETE - deletes product from database - don't forget to add "are you sure" on frontend

router.delete('/products/:id', isLoggedIn, checkUserproduct, (req, res) => {
  product.findByIdAndRemove(req.params.id, (err) => {
    if (err) {
      req.flash('error', err.message);
      res.redirect('/categories/products');
    } else {
      req.flash('success', 'Successfully deleted product!');
      res.redirect('/categories/products');
    }
  });
});

module.exports = router;
