/* eslint-disable camelcase */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const cloudinary = require('cloudinary');
const Product = require('../models/product');
const Deal = require('../models/deal');
const User = require('../models/user');
const Review = require('../models/review');
const Log = require('../models/log');
const Subscription = require('../models/subscription');
const { Regions } = require('../dist/js/regions');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = {
    // View Profile
    async getProfile(req, res){
      const user = await User.findById(req.params.id).populate({
        path: 'reviews',
        options: { sort: { _id: -1 } },
        populate: {
          path: 'author',
          model: 'User',
        },
      });
      const reviews = await Review.paginate({ user: req.params.id },{
        sort: { createdAt: -1 },
        populate: ['user', 'product'],
        page: req.query.page || 1,
        limit: 5,
      });
      reviews.page = Number(reviews.page);
      const floorRating = user.calculateAvgRating();
      const products = await Product.find({ available: "True", 'author.id': req.params.id });
      let premium = await Subscription.findOne({userid: req.user._id}, (err, sub) => {
        if(err) {
          console.log('Failed to retrieve subscription.');
          createErrorLog(req.user._id, 'Dashboard',req.route.path, Object.keys(req.route.methods)[0], 'getDashboardIndex', err);
        }
      });
      if (premium) {
        res.render('index/profile', { 
          user, 
          products, 
          floorRating, 
          reviews,
          premium,
          pageTitle: 'Profile - Deal Your Crypto',
          pageDescription: 'Description',
          pageKeywords: 'Keywords'
        });
      } else {
        res.render('index/profile', { 
          user, 
          products, 
          floorRating, 
          reviews,
          premium: false,
          pageTitle: 'Profile - Deal Your Crypto',
          pageDescription: 'Description',
          pageKeywords: 'Keywords'
        });
      }
    },
    // Profile Update
    async profileUpdate(req, res) {
        User.findById(req.params.id, async (err, user) => {
            if (err) {
              req.flash('error', err.message);
              res.redirect('back');
            } else {
                // check if there are any new images for upload
                if (req.file) {
                // upload images
                    try{
                        const image = await cloudinary.v2.uploader.upload(req.file.path);
                        user.avatar.url = image.secure_url;
                        user.avatar.public_id = image.public_id;
                    } catch (error) {
                        req.flash('error', error.message);
                        return res.redirect('back');
                    }
                }
                req.check('name', 'Name must be between 3 and 40 letters').matches(/^[a-zA-Z ]+$/i).notEmpty().isLength({ min: 3, max: 40 });
                req.check('country', 'Please select a country').matches(/^[a-zA-Z \-,]+$/).notEmpty();
                req.check('state', 'Please select a state').matches(/^[a-zA-Z \-,]+$/).notEmpty();
                req.check('city', 'Please select a city').matches(/^[a-zA-Z \-,]+$/).notEmpty();
                req.check('address1', 'Please input a valid first address').matches(/^[a-z0-9., -]+$/i).notEmpty();
                req.check('address2', 'Please input a valid second address line').matches(/^$|[a-z0-9., -]+$/i);
                req.check('zip', 'Please specify an alphanumeric zip code').notEmpty().matches(/^[a-z0-9 ]+$/i);
                const errors = req.validationErrors();
                if (errors) {
                  errors.forEach((error) => {
                    req.flash('error', error.msg);
                  });
                  res.redirect('back');
                } else {
                  if (process.env.NODE_ENV === 'production') {
                    const oldData = [ user.full_name, user.country, user.state, user.city, user.address1, user.address2, user.zip ];
                    const newData = [ req.body.name, req.body.country, req.body.state, req.body.city, req.body.address1, req.body.address2, req.body.zip ];
                    const log = {
                      logType: 'Change',
                      message: 'User changed personal details',
                      data: { oldData, newData },
                      sentFromUser: req.user._id,
                      sentFromFile: 'Profile controller',
                      sentFromMethod: 'profileUpdate'
                    };
                    Log.create(log, (err) => {
                      if (err) {
                        console.log(err);
                      }
                    });
                  }
                  user.full_name = req.body.name;
                  if (user.country != req.body.country) {
                    user.country = req.body.country;
                    await Product.updateMany({'author.id': user._id, 'available': 'True'}, { $set: {'author.country': user.country}});
                  }
                  if (user.state != req.body.state) {
                    user.state = req.body.state;
                    await Product.updateMany({'author.id': user._id, 'available': 'True'}, { $set: {'author.state': user.state}});
                  }
                  if (user.city != req.body.city) {
                    user.city = req.body.city;
                    await Product.updateMany({'author.id': user._id, 'available': 'True'}, { $set: {'author.city': user.city}});
                  }
                  Regions.forEach(async (region) => {
                    if ((user.country == region.country) && (user.continent != region.continent)) {
                      user.continent = region.continent;
                      await Product.updateMany({'author.id': user._id, 'available': 'True'}, { $set: {'author.continent': user.continent}});
                    }
                  });
                  user.address1 = req.body.address1;
                  user.zip = req.body.zip;
                  user.address2 = req.body.address2;
                  await user.save();
                  await Deal.updateMany({'buyer.id': user._id, 'status': 'Processing'},
                  { 
                    $set: { 
                      'product.author.address.country': user.country, 
                      'product.author.address.state': user.state, 
                      'product.author.address.city': user.city, 
                      'product.author.address.continent': user.continent,
                      'product.author.address.address1': user.address1,
                      'product.author.address.address2': user.address2,
                      'product.author.address.zip': user.zip
                    } 
                  });
                  req.flash('success', 'Successfully updated your profile!');
                  res.redirect(`/profile/${user._id}`);
                }
            }
        });
  },
};
