/* eslint-disable camelcase */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-undef */

const cloudinary = require('cloudinary');
const ejs = require('ejs');
const path = require('path');
const Product = require('../models/product');
const User = require('../models/user');
const Deal = require('../models/deal');
const Subscription = require('../models/subscription');
const request = require("request");
const uuidv1 = require('uuid/v1');
const Checkout = require('../models/checkout');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

const EMAIL_USER = process.env.EMAIL_USER || 'k4nsyiavbcbmtcxx@ethereal.email';
const EMAIL_API_KEY = process.env.EMAIL_API_KEY || 'Mx2qnJcNKM5mp4nrG3';
const EMAIL_PORT = process.env.EMAIL_PORT || '587';
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.ethereal.email';

const SAVVY_SECRET = 'secf30f5f307df6c75bbd17b3043c1d81c5';

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

const Client = require('coinbase').Client;

const client = new Client({
  'apiKey': process.env.COINBASE_API_KEY,
  'apiSecret': process.env.COINBASE_API_SECRET,
});

const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  auth: {
      user: EMAIL_USER,
      pass: EMAIL_API_KEY,
  },
});

module.exports = {
  async getDashboardIndex(req, res) {
  let premium = await Subscription.findOne({userid: req.user._id}, (err, sub) => {
    if(err) {
      console.log('Failed to retrieve subscription.');
    }
  });
  if(premium) {
    premium = true;
  } else {
    premium = false;
  }
    res.render('dashboard/dashboard', { 
      user: req.user,
      premium: premium,
      errors: req.session.errors,
      csrfToken: req.cookies._csrf,
      csrfSecret: req.body.csrfSecret,
      pageTitle: 'Dashboard - Deal Your Crypto',
      pageDescription: 'Description',
      pageKeywords: 'Keywords'
    });
  },
  // Products Indexes
  async openProductIndex(req, res) {
    const products = await Product.paginate({ available: "True", 'author.id': req.user._id }, {
      page: req.query.page || 1,
      limit: 10,
    });
    products.page = Number(products.page);
    res.render('dashboard/dashboard_open', {
      products,
      user: req.user,
      csrfToken: req.body.csrfSecret,
      pageTitle: 'Open Deals - Deal Your Crypto',
      pageDescription: 'Description',
      pageKeywords: 'Keywords'
    });
  },
  async closedProductIndex(req, res) {
    const products = await Product.paginate({ available: "Closed", 'author.id': req.user._id }, {
      page: req.query.page || 1,
      limit: 10,
    });
    products.page = Number(products.page);
    res.render('dashboard/dashboard_closed', {
      products,
      user: req.user,
      pageTitle: 'Closed Deals - Deal Your Crypto',
      pageDescription: 'Description',
      pageKeywords: 'Keywords'
    });
  },
  async purchasedProductIndex(req, res) {
    const deals = await Deal.paginate({ 'buyer.id': req.user._id }, {
      page: req.query.page || 1,
      limit: 10,
    });
    deals.page = Number(deals.page);
    res.render('dashboard/dashboard_purchases', {
      deals,
      user: req.user,
      pageTitle: 'Purchases - Deal Your Crypto',
      pageDescription: 'Description',
      pageKeywords: 'Keywords'
    });
  },
  async ongoingProductIndex(req, res) {
    const deals = await Deal.paginate(
      {
        $and: [
          {
            $or: [
              {
                refundableUntil: {
                  $exists: true,
                  $gt: Date.now()
                }
              }, {
                refundableUntil: {
                  $exists: false
                }
              }
            ]
          }, {
            $or: [
              {
                'buyer.id': req.user._id
              }, {
                'product.author.id': req.user._id
              }
            ]
          }, {
            status: {
              $nin: ['Cancelled', 'Refunded', 'Declined']
            }
          }
        ]
      }, {
        page: req.query.page || 1,
        limit: 10,
      }
    );
    deals.page = Number(deals.page);
    res.render('dashboard/dashboard_ongoing', { 
      deals,
      user: req.user,
      csrfToken: req.body.csrfSecret,
      pageTitle: 'Ongoing Deals - Deal Your Crypto',
      pageDescription: 'Description',
      pageKeywords: 'Keywords'
    });
  },
  // Show address page
  async getAddresses(req, res) {
    var url = "https://api.savvy.io/v3/currencies?token=" + SAVVY_SECRET;
    request(url, async function (error, response, body){
      if (!error && response.statusCode == 200) {
        var json = JSON.parse(body);
        var data = json.data;
        var btcrate = data.btc.rate;
        var maxConfirmationsBTC = data.btc.maxConfirmations;
        const dealsSold = await Deal.find({'product.author.id': req.user._id, status: 'Completed'});
        const dealsBought = await Deal.find({'buyer.id': req.user._id, status: 'Completed'});
        res.render('dashboard/dashboard_addr', { 
          user: req.user,
          btcrate,
          maxConfirmationsBTC,
          errors: false,
          dealsSold,
          dealsBought,
          csrfToken: req.body.csrfSecret,
          pageTitle: 'Addresses - Deal Your Crypto',
          pageDescription: 'Description',
          pageKeywords: 'Keywords'
        });
      }
    });
  },
  async savvyStatus(req, res) {
    var orderId = req.params.order;
    var confirmations = null;
      
    var confirmations1 = await Checkout.findOne({orderId: orderId}, '-_id confirmations', function(err, confirmations) { 
      if(err) {
        res.send(err)
      }
    }); //get from DB, see callback.js
    var maxConfirmations1 = await Checkout.findOne({orderId: orderId}, '-_id maxConfirmations', function(err, maxConfirmations) { 
      if(err) {
        res.send(err)
      }
    }); //get from DB, see callback.js
    
    confirmations = confirmations1.confirmations;
    maxConfirmations = maxConfirmations1.maxConfirmations;
    
    console.log('----------------------');
    console.log(confirmations);
    console.log(maxConfirmations);
    console.log('----------------------');
    
    var resp = {
      success: confirmations >= maxConfirmations
    };
    if(confirmations !== null)
      resp.confirmations = confirmations;
    res.json(resp); //return this data to savvy form
  },
  getBTC(req, res) {
    var url = "https://api.savvy.io/v3/currencies?token=" + SAVVY_SECRET;
    request(url, function(error, response, body){
      if(!error && response.statusCode == 200) {
        var json = JSON.parse(body);
        var data = json.data;
        var btcrate = data.btc.rate;
        var maxConfirmationsBTC = data.btc.maxConfirmations;
        res.render('savvy/btc', { 
          btcrate, 
          user: req.user,
          maxConfirmationsBTC,
          csrfToken: req.body.csrfSecret,
          pageTitle: 'Deposit Bitcoin - Deal Your Crypto',
          pageDescription: 'Description',
          pageKeywords: 'Keywords'
        });
      }
    });
  },
  postBTC(req, res) {
    var orderId = uuidv1();
    var callback = 'https://dyc.herokuapp.com/savvy/callback/' + orderId;
    var encoded_callback = encodeURIComponent(callback);
    console.log(encoded_callback);
    var url = "https://api.savvy.io/v3/btc/payment/" + encoded_callback + "?token=" + SAVVY_SECRET + "&lock_address_timeout=3600";
    var btcrate = req.body.btcrate;
    var maxConfirmationsBTC = req.body.maxConfirmationsBTC;
    var coinsValue = req.body.coinsValue;
    request.get({
      url: url 
    }, function(error, response, body) {
      if(error) {
        req.flash('error', error.message);
        res.redirect('back');
      } else {
        console.log(body);
        var json = JSON.parse(body);
        var invoice = json.data.invoice;
        var address = json.data.address;
        console.log(invoice);
        console.log(address);
        Checkout.create({
          user: req.user,
          invoice: invoice,
          coin: 'BTC',
          address: address,
          orderId: orderId,
          confirmations: 0,
          maxConfirmations: maxConfirmationsBTC,
          orderTotal: coinsValue,
          paid: false
        }, (err) => {
          if(err) {
            req.flash('error', err.message);
            res.redirect('back');
          } else {
            console.log(orderId);
            res.render('savvy/btc', { 
              btcrate, 
              orderId, 
              address, 
              coinsValue, 
              maxConfirmationsBTC,
              user: req.user,
              csrfToken: req.body.csrfSecret,
              pageTitle: 'Deposit Bitcoin - Deal Your Crypto',
              pageDescription: 'Description',
              pageKeywords: 'Keywords'
            })
          }
        });
      }
    });
  },
  // Get address modifications
  async addAddresses(req, res) {
    const query = { _id: req.user._id };
    req.check('btcadr', 'The address must be alphanumeric').matches(/^[a-zA-Z0-9]+$/g).notEmpty();
    req.check('btcadr', 'Invalid address format').isLength({ min: 26, max: 80 });
    const errors = req.validationErrors();
    if (errors) {
      var url = "https://api.savvy.io/v3/currencies?token=" + SAVVY_SECRET;
      request(url, function(error, response, body){
        if(!error && response.statusCode == 200) {
          var json = JSON.parse(body);
          var data = json.data;
          var btcrate = data.btc.rate;
          var maxConfirmationsBTC = data.btc.maxConfirmations;
          res.render('dashboard/dashboard_addr', 
            { 
              user: req.user,
              btcrate,
              maxConfirmationsBTC,
              errors,
              csrfToken: req.body.csrfSecret,
              pageTitle: 'Addresses - Deal Your Crypto',
              pageDescription: 'Description',
              pageKeywords: 'Keywords'
            });
        }
      });
    } else {
      const name = req.body.btcadr;
      if (name === req.body.btcadr) {
        await User.findByIdAndUpdate(query, { btcadr: name }, (err) => {
          if (err) {
            req.flash('error', err.message);
          } else {
            req.flash('success', 'Successfully updated address!');
            res.redirect('/dashboard/addresses');
          }
        });
      }
    }
  },
  //Withdraw BTC from Coinbase
  async withdraw(req, res) {
    var address = req.body.address;
    var amount = Number(req.body.value) + 0.00005000;
    console.log(req.body.value);
    console.log(amount);
    client.getAccount('primary', function(err, account) {
      if(err) {
        req.flash('error', 'There was a problem with your request, please try again.');
        res.redirect('back');
      } else {
        if(req.user.btcbalance >= amount) {
          account.sendMoney(
            {
              'to': address,
              'amount': amount,
              'currency': 'BTC'
            }, function(err, tx) {
              if(err) {
                req.flash('error', 'There was an error withdrawing, please contact us immediately about this.');
                res.redirect('back');
              } else {
                console.log(tx);
                var query_btc = User.findByIdAndUpdate({ _id: req.user._id }, { $inc: { btcbalance: -amount } });
                query_btc.then(function(doc) {
                  const withdrawal = {
                    amount,
                    sentTo: address
                  };
                  query_btc.withdrawal.push(withdrawal);
                  query_btc.save();
                  ejs.renderFile(path.join(__dirname, "../views/email_templates/withdraw.ejs"), {
                    link: `http://${req.headers.host}/dashboard/address`,
                    amount: amount,
                    address: address,
                    subject: 'Withdraw request success - Deal Your Crypto',
                  }, function (err, data) {
                    if (err) {
                        console.log(err);
                    } else {
                      const mailOptions = {
                          from: `Deal Your Crypto <noreply@dyc.com>`,
                          to: `${user.email}`,
                          subject: 'Currency withdrawn successfully',
                          html: data,
                      };
                      transporter.sendMail(mailOptions, (error) => {
                          if (error) {
                          console.log(error);
                          }
                          req.flash('success', `Successfully withdrawn ${amount} BTC!`);
                          res.redirect('back');
                          console.log(`Withdrawn ${amount} BTC successfully.`);
                      });
                    }
                  });
                });
              }
            }
          );
        } else {
          req.flash('error', `Insufficient funds to withdraw.`);
          res.redirect('back');
        }
      }
    });
  },
  //Displays available pairs for BTC
  async CoinSwitchPair(req, res) {
    var options = { 
      method: 'POST',
      url: 'https://api.coinswitch.co/v2/pairs',
      headers: 
     { 
       'x-user-ip': '1.1.1.1',
       'x-api-key': 'cRbHFJTlL6aSfZ0K2q7nj6MgV5Ih4hbA2fUG0ueO',
       'content-type': 'application/json' 
     },
      body: '{"destinationCoin":"btc"}' 
    };
  
    request(options, function (error, response, body) {
      if(!error && response.statusCode == 200) {
        var json = JSON.parse(body);
        var data = json.data;
        console.log(data);
        //Add Check for isActive: true
        res.send(data);
      }
    });
  },
  //Checks rate for a pair
  async CoinSwitchRate(req, res) {
    console.log(req.body.counter);
    const deposit = req.body.counter;
    var options = { 
      method: 'POST',
      url: 'https://api.coinswitch.co/v2/rate',
      headers:
     { 
       'x-user-ip': '1.1.1.1',
       'x-api-key': 'cRbHFJTlL6aSfZ0K2q7nj6MgV5Ih4hbA2fUG0ueO',
       'content-type': 'application/json' 
     },
      body: `{"depositCoin":"${deposit}","destinationCoin":"btc"}` 
    };
  
    request(options, function (error, response, body) {
      if(!error && response.statusCode == 200) {
        var json = JSON.parse(body);
        var data = json.data;
        console.log(data);
        //Add Check for isActive: true
        res.send(data);
      }
    });
  },
  //Route to start an order on CoinSwitch
  async CoinSwitchDeposit(req, res) {
    console.log(req.body);
    const deposit = req.body.deposit;
    const amount = req.body.amount;
    const refund = req.body.refund;
    const user = req.body.user;
    const coin = req.body.depositCoin;
    var options = { 
      method: 'POST',
      url: 'https://api.coinswitch.co/v2/order',
      headers: 
    { 
      'x-user-ip': '1.1.1.1',
      'x-api-key': 'cRbHFJTlL6aSfZ0K2q7nj6MgV5Ih4hbA2fUG0ueO',
      'content-type': 'application/json' 
    },
      body: `{"depositCoin":"${deposit}","destinationCoin":"btc","depositCoinAmount":"${amount}","destinationAddress":{"address": "3HatjfqQM2gcCsLQ5ueDCKxxUbyYLzi9mp"},"refundAddress":{"address": "${refund}"}}` 
    };
  
    request(options, function (error, response, body) {
      if(!error && response.statusCode == 200) {
        console.log(body);
        var json = JSON.parse(body);
        var data = json.data;
        Checkout.create({
          user: user.username,
          coin: coin,
          address: data.exchangeAddress.address,
          orderId: data.orderId,
        }, (err) => {
          if(err) {
            res.send(err);
          } else {
            console.log('created deposit')
            res.send(data);
          }
        });
      }
    });
  },
  //Get request to check order status, hit on final step
  async CoinSwitchStatus(req, res) {
    console.log(req.body);
    const orderId = req.body.orderId;
    var options = { 
      method: 'GET',
      url: `https://api.coinswitch.co/v2/order/${orderId}`,
      headers: 
    { 
      'x-user-ip': '1.1.1.1',
      'x-api-key': 'cRbHFJTlL6aSfZ0K2q7nj6MgV5Ih4hbA2fUG0ueO'
    }
    };
    request(options, function (error, response, body) {
      if(!error && response.statusCode == 200) {
        console.log(body);
        var json = JSON.parse(body);
        var data = json.data;
        res.send(data);
      }
    });
  },
  // Polls server every minute to check for status of order
  async CoinSwitchPoll(req, res) {
    console.log(req.body);
    const orderId = req.body.orderId;
    var options = { 
      method: 'GET',
      url: `https://api.coinswitch.co/v2/order/${orderId}`,
      headers: 
    { 
      'x-user-ip': '1.1.1.1',
      'x-api-key': 'cRbHFJTlL6aSfZ0K2q7nj6MgV5Ih4hbA2fUG0ueO',
      "Content-Type": "application/json",
      Accept: 'application/json'
    }
    };
    // Down code needs testing before production
    var i = setInterval(function() {
      request(options, function (error, response, body) {
        if(!error && response.statusCode == 200) {
          console.log(body);
          var json = JSON.parse(body);
          var data = json.data;
          if(data.status === 'complete') {
            var query_2 = Checkout.findOne({ orderId: orderId });
            query_2.exec(function(err, checkout) {
              if(err) {
                res.send('error');
              }
              if(checkout !== null) {
                var user = checkout.user;
                var query_btc = User.findByIdAndUpdate({ _id: user }, { $inc: { btcbalance: data.destinationCoinAmount } });
                query_btc.then(function(doc) {
                  console.log("Deposit arrived!");
                  var query_1 = Checkout.findOneAndUpdate({ orderId: orderId }, {paid: true});
                  query_1.then(function(doc2) {
                    console.log("Checkout updated to paid!");
                    clearInterval(i);
                  });
                });
              }
            });
          }
        }
      });
    }, 1000 * 60);
  },
  // Get tokens page
  async getTokens(req, res) {
    var url = "https://api.savvy.io/v3/currencies?token=" + SAVVY_SECRET;
    request(url, async function(error, response, body){
      if(!error && response.statusCode == 200) {
        var json = JSON.parse(body);
        var data = json.data;
        var btcrate = data.btc.rate;
        var tokenprice = 1/btcrate; // 5 USD
        res.render('dashboard/dashboard_tokens', { 
          user: req.user,
          btcrate,
          tokenprice,
          errors: req.session.errors,
          csrfToken: req.body.csrfSecret,
          pageTitle: 'Tokens - Deal Your Crypto',
          pageDescription: 'Description',
          pageKeywords: 'Keywords'
        });
      }
    });
  },
  // Buy Tokens
  async buyTokens(req, res) {
    req.check('tokensNr', 'The number of tokens must be an integer number.').matches(/^[0-9]+$/g).notEmpty();
    const errors = req.validationErrors();
    if (errors) {
        res.render('dashboard/dashboard_tokens', {
          user: req.user,
          btcrate,
          tokenprice,
          errors: errors,
          csrfToken: req.body.csrfSecret,
          pageTitle: 'Tokens - Deal Your Crypto',
          pageDescription: 'Description',
          pageKeywords: 'Keywords'
        });
      } else {
        const user = await User.findById(req.user._id);
        const tokens = Number(req.body.tokensNr);
        const tokenprice = Number(req.body.tokenprice);
        const totalPrice = tokens * tokenprice;
        if (user.btcbalance >= totalPrice) {
            user.btcbalance -= totalPrice;
            user.feature_tokens += tokens;
            user.markModified('currency');
            await user.save();
            req.flash('success', 'Tokens purchased successfully!');
            res.redirect('back');
        } else {
            req.flash('error', 'Insufficient balance.');
            res.redirect('back');
        }
    }
  },
  // Show new product form
  newProduct(req, res) {
    res.render('dashboard/dashboard_new', {
      user: req.user, 
      errors: req.session.errors,
      csrfToken: req.cookies._csrf,
      csrfSecret: req.body.csrfSecret,
      pageTitle: 'New Deal - Deal Your Crypto',
      pageDescription: 'Description',
      pageKeywords: 'Keywords'
    });
  },
  // Products New
  async productCreate(req, res) {
    if (req.files.length === 0){
      req.flash('error', 'You need to upload at least one image.');
      res.redirect('/dashboard/new');
    } else {
      req.body.product.images = [];
      for (const file of req.files) {
        const image = await cloudinary.v2.uploader.upload(file.path);
        req.body.product.images.push({
          url: image.secure_url,
          public_id: image.public_id,
        });
      }
      const tags = ["abcd"];
      const author = {
        id: req.user._id,
        username: req.user.username,
        name: req.user.full_name,
        city: req.user.city,
        state: req.user.state,
        country: req.user.country,
        continent: req.user.continent
      };
      req.body.product.author = author;
      // Look into which symbols are security threats - product name, product description
      req.check('product[name]', 'The name of the product must contain alphanumeric and ".", ",", "?", "!" characters.').matches(/^[a-zA-Z0-9 .,!?]+$/g).notEmpty();
      req.check('product[name]', 'The name of the product must be between 3 and 100 characters.').isLength({ min: 3, max: 100 });
      req.check('product[category][0]', 'Please choose a main category.').matches(/^[a-zA-Z& ]+$/g).notEmpty();
      req.check('product[category][1]', 'Please choose a secondary category.').matches(/^[a-zA-Z& ]+$/g).notEmpty();
      req.check('product[category][2]', 'Please choose a tertiary category.').matches(/^[a-zA-Z& ]+$/g).notEmpty();
      req.check('product[condition]', 'Please select a product condition.').matches(/^[a-zA-Z ]+$/g).notEmpty();
      req.check('product[description]', 'The product must have a valid description.').matches(/^[a-zA-Z0-9 .,!?]+$/g).notEmpty();
      req.check('product[repeatable]', 'Something went wrong. Please try again.').matches(/^(true|)$/g);
      req.check('product[btc_price]', 'You must input a price.').matches(/^[0-9.]+$/).notEmpty();
      const errors = req.validationErrors();
      if (errors) {
        res.render('dashboard/dashboard_new', {
          user: req.user,
          errors: errors,
          csrfToken: req.body.csrfSecret,
          pageTitle: 'New Deal - Deal Your Crypto',
          pageDescription: 'Description',
          pageKeywords: 'Keywords'
        });
      } else {
        const btcPrice=Number(req.body.product.btc_price);
        tags.push('btc');  
        const category = ['all', `${req.body.product.category[0]}`, `${req.body.product.category[1]}`, `${req.body.product.category[2]}`];
        const newproduct = {
          name: req.body.product.name,
          images: req.body.product.images,
          category,
          condition: req.body.product.condition,
          description: req.body.product.description,
          btcPrice,
          author,
          tags
        };
        if (req.body.product.repeatable === "true") {
          newproduct.repeatable = req.body.product.repeatable;
        }
        await User.findById(req.user._id, (err, user) => {
          if (err) {
            req.flash('error', 'An error has occured. (Could not find user)');
            res.redirect('back');
          } else {
            const feat_1 = {};
            const feat_2 = {};
            let k = 0;
            if ((req.body.product.feat_1) && ( req.body.product.feat_2 ) && ( k === 0 )) {
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
            if (( req.body.product.feat_1 ) && ( k === 0 )) {
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
            if (( req.body.product.feat_2 ) && ( k === 0 )) {
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
    res.render('products/product_view', { 
      product, 
      floorRating,
      csrfToken: req.body.csrfSecret,
      pageTitle: `${product.name} - Deal Your Crypto`,
      pageDescription: 'Description',
      pageKeywords: 'Keywords'
    });
  },
  // Products Edit
  async productEdit(req, res) {
    const product = await Product.findById(req.params.id);
    res.render('dashboard/dashboard_edit', { 
      product: product, 
      user: req.user, 
      errors: req.session.errors,
      csrfToken: req.cookies._csrf,
      csrfSecret: req.body.csrfSecret,
      pageTitle: `${product.name} - Deal Your Crypto`,
      pageDescription: 'Description',
      pageKeywords: 'Keywords'
    });
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
    req.check('product[name]', 'The name of the product must be alphanumeric.').matches(/^[a-zA-Z0-9 ]+$/i).notEmpty();
    req.check('product[name]', 'The name of the product must be between 3 and 100 characters.').isLength({ min: 3, max: 100 });
    req.check('product[category][0]', 'Please choose a main category.').matches(/^[a-zA-Z& ]+$/g).notEmpty();
    req.check('product[category][1]', 'Please choose a secondary category.').matches(/^[a-zA-Z& ]+$/g).notEmpty();
    req.check('product[category][2]', 'Please choose a tertiary category.').matches(/^[a-zA-Z& ]+$/g).notEmpty();
    req.check('product[condition]', 'Please select a product condition.').matches(/^[a-zA-Z ]+$/g).notEmpty();
    req.check('product[description]', 'The product must have a valid description.').matches(/^[a-zA-Z0-9 .,!?]+$/g).notEmpty();
    req.check('product[repeatable]', 'Something went wrong. Please try again.').matches(/^(true|)$/g);
    req.check('product[btc_price]', 'You must input a price.').matches(/^[0-9.]+$/g).notEmpty();
    const btcPrice = req.body.product.btc_price;
    if (product.tags.indexOf('btc') === -1) {
      product.tags.push('btc');
    } 
    const errors = req.validationErrors();
    if (errors) {
      res.render('dashboard/dashboard_edit', {
        user: req.user,
        errors: errors,
        product,
        csrfToken: req.body.csrfSecret,
        pageTitle: `${product.name} - Deal Your Crypto`,
        pageDescription: 'Description',
        pageKeywords: 'Keywords'
      });
    } else {
      if (req.body.product.repeatable === "true") {
        product.repeatable = req.body.product.repeatable;
      } else {
        product.repeatable = "false";
      }
      // Everything is stored in constants so we can protect against
      // people making fields in the DevTools
      // update the product with any new properties
      product.name = req.body.product.name;
      product.description = req.body.product.description;
      product.condition = req.body.product.condition;
      product.category[1] = req.body.product.category[0];
      product.category[2] = req.body.product.category[1];
      product.category[3] = req.body.product.category[2];
      product.btcPrice = btcPrice;
      // save the updated product into the db
      await product.save();
      // redirect to show page
      req.flash('success', 'Product updated successfully!');
      res.redirect(`/products/${product.id}/view`);
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
    product.unIndex((err) => {
      if (err) {
        console.log('Error while unindexing document.');
        console.log(err);
      } else {
        console.log('Document unindexed successfully.');
      }
    });
    await product.remove();
    req.flash('success', 'Product deleted successfully!');
    res.redirect('/dashboard/open');
  },
	// Subscription Create
	async subscriptionCreate(req, res) {
    let CurrentUser = await User.findById(req.params.id);
    Subscription.create({
      userid: CurrentUser._id,
      username: CurrentUser.username,
    }, (err, sub) => {
      if(err) {
        req.flash('error', err.message);
        return res.redirect('back');
      } else {
        req.flash('success', 'Subscription created successfully!');
        return res.redirect(`/dashboard`);
      }
    })
	},
	// Reviews Update
	async subscriptionCancel(req, res, next) {
    let CurrentUser = await User.findById(req.params.id);
    Subscription.findOneAndRemove({userid: CurrentUser}, (err) => {
      if(err) {
        req.flash('error', 'There was an error cancelling your subscription.');
        return res.redirect('back');
      } else {
        req.flash('success', 'Subscription cancelled successfully, we\'re sad to see you go!');
        return res.redirect('back');
      }
    });
  },
};
