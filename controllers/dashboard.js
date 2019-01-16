/* eslint-disable camelcase */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const cloudinary = require('cloudinary');
const Product = require('../models/product');
const User = require('../models/user');
const feature1_time = 60000;
const feature2_time = 120000;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = {
  // Products Index
  async productIndex(req, res) {
    const products = await Product.paginate({ available: true, 'author.id': req.user._id }, {
      page: req.query.page || 1,
      limit: 10,
    });
    products.page = Number(products.page);
    res.render('dashboard/dashboard_open', { products });
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
      // Everything is stored in constants so we can protect against
      // people making fields in the DevTools
      req.check('product[name]', 'The name of the product must be alphanumeric.').matches(/^[a-z ]+$/i).notEmpty();
      req.check('product[name]', 'The name of the product must be between 3 and 30 characters.').isLength({ min: 3, max: 30 });
      req.check('product[category]', 'Please choose a category.').notEmpty();
      req.check('product[description]', 'The product must have a valid description.').notEmpty();
      // Figure out how to validate accepted + price
      const name = req.body.product.name;
      const description = req.body.product.description;
      const category = req.body.product.category;
      const accepted = [req.body.product.acc_btc, req.body.product.acc_bch, req.body.product.acc_eth,
        req.body.product.acc_ltc, req.body.product.acc_dash];
      const price = [req.body.product.btc_price, req.body.product.bch_price,
        req.body.product.eth_price, req.body.product.ltc_price,
        req.body.product.dash_price];
        
      req.body.product.price = price;
      const newproduct = {
        name: name,
        images: req.body.product.images,
        category: category,
        description: description,
        price: price,
        author: author,
        accepted: accepted,
      };
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
              User.findByIdAndUpdate(req.user._id, { $inc: { feature_tokens: -20 } }, (err) => {
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
              User.findByIdAndUpdate(req.user._id, { $inc: { feature_tokens: -5 } }, (err) => {
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
              User.findByIdAndUpdate(req.user._id, { $inc: { feature_tokens: -15 } }, (err) => {
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

      // In case someone deletes the 'required' attribute of a price input
      // TODO: Decide if this shit's going to be useful, omegalul
      // price.forEach((item, i) => {
      //   if ((!item[i]) && (accepted[i])) {
      //     accepted[i] = !accepted[i];
      //   }
      // });

      const product = await Product.create(newproduct);
      res.redirect(`/products/${product._id}/view`);
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
    res.render('dashboard/dashboard_edit', { product: product, user: req.user });
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
  
    const accepted = [req.body.product.acc_btc, req.body.product.acc_bch, req.body.product.acc_eth,
      req.body.product.acc_ltc, req.body.product.acc_dash];
    const price = [req.body.product.btc_price, req.body.product.bch_price,
      req.body.product.eth_price, req.body.product.ltc_price,
      req.body.product.dash_price];
    
    // In case someone deletes the 'required' attribute of a price input
    // TODO: decide if this shit is actually going to be useful, omegalul
    // price.forEach((item, i) => {
    //   if ((!item[i]) && (accepted[i])) {
    //     console.log('kappa');
    //     accepted[i] = !accepted[i];
    //   }
    // });

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
                User.findByIdAndUpdate(req.user._id, { $inc: { feature_tokens: -5 } }, (err) => {
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
                User.findByIdAndUpdate(req.user._id, { $inc: { feature_tokens: -15 } }, (err) => {
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
