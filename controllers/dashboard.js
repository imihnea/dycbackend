/* eslint-disable camelcase */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const cloudinary = require('cloudinary');
const Product = require('../models/product');
const User = require('../models/user');

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
  productNew(req, res) {
    res.render('posts/new');
  },
  async productCreate(req, res) {
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
    const name = req.body.product.name;
    const description = req.body.product.description;
    const category = req.body.product.category;
    const accepted = [req.body.product.acc_btc, req.body.product.acc_bch, req.body.product.acc_eth,
      req.body.product.acc_ltc, req.body.product.acc_dash];
    const price = [req.body.product.btc_price, req.body.product.bch_price,
      req.body.product.eth_price, req.body.product.ltc_price,
      req.body.product.dash_price];
    
    // In case someone deletes the 'required' attribute of a price input
    price.forEach((item, i) => {
      if ((!item[i]) && (accepted[i])) {
        accepted[i] = !accepted[i];
      }
    });

    req.body.product.price = price;
    // TODO: Verify the data before creating the new product
    const newproduct = {
      name: name,
      images: req.body.product.images,
      category: category,
      description: description,
      price: price,
      author: author,
      accepted: accepted,
    };
    const product = await Product.create(newproduct);
    // const product = await Product.create(req.body.product);
    res.redirect(`/products/${product._id}/view`);
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
    res.render('posts/show', { product, floorRating });
  },
  // Products Edit
  async productEdit(req, res) {
    const product = await Product.findById(req.params.id);
    res.render('posts/edit', { product });
  },
  // Products Update
  async productUpdate(req, res) {
    // find the product by id
    const product = await Product.findById(req.params.id);
    // check if there's any images for deletion
    if (req.body.deleteImages && req.body.deleteImages.length) {
      // assign deleteImages from req.body to its own variable
      const deleteImages = req.body.deleteImages;
      // loop over deleteImages
      for (const public_id of deleteImages) {
        // delete images from cloudinary
        await cloudinary.v2.uploader.destroy(public_id);
        // delete image from product.images
        for (const image of product.images) {
          if (image.public_id === public_id) {
            const index = product.images.indexOf(image);
            product.images.splice(index, 1);
          }
        }
      }
    }
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
    // update the product with any new properties
    product.name = req.body.product.name;
    product.description = req.body.product.description;
    product.price = req.body.product.price;
    // save the updated product into the db
    product.save();
    // redirect to show page
    res.redirect(`/products/${product.id}`);
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
