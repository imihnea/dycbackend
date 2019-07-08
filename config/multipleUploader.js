const mongoose = require('mongoose');
const moment = require('moment');
const { logger, errorLogger } = require('./winston');
const middleware = require('../middleware/index');
const { asyncErrorHandler } = middleware; // destructuring assignment
const cloudinary = require('cloudinary');
const Product = require('../models/product');
const User = require('../models/user');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

// Connect child to DB
mongoose.Promise = global.Promise;
const DATABASEURL = process.env.DATABASEURL || 'mongodb://localhost/DYC';
mongoose.set('useFindAndModify', false); // disables warnings
mongoose.set('useCreateIndex', true); // disables warnings
mongoose.connect(DATABASEURL, { useNewUrlParser: true });

logger.info(`Message: Multiple image uploader process started\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);

process.on('message', data => {
  if(data.toUpload === 'newProduct') {
      Product.findById({_id: data.product}, asyncErrorHandler(async (err, product) => {
          product.images = [];
          for (const file of data.files) {
            await cloudinary.v2.uploader.upload(file.path, 
              {
                moderation: "aws_rek:suggestive:ignore:explicit_nudity:0.95",
                transformation: [
                //   {quality: "jpegmini:1", sign_url: true},
                //   {width: "auto", dpr: "auto"}
                    {angle: 0},
                    {flags: 'progressive:semi'}
                  ]
              }, (err, result) => {
                if(err) {
                  errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nMethod: Uploading product picture\r\nProductId: ${data.product}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                } else if (result.moderation[0].status === 'rejected') {
                    req.body.product.images.push({
                      // replace with a 'picture contains nudity' or something
                      url: 'https://res.cloudinary.com/deal-your-crypto/image/upload/v1561981652/nudity_etvikx.png',
                      public_id: result.public_id,
                    });
                } else {
                  product.images.push({
                    url: result.secure_url,
                    public_id: result.public_id,
                  });
                }
              });
          }
          await product.save();
      }));
    } else if(data.toUpload === 'avatar') {
      User.findById({_id: data.user._id}, asyncErrorHandler(async (err, user) => {
        // delete old image
        if (user.avatar.public_id) {
            await cloudinary.v2.uploader.destroy(user.avatar.public_id, (err) => {
                if (err) {
                    errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nMethod: Updating user profile picture\r\nUserId: ${data.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                }
            });
        }
        // upload image
        await cloudinary.v2.uploader.upload(data.file.path, 
        {
            moderation: "aws_rek:suggestive:ignore:explicit_nudity:0.95",
            transformation: [
            //   {quality: "jpegmini:1", sign_url: true},
            //   {width: "auto", dpr: "auto"}
            {angle: 0},
            {flags: 'progressive:semi'}
            ]
        }, (err, result) => {
            if(err) {
                errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nMethod: Updating user profile picture\r\nUserId: ${data.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
            } else if (result.moderation[0].status === 'rejected') {
                user.avatar.url = 'https://res.cloudinary.com/deal-your-crypto/image/upload/v1561981652/nudity_etvikx.png';
                user.avatar.public_id = result.public_id;
            } else {
                user.avatar.url = result.secure_url;
                user.avatar.public_id = result.public_id;
            }
        });
        await user.save();
    }));
    } else if(data.toUpload === 'editProduct') {
      Product.findById({_id: data.product}, asyncErrorHandler(async (err, product) => {
        for (const file of data.files) {
          await cloudinary.v2.uploader.upload(file.path, 
            {
              moderation: "aws_rek:suggestive:ignore:explicit_nudity:0.95",
              transformation: [
              //   {quality: "jpegmini:1", sign_url: true},
              //   {width: "auto", dpr: "auto"}
              {angle: 0},
              {flags: 'progressive:semi'}
                ]
            }, (err, result) => {
              if(err) {
                errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nMethod: Uploading edit product pictures\r\nProductId: ${data.product}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
              } else if (result.moderation[0].status === 'rejected') {
                  product.images.push({
                    // replace with a 'picture contains nudity' or something
                    url: 'https://res.cloudinary.com/deal-your-crypto/image/upload/v1561981652/nudity_etvikx.png',
                    public_id: result.public_id,
                  });
              } else {
                product.images.push({
                  url: result.secure_url,
                  public_id: result.public_id,
                });
              }
            });
        }
        await product.save();
      }));
    }
});