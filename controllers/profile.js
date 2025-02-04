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
const { client } = require('../config/elasticsearch');
var Filter = require('bad-words'),
    filter = new Filter();
const { fork } = require("child_process");
const cloudinaryUploader = fork("config/multipleUploader.js");

const { asyncErrorHandler } = middleware; // destructuring assignment

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const cleanHTML = (unclean) => {
  return unclean
    .replace(/</g, "")
    .replace(/>/g, "");
};

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
      if (!user) {
        req.flash('error', 'That page does not exist');
        return res.redirect('/error');
    } 
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
          oneDollar: req.oneDollar,
          pageTitle: 'Profile - Deal Your Crypto',
          pageDescription: 'User profile on Deal Your Crypto, the first marketplace dedicated to cryptocurrency.',
          pageKeywords: 'user profile, user, profile, deal your crypto, dealyourcrypto, crypto deal, deal crypto'
        });
      } else {
        res.render('index/profile', { 
          viewedUser: user, 
          products, 
          floorRating, 
          reviews,
          premium: false,
          oneDollar: req.oneDollar,
          pageTitle: 'Profile - Deal Your Crypto',
          pageDescription: 'User profile on Deal Your Crypto, the first marketplace dedicated to cryptocurrency.',
          pageKeywords: 'user profile, user, profile, deal your crypto, dealyourcrypto, crypto deal, deal crypto'
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
                req.check('name', 'The name must be at least 3 characters long, 100 at most').notEmpty().isLength({ min: 3, max: 100 });
                req.check('name', 'The name must not contain any special characters besides the hyphen (-)').matches(/^[a-z -]+$/gi).trim();
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
                        pageDescription: 'Your personal dashboard on Deal Your Crypto, the first marketplace dedicated to cryptocurrency.',
                        pageKeywords: 'dashboard, personal dashboard, deal your crypto, dealyourcrypto, crypto deal, deal crypto'
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
                        pageDescription: 'Your personal dashboard on Deal Your Crypto, the first marketplace dedicated to cryptocurrency.',
                        pageKeywords: 'dashboard, personal dashboard, deal your crypto, dealyourcrypto, crypto deal, deal crypto'
                      });
                    }
                } else {
                // check if there are any new images for upload
                if (req.file) {
                  try{
                    let fileToUpload = req.file;
                    let toUpload = 'avatar';
                    let dataForUploader = {user: user, file: fileToUpload, toUpload: toUpload};
                    cloudinaryUploader.send(dataForUploader);
                    } catch (error) {
                        req.flash('error', error.message);
                        return res.redirect('back');
                    }
                  }
                  if (process.env.NODE_ENV === 'production') {
                    const oldData = [ user.full_name, user.country, user.state, user.city, user.address1, user.address2, user.zip ];
                    const newData = [ req.body.name, req.body.country, req.body.state, req.body.city, req.body.address1, req.body.address2, req.body.zip ];
                    userLogger.info(`Message: User details changed\r\nOld Data: ${oldData}\r\nNew Data: ${newData}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);                    
                  }
                  user.full_name = filter.clean(cleanHTML(req.body.name));
                  if (user.country != req.body.country) {
                    user.country = filter.clean(cleanHTML(req.body.country));
                    await Product.updateMany({'author.id': user._id, 'available': 'True'}, { $set: {'author.country': user.country}});
                  }
                  if (user.state != req.body.state) {
                    user.state = filter.clean(cleanHTML(req.body.state));
                    await Product.updateMany({'author.id': user._id, 'available': 'True'}, { $set: {'author.state': user.state}});
                  }
                  if (user.city != req.body.city) {
                    user.city = filter.clean(cleanHTML(req.body.city));
                    await Product.updateMany({'author.id': user._id, 'available': 'True'}, { $set: {'author.city': user.city}});
                  }
                  Regions.forEach(asyncErrorHandler(async (region) => {
                    if ((user.country == region.country) && (user.continent != region.continent)) {
                      user.continent = region.continent;
                      await Product.updateMany({'author.id': user._id, 'available': 'True'}, { $set: {'author.continent': user.continent}});
                    }
                  }));
                  const products = await Product.find({'author.id': user._id, 'available': 'True'});
                  products.forEach(product => {
                    client.update({
                      index: 'products',
                      type: 'products',
                      id: `${product._id}`,
                      body: {
                        doc: {
                          author: product.author
                        }
                      }
                    })
                  });
                  user.address1 = filter.clean(cleanHTML(req.body.address1));
                  user.zip = filter.clean(cleanHTML(req.body.zip));
                  user.address2 = filter.clean(cleanHTML(req.body.address2));
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
                  req.flash('success', 'Successfully updated your profile - avatar will take a few seconds.');
                  return res.redirect(`/profile/${user._id}`);
                }
            }
        }));
  },
};
