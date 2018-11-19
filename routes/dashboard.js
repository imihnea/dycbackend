/* eslint-disable no-param-reassign */
const express = require('express');

const multer = require('multer');

const cloudinary = require('cloudinary');

const product = require('../models/product');

const user = require('../models/user');

const router = express.Router();

const middleware = require('../middleware');

const { isLoggedIn, checkUserproduct } = middleware; // destructuring assignment

// Dashboard index route
router.get('/', isLoggedIn, (req, res) => {
  res.render('dashboard/dashboard');
});

// Show all addresses for withdraw
router.get('/addresses', isLoggedIn, (req, res) => {
  res.render('dashboard/dashboard_addr', { user: req.user });
});

router.post('/addresses', isLoggedIn, (req, res) => {
  const query = { _id: req.user._id };
  const name = req.body.btcadr || req.body.bchadr || req.body.ethadr
                               || req.body.ltcadr || req.body.dashadr;
  if (name === req.body.btcadr) {
    user.findByIdAndUpdate(query, { btcadr: name }, (err) => {
      if (err) {
        req.flash('error', err.message);
      } else {
        req.flash('success', 'Successfully updated address!');
        res.redirect('/dashboard/addresses');
      }
    });
  } else if (name === req.body.bchadr) {
    user.findByIdAndUpdate(query, { bchadr: name }, (err) => {
      if (err) {
        req.flash('error', err.message);
      } else {
        req.flash('success', 'Successfully updated address!');
        res.redirect('/dashboard/addresses');
      }
    });
  } else if (name === req.body.ethadr) {
    user.findByIdAndUpdate(query, { ethadr: name }, (err) => {
      if (err) {
        req.flash('error', err.message);
      } else {
        req.flash('success', 'Successfully updated address!');
        res.redirect('/dashboard/addresses');
      }
    });
  } else if (name === req.body.ltcadr) {
    user.findByIdAndUpdate(query, { ltcadr: name }, (err) => {
      if (err) {
        req.flash('error', err.message);
      } else {
        req.flash('success', 'Successfully updated address!');
        res.redirect('/dashboard/addresses');
      }
    });
  } else if (name === req.body.dashadr) {
    user.findByIdAndUpdate(query, { dashadr: name }, (err) => {
      if (err) {
        req.flash('error', err.message);
      } else {
        req.flash('success', 'Successfully updated address!');
        res.redirect('/dashboard/addresses');
      }
    });
  }
});

// Show all open offers
router.get('/open', isLoggedIn, (req, res) => {
  product.find({ available: true, 'author.id': req.user._id }, (err, allproducts) => {
    if (err) {
      req.flash('error', err.message);
    } else {
      res.render('dashboard/dashboard_open', { products: allproducts });
    }
  });
});

// Show all closed offers
router.get('/closed', isLoggedIn, (req, res) => {
  product.find({ available: false, 'author.id': req.user._id }, (err, allproducts) => {
    if (err) {
      req.flash('error', err.message);
      res.redirect('/dashboard');
    } else {
      res.render('dashboard/dashboard_closed', { products: allproducts });
    }
  });
});

// Show all purchases
router.get('/purchases', isLoggedIn, (req, res) => {
  product.find({ buyer: req.user._id }, (err, allproducts) => {
    if (err) {
      req.flash('error', err.message);
      res.redirect('/dashboard');
    } else {
      res.render('dashboard/dashboard_purchases', { products: allproducts });
    }
  });
});

// NEW - show form to create new product
router.get('/new', isLoggedIn, (req, res) => {
  res.render('dashboard/dashboard_new');
});

// Set Storage Engine
const storage = multer.diskStorage({
  filename: (req, file, cb) => {
    cb(null, Date.now() + file.originalname);
  },
});

const imageFilter = (req, file, cb) => {
  // accept image files only
  if (!file.originalname.match(/\.(jpg|jpeg|png)$/i)) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

cloudinary.config({
  cloud_name: 'dyc',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({
  storage: storage,
  fileFilter: imageFilter,
});

// CREATE - add new product to DB
router.post('/', isLoggedIn, upload.single('image'), (req, res) => {
  // get data from form and add to products array
  cloudinary.v2.uploader.upload(req.file.path, (err, result) => {
    const name = req.body.name;
    req.body.image = result.secure_url;
    req.body.imageId = result.public_id;
    const description = req.body.description;
    const category = req.body.category;
    const accepted = req.body.accepted;
    const author = {
      id: req.user._id,
      username: req.user.username,
    };
    const price = req.body.price;
    const newproduct = {
      name: name,
      image: req.body.image,
      imageId: req.body.imageId,
      category: category,
      description: description,
      price: price,
      author: author,
      accepted: accepted,
    };
    if (err) {
      req.flash('error', err.message);
    } else if (req.file === undefined) {
      req.flash('error', err.message);
    } else {
      // Create a new product and save to DB
      product.create(newproduct, (error) => {
        if (error) {
          req.flash('error', error.message);
        } else {
          req.flash('success', 'Successfully added a new product!');
          // redirect back to products page
          res.redirect('/dashboard/open');
        }
      });
    }
  });
});

// SHOW - shows more info about one product
router.get('/:id', isLoggedIn, (req, res) => {
  // find the product with provided ID
  product.findById(req.params.id).exec((err, foundproduct) => {
    if (err || !foundproduct) {
      req.flash('error', 'Sorry, that product does not exist!');
      return res.redirect('/dashboard/open');
    }
    // render show template with that product
    res.render('dashboard/dashboard_view', { product: foundproduct });
  });
});

// EDIT - shows edit form for a product
router.get('/:id/edit', isLoggedIn, checkUserproduct, (req, res) => {
  product.findById(req.params.id, (err, foundproduct) => {
    if (err) {
      req.flash('error', err.message);
      res.redirect('/dashboard/open');
    } else {
      // render edit template with that product
      res.render('dashboard/dashboard_edit', { product: foundproduct });
    }
  });
});

// PUT - updates product in the database
router.put('/:id', upload.single('image'), (req, res) => {
  product.findById(req.params.id, async (err, Product) => {
    if (err) {
      req.flash('error', err.message);
      res.redirect('back');
    } else {
      if (req.file) {
        try {
          await cloudinary.v2.uploader.destroy(Product.imageId);
          const result = await cloudinary.v2.uploader.upload(req.file.path);
          Product.imageId = result.public_id;
          Product.image = result.secure_url;
        } catch (error) {
          req.flash('error', error.message);
          return res.redirect('back');
        }
      }
      Product.name = req.body.name;
      Product.description = req.body.description;
      Product.category = req.body.category;
      Product.accepted = req.body.accepted;
      Product.price = req.body.price;
      Product.save();
      req.flash('success', 'Successfully Updated!');
      res.redirect(`/dashboard/${Product._id}`);
    }
  });
});

// DELETE - deletes product from database - don't forget to add "are you sure" on frontend
router.delete('/:id', (req, res) => {
  product.findById(req.params.id, async (err, Product) => {
    if (err) {
      req.flash('error', err.message);
      return res.redirect('back');
    }
    try {
      await cloudinary.v2.uploader.destroy(Product.imageId);
      Product.remove();
      req.flash('success', 'Product deleted successfully!');
      res.redirect('/dashboard/open');
    } catch (error) {
      if (error) {
        req.flash('error', error.message);
        return res.redirect('back');
      }
    }
  });
});

module.exports = router;
