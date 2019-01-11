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
        User.findById(req.params.id, async (err, user) => {
          if (err) {
            req.flash('error', err.message);
          } else {
            Product.find( { 'author.id' : user._id }, async (error, prod) => {
              if (error) {
                req.flash('error', error.message);
                res.redirect('back');
              } else {
                res.render('index/profile', { user: user, products: prod });
              }
            });
          }
        });
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
                user.full_name = req.body.name;
                user.country = req.body.country;
                user.state = req.body.state;
                user.city = req.body.city;
                user.address1 = req.body.address1;
                user.zip = req.body.zip;
                if (req.body.address2) {
                  user.address2 = req.body.address2;
                }
                user.save();
                res.redirect(`/profile/${user._id}`);
            }
        });
  },
};