/* eslint-disable camelcase */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const cloudinary = require('cloudinary');
const Product = require('../models/product');
const Deal = require('../models/deal');
const User = require('../models/user');
const Review = require('../models/review');
const { errorLogger, userLogger } = require('../config/winston');
const Subscription = require('../models/subscription');
const { Regions } = require('../dist/js/regions');
const moment = require('moment');
const middleware = require('../middleware/index');

const { asyncErrorHandler } = middleware; // destructuring assignment

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
      let premium = await Subscription.findOne({userid: req.params.id}, (err, sub) => {
        if(err) {
          console.log('Failed to retrieve subscription.');
          errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message} - Failed to retrieve subscription\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.params.id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
        }
      });
      if (premium) {
        res.render('index/profile', { 
          viewedUser: user, 
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
          viewedUser: user, 
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
        User.findById(req.user._id, asyncErrorHandler(async (err, user) => {
            if (err) {
              req.flash('error', err.message);
              return res.redirect('back');
            } else {
                // check if there are any new images for upload
                if (req.file) {
                // upload images
                    try{
                      await cloudinary.v2.uploader.upload(req.file.path, 
                        {
                          moderation: "aws_rek:suggestive:ignore",
                          transformation: [
                            {aspect_ratio: "4:3", crop: "fill", quality: "jpegmini:1", sign_url: true},
                            {width: "auto", dpr: "auto", crop: "scale"}
                            ]
                        }, (err, result) => {
                          if(err) {
                            console.log(err);
                          } else if (result.moderation[0].status === 'rejected') {
                              user.avatar.url = 'https://res.cloudinary.com/dyc/image/upload/v1542621004/samples/food/dessert.jpg';
                              user.avatar.public_id = result.public_id;
                              console.log(result);
                          } else {
                            user.avatar.url = result.secure_url;
                            user.avatar.public_id = result.public_id;
                            console.log(result);
                          }
                        });
                    } catch (error) {
                        req.flash('error', error.message);
                        return res.redirect('back');
                    }
                }
                req.check('name', 'The name must be at least 3 characters long, 100 at most').notEmpty().isLength({ min: 3, max: 100 });
                req.check('name', 'The name must not contain any special characters besides the hyphen (-)').matches(/^[a-z0-9 -]+$/gi).trim();
                req.check('country', 'Please select a country').notEmpty().matches(/^[a-z .\-,]+$/gi);
                req.check('state', 'Please select a state').notEmpty().matches(/^[a-z .\-,]+$/gi);
                req.check('city', 'Please select a city').notEmpty().matches(/^[a-z .\-,]+$/gi);
                req.check('address1', 'Please input a valid first address').notEmpty().matches(/^[a-z0-9., -]+$/gi).trim();
                req.check('address2', 'Please input a valid second address line').matches(/^$|[a-z0-9., -]+$/gi).trim();
                req.check('zip', 'Please specify an alphanumeric zip code').notEmpty().isAlphanumeric().trim();
                const errors = req.validationErrors();
                if (errors) {
                    let premium = await Subscription.findOne({userid: req.user._id}, (err, sub) => {
                      if(err) {
                        console.log('Failed to retrieve subscription.');
                        errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message} - Failed to retrieve subscription\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                      }
                    });
                    if(premium) {
                      let date = premium.expireDate;
                      let dateObj = new Date(date);
                      let momentObj = moment(dateObj);
                      let expireDate = momentObj.format('MM-DD-YYYY');
                      premium = true;
                      res.render('dashboard/dashboard', { 
                        user: req.user,
                        premium,
                        expireDate: expireDate,
                        errors,
                        csrfToken: req.cookies._csrf,
                        csrfSecret: req.body.csrfSecret,
                        pageTitle: 'Dashboard - Deal Your Crypto',
                        pageDescription: 'Description',
                        pageKeywords: 'Keywords'
                      });
                    } else {
                      premium = false;
                      res.render('dashboard/dashboard', { 
                        user: req.user,
                        premium,
                        errors,
                        csrfToken: req.cookies._csrf,
                        csrfSecret: req.body.csrfSecret,
                        pageTitle: 'Dashboard - Deal Your Crypto',
                        pageDescription: 'Description',
                        pageKeywords: 'Keywords'
                      });
                    }
                } else {
                  if (process.env.NODE_ENV === 'production') {
                    const oldData = [ user.full_name, user.country, user.state, user.city, user.address1, user.address2, user.zip ];
                    const newData = [ req.body.name, req.body.country, req.body.state, req.body.city, req.body.address1, req.body.address2, req.body.zip ];
                    userLogger.info(`Message: User details changed\r\nOld Data: ${oldData}\r\nNew Data: ${newData}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);                    
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
                  Regions.forEach(asyncErrorHandler(async (region) => {
                    if ((user.country == region.country) && (user.continent != region.continent)) {
                      user.continent = region.continent;
                      await Product.updateMany({'author.id': user._id, 'available': 'True'}, { $set: {'author.continent': user.continent}});
                    }
                  }));
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
                  return res.redirect(`/profile/${user._id}`);
                }
            }
        }));
  },
};
