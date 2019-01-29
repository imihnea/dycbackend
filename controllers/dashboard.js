/* eslint-disable camelcase */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const cloudinary = require('cloudinary');
const Product = require('../models/product');
const User = require('../models/user');
const Deal = require('../models/deal');

// Constants for quick modification
const feature1_time = 60000;
const feature2_time = 120000;
const feature1_cost = -5;
const feature2_cost = -15;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = {
  // Products Indexes
  async openProductIndex(req, res) {
    const products = await Product.paginate({ available: "True", 'author.id': req.user._id }, {
      page: req.query.page || 1,
      limit: 10,
    });
    products.page = Number(products.page);
    res.render('dashboard/dashboard_open', { products });
  },
  async closedProductIndex(req, res) {
    const products = await Product.paginate({ available: "Closed", 'author.id': req.user._id }, {
      page: req.query.page || 1,
      limit: 10,
    });
    products.page = Number(products.page);
    res.render('dashboard/dashboard_closed', { products });
  },
  async purchasedProductIndex(req, res) {
    const deals = await Deal.paginate({ 'buyer.id': req.user._id }, {
      page: req.query.page || 1,
      limit: 10,
    });
    deals.page = Number(deals.page);
    res.render('dashboard/dashboard_purchases', { deals });
  },
  async ongoingProductIndex(req, res) {
    const deals = await Deal.paginate({ $and:[ 
      {$or:
         [{refundableUntil: {$exists: true, $gt: Date.now()}}, {refundableUntil: {$exists: false}}]}, 
      {$or:
         [{'buyer.id': req.user._id}, {'product.author.id': req.user._id}]},
      {status: {$nin: ['Cancelled', 'Refunded', 'Declined']}}]}, {
      page: req.query.page || 1,
      limit: 10,
    });
    deals.page = Number(deals.page);
    res.render('dashboard/dashboard_ongoing', { deals });
  },
  // Show address page
  getAddresses(req, res) {
    res.render('dashboard/dashboard_addr', { user: req.user });
  },
  // Get address modifications
  async addAddresses(req, res) {
    const query = { _id: req.user._id };
    const name = req.body.btcadr || req.body.bchadr || req.body.ethadr
                                || req.body.ltcadr || req.body.dashadr;
    if (name === req.body.btcadr) {
      await User.findByIdAndUpdate(query, { btcadr: name }, (err) => {
        if (err) {
          req.flash('error', err.message);
        } else {
          req.flash('success', 'Successfully updated address!');
          res.redirect('/dashboard/addresses');
        }
      });
    } else if (name === req.body.bchadr) {
      await User.findByIdAndUpdate(query, { bchadr: name }, (err) => {
        if (err) {
          req.flash('error', err.message);
        } else {
          req.flash('success', 'Successfully updated address!');
          res.redirect('/dashboard/addresses');
        }
      });
    } else if (name === req.body.ethadr) {
      await User.findByIdAndUpdate(query, { ethadr: name }, (err) => {
        if (err) {
          req.flash('error', err.message);
        } else {
          req.flash('success', 'Successfully updated address!');
          res.redirect('/dashboard/addresses');
        }
      });
    } else if (name === req.body.ltcadr) {
      await User.findByIdAndUpdate(query, { ltcadr: name }, (err) => {
        if (err) {
          req.flash('error', err.message);
        } else {
          req.flash('success', 'Successfully updated address!');
          res.redirect('/dashboard/addresses');
        }
      });
    } else if (name === req.body.dashadr) {
      await User.findByIdAndUpdate(query, { dashadr: name }, (err) => {
        if (err) {
          req.flash('error', err.message);
        } else {
          req.flash('success', 'Successfully updated address!');
          res.redirect('/dashboard/addresses');
        }
      });
    }
  },
  async topUp(req, res) {
    // Take the currency from a wallet before this happens
    const user = await User.findById(req.user._id);
    if (user.currency[req.params.id]) {
      user.currency[req.params.id] += Number(req.body.value);
    } else {
      user.currency[req.params.id] = Number(req.body.value);
    }
    user.markModified('currency');
    await user.save();
    res.redirect('/dashboard/addresses');
  },
  async withdraw(req, res) {
    const user = await User.findById(req.user._id);
    if (user.currency[req.params.id] >= req.body.value) {
      user.currency[req.params.id] -= Number(req.body.value);
      user.markModified('currency');
      await user.save();
      // Send the currency to a wallet before redirecting
      res.redirect('/dashboard/addresses');
    } else {
      req.flash('error', 'The inputted value exceeds the value present in your account. Please try again.');
      res.redirect('/dashboard/addresses');
    }
  },
  // Products New
  async productCreate(req, res) {
    if ( req.files.length === 0 ){
      req.flash('error', 'You need to upload at least one image.');
      res.redirect('dashboard/dashboard_new');
    } else {
      req.body.product.images = [];
      for (const file of req.files) {
        const image = await cloudinary.v2.uploader.upload(file.path);
        req.body.product.images.push({
          url: image.secure_url,
          public_id: image.public_id,
        });
      }
      const author = {
        id: req.user._id,
        username: req.user.username,
      };
      req.body.product.author = author;

      // Look into which symbols are security threats - product name, product description
      req.check('product[name]', 'The name of the product must be alphanumeric.').matches(/^[a-zA-Z ]+$/i).notEmpty();
      req.check('product[name]', 'The name of the product must be between 3 and 100 characters.').isLength({ min: 3, max: 100 });
      req.check('product[category]', 'Please choose a category.').notEmpty();
      req.check('product[description]', 'The product must have a valid description.').notEmpty();
      let accepted = [];
      let price = [];
      if (req.body.product.acc_btc === "true") {
        req.check('product[btc_price]', 'You must input a Bitcoin price.').matches(/^[0-9.]+$/).notEmpty();
        accepted[0]=true;
        price[0]=req.body.product.btc_price;
      }
      if (req.body.product.acc_bch === "true") {
        req.check('product[bch_price]', 'You must input a Bitcoin Cash price.').matches(/^[0-9.]+$/).notEmpty();
        accepted[1]=true;
        price[1]=req.body.product.bch_price;
      }
      if (req.body.product.acc_eth === "true") {
        req.check('product[eth_price]', 'You must input an Ethereum price.').matches(/^[0-9.]+$/).notEmpty();
        accepted[2]=true;
        price[2]=req.body.product.eth_price;
      }
      if (req.body.product.acc_ltc === "true") {
        req.check('product[ltc_price]', 'You must input a Litecoin price.').matches(/^[0-9.]+$/).notEmpty();
        accepted[3]=true;
        price[3]=req.body.product.ltc_price;
      }
      if (req.body.product.acc_dash === "true") {
        req.check('product[dash_price]', 'You must input a DASH price.').matches(/^[0-9.]+$/).notEmpty();
        accepted[4]=true;
        price[4]=req.body.product.dash_price;
      }
      if ((accepted.length === 0 ) || (price.length === 0 )) {
        req.flash('error', 'Your product must have a price.');
        res.redirect('back');
      } else {     
          // Everything is stored in constants so we can protect against
          // people making fields in the DevTools
          const name = req.body.product.name;
          const description = req.body.product.description;
          const category = req.body.product.category;
          
          const newproduct = {
            name: name,
            images: req.body.product.images,
            category: category,
            description: description,
            price: price,
            author: author,
            accepted: accepted,
          };
          if (req.body.product.repeatable === "true") {
            newproduct.repeatable = req.body.product.repeatable;
          }
          
          const errors = req.validationErrors();
          if (errors) {
            res.render('dashboard/dashboard_new', {
              user: req.user,
              errors: errors,
            });
          } else {
            await User.findById(req.user._id, (err, user) => {
              if (err) {
                req.flash('error', 'An error has occured. (Could not find user)');
                res.redirect('back');
              } else {
                const feat_1 = {};
                const feat_2 = {};
                let k = 0;
                if (( req.body.product.feat_1 ) && ( req.body.product.feat_2 ) && ( k === 0 )) {
                  if ( user.feature_tokens >= 20 ) {
                    feat_1.status = true;
                    feat_1.expiry_date = Date.now() + feature1_time;
                    feat_2.status = true;
                    feat_2.expiry_date = Date.now() + feature2_time;
                    User.findByIdAndUpdate(req.user._id, { $inc: { feature_tokens: (feature1_cost + feature2_cost) } }, (err) => {
                      if (err) {
                        console.log(err);
                      }
                    });
                    newproduct.feat_1 = feat_1;
                    newproduct.feat_2 = feat_2;
                    k = 1;
                  } else {
                    req.flash('error', 'Not enough tokens to promote product.');
                    res.redirect('back');
                  }
                }
                if (( req.body.product.feat_1 )  && ( k === 0 )) {
                  if ( user.feature_tokens >= 5 ) {
                    feat_1.status = true;
                    feat_1.expiry_date = Date.now() + feature1_time;
                    User.findByIdAndUpdate(req.user._id, { $inc: { feature_tokens: feature1_cost } }, (err) => {
                      if (err) {
                        console.log(err);
                      }
                    });
                    newproduct.feat_1 = feat_1;
                  } else {
                    req.flash('error', 'Not enough tokens to promote product.');
                    res.redirect('back');
                  }
                }
                if (( req.body.product.feat_2 )  && ( k === 0 )) {
                  if (user.feature_tokens >= 15) {
                    feat_2.status = true;
                    feat_2.expiry_date = Date.now() + feature2_time;
                    User.findByIdAndUpdate(req.user._id, { $inc: { feature_tokens: feature2_cost } }, (err) => {
                      if (err) {
                        console.log(err);
                      }
                    });
                    newproduct.feat_2 = feat_2;
                  } else {
                    req.flash('error', 'Not enough tokens to promote product.');
                    res.redirect('back');
                  }
                }
              }
            });
    
            const product = await Product.create(newproduct);
            res.redirect(`/products/${product._id}/view`);
          }
        }    
      }
  },
  // Products Show
  async productShow(req, res) {
    const product = await Product.findById(req.params.id).populate({
      path: 'reviews',
      options: { sort: { _id: -1 } },
      populate: {
        path: 'author',
        model: 'User',
      },
    });
    const floorRating = product.calculateAvgRating();
    res.render('products/product_view', { product, floorRating });
  },
  // Products Edit
  async productEdit(req, res) {
    const product = await Product.findById(req.params.id);
    res.render('dashboard/dashboard_edit', { product: product, user: req.user, errors: req.session.errors });
  },
  // Products Update
  async productUpdate(req, res) {
    // find the product by id
    const product = await Product.findById(req.params.id);
    
    // No way to use this yet

    // check if there's any images for deletion
    // if (req.body.deleteImages && req.body.deleteImages.length) {
    //   // assign deleteImages from req.body to its own variable
    //   const deleteImages = req.body.deleteImages;
    //   // loop over deleteImages
    //   for (const public_id of deleteImages) {
    //     // delete images from cloudinary
    //     await cloudinary.v2.uploader.destroy(public_id);
    //     // delete image from product.images
    //     for (const image of product.images) {
    //       if (image.public_id === public_id) {
    //         const index = product.images.indexOf(image);
    //         product.images.splice(index, 1);
    //       }
    //     }
    //   }
    // }

    // check if there are any new images for upload
    if (req.files) {
      // upload images
      for (const file of req.files) {
        const image = await cloudinary.v2.uploader.upload(file.path);
        // add images to product.images array
        product.images.push({
          url: image.secure_url,
          public_id: image.public_id,
        });
      }
    }
    // Look into which symbols are security threats - product name, product description
    req.check('product[name]', 'The name of the product must be alphanumeric.').matches(/^[a-zA-Z ]+$/i).notEmpty();
    req.check('product[name]', 'The name of the product must be between 3 and 100 characters.').isLength({ min: 3, max: 100 });
    req.check('product[category]', 'Please choose a category.').notEmpty();
    req.check('product[description]', 'The product must have a valid description.').notEmpty();
    let accepted = [];
    let price = [];
    if (req.body.product.acc_btc === "true") {
      req.check('product[btc_price]', 'You must input a Bitcoin price.').matches(/^[0-9.]+$/).notEmpty();
      accepted[0]=true;
      price[0]=req.body.product.btc_price;
    }
    if (req.body.product.acc_btc === null) {
      accepted[0]=false;
    }
    if (req.body.product.acc_bch === "true") {
      req.check('product[bch_price]', 'You must input a Bitcoin Cash price.').matches(/^[0-9.]+$/).notEmpty();
      accepted[1]=true;
      price[1]=req.body.product.bch_price;
    }
    if (req.body.product.acc_bch === null) {
      accepted[1]=false;
    }
    if (req.body.product.acc_eth === "true") {
      req.check('product[eth_price]', 'You must input an Ethereum price.').matches(/^[0-9.]+$/).notEmpty();
      accepted[2]=true;
      price[2]=req.body.product.eth_price;
    }
    if (req.body.product.acc_eth === null) {
      accepted[2]=false;
    }
    if (req.body.product.acc_ltc === "true") {
      req.check('product[ltc_price]', 'You must input a Litecoin price.').matches(/^[0-9.]+$/).notEmpty();
      accepted[3]=true;
      price[3]=req.body.product.ltc_price;
    }
    if (req.body.product.acc_ltc === null) {
      accepted[3]=false;
    }
    if (req.body.product.acc_dash === "true") {
      req.check('product[dash_price]', 'You must input a DASH price.').matches(/^[0-9.]+$/).notEmpty();
      accepted[4]=true;
      price[4]=req.body.product.dash_price;
    }
    if (req.body.product.acc_dash === null) {
      accepted[4]=false;
    }
    if ((accepted.length === 0 ) || (price.length === 0 )) {
      req.flash('error', 'Your product must have a price.');
      res.redirect('back');
    } else {     
      const errors = req.validationErrors();
      if (errors) {
        res.render('dashboard/dashboard_edit', {
          user: req.user,
          errors: errors,
          product
        });
      } else {
        // Everything is stored in constants so we can protect against
        // people making fields in the DevTools
        // update the product with any new properties
        product.name = req.body.product.name;
        product.description = req.body.product.description;
        product.category = req.body.product.category;
        product.price = price;
        product.accepted = accepted;
        // save the updated product into the db
        product.save();
        // redirect to show page
        res.redirect(`/products/${product.id}/view`);
      }
    }
  },
  // Feature product
  async productFeature(req, res) {
    const product = await Product.findById(req.params.id);
    const feature_id = req.params.feature_id;
    switch ( feature_id ) {
      case '1': 
        await User.findById(req.user._id, (err, user) => {
          if (err) {
            req.flash('error', 'An error has occured. (Could not find user)');
            res.redirect('back');
          } else {
              if ( user.feature_tokens >= 5 ) {
                product.feat_1.status = true;
                product.feat_1.expiry_date = Date.now() + feature1_time;
                User.findByIdAndUpdate(req.user._id, { $inc: { feature_tokens: feature1_cost } }, (err) => {
                  if (err) {
                    console.log(err);
                  }
                });
                product.save();
                res.redirect(`/products/${product.id}/view`);
              } else {
                req.flash('error', 'Not enough tokens to promote product.');
                res.redirect('back');
              }
          }
        });
        break;

      case '2': 
        await User.findById(req.user._id, (err, user) => {
          if (err) {
            req.flash('error', 'An error has occured. (Could not find user)');
            res.redirect('back');
          } else {
              if (user.feature_tokens >= 15) {
                product.feat_2.status = true;
                product.feat_2.expiry_date = Date.now() + feature2_time;
                User.findByIdAndUpdate(req.user._id, { $inc: { feature_tokens: feature2_cost } }, (err) => {
                  if (err) {
                    console.log(err);
                  }
                });
                product.save();
                res.redirect(`/products/${product.id}/view`);
              } else {
                req.flash('error', 'Not enough tokens to promote product.');
                res.redirect('back');
              }
          }
        });
        break;
      
      default:
        break;
      
    }
  },
  // Products Destroy
  async productDestroy(req, res) {
    const product = await Product.findById(req.params.id);
    for (const image of product.images) {
      await cloudinary.v2.uploader.destroy(image.public_id);
    }
    await product.remove();
    req.session.success = 'Product deleted successfully!';
    res.redirect('/dashboard/open');
  },
};
