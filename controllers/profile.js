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
      const floorRating = user.calculateAvgRating();
      const products = await Product.paginate({ available: true, 'author.id': req.params.id }, {
        page: req.query.page || 1,
        limit: 10,
      });
      products.page = Number(products.page);
      res.render('index/profile', { user, products, floorRating });
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
                req.check('name', 'Name must be between 3 and 20 letters.').matches(/^[a-z ]+$/i).notEmpty().isLength({ min: 3, max: 20 });
                req.check('country', 'Please select a country.').notEmpty();
                req.check('state', 'Please select a state.').notEmpty();
                req.check('city', 'Please select a city.').notEmpty();
                req.check('address1', 'Please input a valid first address.').matches(/^[a-z0-9 ]+$/i).notEmpty();
                req.check('zip', 'Please specify a numeric zip code.').notEmpty().isNumeric();
                // Check address2 as well eventually
                user.full_name = req.body.name;
                user.country = req.body.country;
                user.state = req.body.state;
                user.city = req.body.city;
                user.address1 = req.body.address1;
                user.zip = req.body.zip;
                if (req.body.address2) {
                  user.address2 = req.body.address2;
                }
                const errors = req.validationErrors();
                if (errors) {
                  res.render('dashboard/dashboard', {
                    user: req.user,
                    errors: errors,
                  });
                } else {
                user.save();
                res.redirect(`/profile/${user._id}`);
                }
            }
        });
  },
};