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
const Withdraw = require('../models/withdrawRequests');
const Profit = require('../models/profit');
const Subscription = require('../models/subscription');
const SearchTerm = require('../models/searchTerm');
const request = require("request");
const uuidv1 = require('uuid/v1');
const Checkout = require('../models/checkout');
const nodemailer = require('nodemailer');
const moment = require('moment');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const { errorLogger, userLogger, productLogger } = require('../config/winston');
const { withdraw } = require('../config/withdraw');
const { createProfit } = require('../config/profit');

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
        errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message} - Failed to retrieve subscription\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
      }
    });
    if(premium) {
      let date = premium.expireDate;
      let dateObj = new Date(date);
      var momentObj = moment(dateObj);
      var expireDate = momentObj.format('MM-DD-YYYY');
      premium = true;
      res.render('dashboard/dashboard', { 
        user: req.user,
        premium: premium,
        expireDate: expireDate,
        errors: req.session.errors,
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
        premium: premium,
        errors: req.session.errors,
        csrfToken: req.cookies._csrf,
        csrfSecret: req.body.csrfSecret,
        pageTitle: 'Dashboard - Deal Your Crypto',
        pageDescription: 'Description',
        pageKeywords: 'Keywords'
      });
    }
  },
  // Products Indexes
  async openProductIndex(req, res) {
    const products = await Product.paginate({ available: "True", 'author.id': req.user._id }, {
      page: req.query.page || 1,
      limit: 10,
      sort: {createdAt: -1}
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
      sort: {createdAt: -1}
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
      sort: {createdAt: -1}
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
        sort: {createdAt: -1}
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
  async refundProductIndex(req, res) {
    const deals = await Deal.paginate(
      {
        $and: [
          {
            $or: [
              {
                'buyer.id': req.user._id
              }, {
                'product.author.id': req.user._id
              }
            ]
          }, {
            status: {
              $in: ['Processing Refund', 'Refunded', 'Refund denied', 'Refund Pending']
            }
          }
        ]
      }, {
        page: req.query.page || 1,
        limit: 10,
        sort: {createdAt: -1}
      }
    );
    deals.page = Number(deals.page);
    res.render('dashboard/dashboard_refunds', { 
      deals,
      user: req.user,
      csrfToken: req.body.csrfSecret,
      pageTitle: 'Refunded Deals - Deal Your Crypto',
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
        const dealsSold = await Deal.find({'product.author.id': req.user._id, status: 'Completed', createdAt: {$gte: new Date((new Date().getTime() - (30 * 24 * 60 * 60 * 1000)))}}).sort({createdAt: -1});
        const dealsBought = await Deal.find({'buyer.id': req.user._id, status: 'Completed', createdAt: {$gte: new Date((new Date().getTime() - (30 * 24 * 60 * 60 * 1000)))}}).sort({createdAt: -1});
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
        errorLogger.error(`Status: ${error.status || 500}\r\nMessage: ${error.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
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
            errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
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
    req.check('btcadr', 'Invalid address format').notEmpty().isLength({ min: 26, max: 80 });
    req.check('btcadr', 'The address must be alphanumeric').matches(/^[a-zA-Z0-9]+$/g);
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
            errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
            req.flash('error', 'Something went wrong. Please try again.');
            res.redirect('/dashboard/addresses');
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
    let CurrentUser = await User.findById(req.user._id);
    req.check('address', 'Invalid address format').notEmpty().isLength({ min: 26, max: 80 });
    req.check('address', 'The address must be alphanumeric').matches(/^[a-zA-Z0-9]+$/g);
    req.check('value', 'The value must be a number').notEmpty().isLength({max: 50}).isNumeric();
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
      const amount = Number(req.body.value) + 0.00005000;
      if (amount <= CurrentUser.btcbalance) {
        CurrentUser.btcbalance -= amount;
        await Withdraw.create({
          address: CurrentUser.btcadr,
          amount,
          withdrawDate: Date.now(),
          userID: CurrentUser._id,
          userEmail: CurrentUser.email,
          notify: CurrentUser.email_notifications.user
        });
        const withdrawal = {
          amount,
          sentTo: address
        };
        CurrentUser.withdrawal.push(withdrawal);
        await CurrentUser.save();
        if(CurrentUser.email_notifications.user === true) {
          ejs.renderFile(path.join(__dirname, "../views/email_templates/withdraw.ejs"), {
          link: `http://${req.headers.host}/dashboard/address`,
          footerlink: `http://${req.headers.host}/dashboard/notifications`,
          amount,
          address: CurrentUser.btcadr,
          subject: 'Withdraw request success - Deal Your Crypto',
        }, 
        function (err, data) {
            if (err) {
                console.log(err);
            } else {
                const mailOptions = {
                    from: `Deal Your Crypto <noreply@dyc.com>`,
                    to: `${CurrentUser.email}`,
                    subject: 'Currency withdrawn successfully',
                    html: data,
                };
                transporter.sendMail(mailOptions, (error) => {
                    if (error) {
                      console.log(error);
                      errorLogger.error(`Status: ${error.status || 500}\r\nMessage: ${error.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                    }
                    if (process.env.NODE_ENV === 'production') {
                      userLogger.info(`Message: User withdrawed ${amount} BTC\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                    }
                    req.flash('success', `${amount} BTC successfully requested for withdrawal!`);
                    res.redirect('back');
                    console.log(`Withdrawn ${amount} BTC successfully.`);
                });
            }
          });
        } else {
            req.flash('success', `${amount} BTC successfully requested for withdrawal!`);
            return res.redirect('back');
        }
        if (process.env.NODE_ENV == 'Production') {
          userLogger.info(`Message: Withdraw request for ${amount} BTC created\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
        }
        req.flash('success', 'Your withdrawal request has been registered.');
        res.redirect('back');
      } else {
        req.flash('error', 'Insufficient funds.');
        res.redirect('back');
      }
    }
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
        var tokenprice = 1/btcrate; // 1 USD
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
    req.check('tokensNr', 'The number of tokens must be an integer number.').notEmpty().isLength({ max: 500 }).matches(/^[0-9]+$/g);
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
        const url = "https://api.savvy.io/v3/currencies?token=" + SAVVY_SECRET;
        request(url, async function(error, response, body){
        if(!error && response.statusCode == 200) {
          const json = JSON.parse(body);
          const data = json.data;
          const btcrate = data.btc.rate;
          const tokenprice = 1/btcrate; // 1 USD
          const totalPrice = Number((tokens * tokenprice).toFixed(8));
          if (user.btcbalance >= totalPrice) {
              user.btcbalance -= totalPrice;
              user.feature_tokens += tokens;
              await user.save( err => {
                if (err) {
                  errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                  req.flash('error', 'Something went wrong when purchasing tokens. Please try again later.');
                  return res.redirect('back');
                } else {
                  // REQUIRES TESTING
                  // withdraw(req, totalPrice);
                  createProfit(req, totalPrice, 'Tokens');
                  if (process.env.NODE_ENV === 'production') {
                    userLogger.info(`Message: User spent ${totalPrice} to buy ${tokens} tokens\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                  }
                  req.flash('success', 'Tokens purchased successfully!');
                  res.redirect('back');
                }
              });
          } else {
              req.flash('error', 'Insufficient balance.');
              res.redirect('back');
          }
        }
      });
    }
  },
  // Buy Token Packs
  async buyTokenPacks(req, res) {
    const url = "https://api.savvy.io/v3/currencies?token=" + SAVVY_SECRET;
    request(url, async function(error, response, body){
      if(!error && response.statusCode == 200) {
        const json = JSON.parse(body);
        const data = json.data;
        const btcrate = data.btc.rate;
        const tokenprice = 1/btcrate; // 1 USD
        const tokens = Number(req.body.pack);
        if ([20, 40, 60, 100].includes(tokens)) {
          const tokenCost = tokens * tokenprice;
          let CurrentUser = await User.findById(req.params.id);
          if(CurrentUser.btcbalance >= tokenCost) {
            CurrentUser.btcbalance -= tokenCost;
            switch(tokens) {
              case 20: 
                CurrentUser.feature_tokens += tokens + 1.5;
                break;
              case 40:
                CurrentUser.feature_tokens += tokens + 3.5; 
                break;
              case 60: 
                CurrentUser.feature_tokens += tokens + 7;
                break;
              case 100: 
                CurrentUser.feature_tokens += tokens + 15;
                break;
              default: break;
            }
            await CurrentUser.save((err, result) => {
              if(err) {
                errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                req.flash('error', 'There was an error updating your balance, please try again.');
                return res.redirect('back');
              } else {
                if (process.env.NODE_ENV === 'production') {
                  userLogger.info(`Message: User spent ${tokenCost} to buy ${tokens} tokens pack\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                }
                // REQUIRES TESTING
                // withdraw(req, tokenCost);
                switch(tokens) {
                  case 20: 
                    req.flash('success', 'Successfully purchased the basic pack! Enjoy!');
                    break;
                  case 40:
                    req.flash('success', 'Successfully purchased the enthusiast pack! Enjoy!');
                    break;
                  case 60:
                    req.flash('success', 'Successfully purchased the visionary pack! Enjoy!');
                    break;
                  case 100:
                    req.flash('success', 'Successfully purchased the enterprise pack! Enjoy!');
                    break;
                  default: break;
                }
                return res.redirect(`back`);
              }
            });
          } else {
            req.flash('error', `Not enough balance, please add ${tokenCost.toFixed(8)} more.`);
            return res.redirect('/dashboard/addresses');
          }
        } else {
          req.flash('error', 'Something went wrong, please try again.');
          res.redirect('back');
        }
      }
    });
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
      // Look into which symbols are security threats - product name, product description
      req.check('product[name]', 'The name of the product contains invalid characters.').matches(/^[a-zA-Z0-9 .,!?]+$/g);
      req.check('product[name]', 'The name of the product must contain between 3 and 100 characters.').notEmpty().isLength({ min: 3, max: 100 });
      req.check('product[category][0]', 'Please choose a main category.').notEmpty().isLength({max: 100}).matches(/^[a-zA-Z& ]+$/g);
      req.check('product[category][1]', 'Please choose a secondary category.').notEmpty().isLength({max: 100}).matches(/^[a-zA-Z& ]+$/g);
      req.check('product[category][2]', 'Please choose a tertiary category.').notEmpty().isLength({max: 100}).matches(/^[a-zA-Z& ]+$/g);
      req.check('product[condition]', 'Please select a product condition.').notEmpty().isLength({max: 100}).matches(/^[a-zA-Z ]+$/g);
      req.check('product[description]', "The product's description contains invalid characters").matches(/^[a-zA-Z0-9 .,!?]+$/g);
      req.check('product[description]', 'The description must contain between 3 and 500 characters.').notEmpty().isLength({min: 3, max: 500});
      req.check('product[repeatable]', 'Something went wrong. Please try again.').isLength({ max: 500 }).matches(/^(true|)$/g);
      req.check('product[btc_price]', 'You must input a price.').matches(/^[0-9.]+$/);
      req.check('product[btc_price]', 'The price must have at most 30 characters.').notEmpty().isLength({max: 30});
      req.check('product[tags]', 'The tags must not contain special characters besides the hyphen (-)').matches(/^[a-z -]+$/gi);
      req.check('product[tags]', 'The tags must have a total maximum of 500 characters').isLength({ max: 500 });
      req.check('product[shipping]', 'Something went wrong. Please try again.').isLength({ max: 500 }).matches(/^(true|false)$/g);
      req.check('name', 'The name must be at least 3 characters long').notEmpty().isLength({ min: 3, max: 500 }).trim();
      req.check('name', 'The name must not contain any special characters besides the hyphen (-)').matches(/^[a-z0-9 -]+$/gi).trim();
      req.check('email', 'Please specify a valid email address').isEmail().normalizeEmail().isLength({ max: 500 })
      .trim();
      req.check('phone', 'Please specify a valid phone number').notEmpty().matches(/^[()0-9+ -]+$/g).isLength({ max: 500 })
      .trim();
      req.check('street1', 'Please input a valid address').notEmpty().matches(/^[a-z0-9., -]+$/gi).isLength({ max: 500 })
        .trim();
      req.check('city', 'The city name must not contain special characters besides the dot, hyphen and comma').notEmpty().matches(/^[a-z .\-,]+$/gi).isLength({ max: 500 })
        .trim();
      if(req.body.state) {
        req.check('state', 'The state name must not contain special characters besides the dot, hyphen and comma').notEmpty().matches(/^[a-z .\-,]+$/gi).isLength({ max: 500 })
          .trim();
      }
      req.check('country', 'The country name must not contain special characters besides the dot, hyphen and comma').notEmpty().matches(/^[a-z .\-,]+$/gi).isLength({ max: 500 })
        .trim();
      req.check('zip', 'The zip code must not contain special characters besides the dot, hyphen and comma').notEmpty().matches(/^[a-z0-9 .\-,]+$/gi).isLength({ max: 500 })
        .trim();
      req.check('parcel_length', 'Invalid parcel length.').notEmpty().isNumeric().isLength({ max: 500 });
      req.check('parcel_width', 'Invalid parcel width.').notEmpty().isNumeric().isLength({ max: 500 });
      req.check('parcel_height', 'Invalid parcel height.').notEmpty().isNumeric().isLength({ max: 500 });
      req.check('parcel_distance_unit', 'Invalid parcel distance unit.').notEmpty().isAlpha().isLength({ max: 500 });
      req.check('parcel_weight', 'Invalid parcel weight.').notEmpty().isNumeric().isLength({ max: 500 });
      req.check('parcel_weight_unit', 'Invalid parcel weight unit.').notEmpty().isAlpha().isLength({ max: 500 });
      if(req.body.dhl_express) {
        req.check('dhl_express', 'Something went wrong. Please try again.').isLength({ max: 500 }).matches(/^(true|)$/g);
      }
      if(req.body.usps) {
        req.check('usps', 'Something went wrong. Please try again.').isLength({ max: 500 }).matches(/^(true|)$/g);
      }
      if(req.body.sendle) {
        req.check('sendle', 'Something went wrong. Please try again.').isLength({ max: 500 }).matches(/^(true|)$/g);
      }
      if(req.body.parcelforce) {
        req.check('parcelforce', 'Something went wrong. Please try again.').isLength({ max: 500 }).matches(/^(true|)$/g);
      }
      if(req.body.deutsche_post) {
        req.check('deutsche_post', 'Something went wrong. Please try again.').isLength({ max: 500 }).matches(/^(true|)$/g);
      }
      if(req.body.couriersplease) {
        req.check('couriersplease', 'Something went wrong. Please try again.').isLength({ max: 500 }).matches(/^(true|)$/g);
      }
      if(req.body.fastway) {
        req.check('fastway', 'Something went wrong. Please try again.').isLength({ max: 500 }).matches(/^(true|)$/g);
      }
      const errors = req.validationErrors();
      if (errors) {
        res.render('dashboard/dashboard_new', {
          user: req.user,
          errors: errors,
          csrfToken: req.params._csrf,
          csrfSecret: req.params.csrfSecret,
          pageTitle: 'New Deal - Deal Your Crypto',
          pageDescription: 'Description',
          pageKeywords: 'Keywords'
        });
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
          name: req.user.full_name,
          city: req.user.city,
          state: req.user.state,
          country: req.user.country,
          continent: req.user.continent
        };
        req.body.product.author = author;
        const btcPrice=Number(req.body.product.btc_price);
        const category = ['all', `${req.body.product.category[0]}`, `${req.body.product.category[1]}`, `${req.body.product.category[2]}`];
        const tags = req.body.product.tags.trim().split(' ');
        const newproduct = {
          name: req.body.product.name,
          images: req.body.product.images,
          category,
          condition: req.body.product.condition,
          description: req.body.product.description,
          btcPrice,
          tags,
          searchableTags: req.body.product.tags,
          author
        };
        if (req.body.product.repeatable === "true") {
          newproduct.repeatable = req.body.product.repeatable;
        }
        if (req.body.product.shipping === 'true') {
          newproduct.delivery = {
            shipping: true,
            name: req.body.name,
            street1: req.body.street1,
            city: req.body.city,
            state: req.body.state,
            zip: req.body.zip,
            country: req.body.country,
            phone: req.body.phone,
            email: req.body.email,
          };
          newproduct.parcel = {
            parcel_length: req.body.parcel_length,
            parcel_width: req.body.parcel_width,
            parcel_height: req.body.parcel_height,
            parcel_distance_unit: req.body.parcel_distance_unit,
            parcel_weight: req.body.parcel_weight,
            parcel_weight_unit: req.body.parcel_weight_unit,
          };
          newproduct.carrier = {
            dhl_express: false,
            usps: false,
            sendle: false,
            parcelforce: false,
            deutsche_post: false,
            couriersplease: false,
            fastway: false,
          };
          if(req.body.dhl_express === 'true') {
            newproduct.carrier.dhl_express = true;
          }
          if(req.body.usps === 'true') {
            newproduct.carrier.usps = true;
          }
          if(req.body.deutsche_post === 'true') {
            newproduct.carrier.deutsche_post = true;
          }
          if(req.body.sendle === 'true') {
            newproduct.carrier.sendle = true;
          }
          if(req.body.parcelforce === 'true') {
            newproduct.carrier.parcelforce = true;
          }
          if(req.body.fastway === 'true') {
            newproduct.carrier.fastway = true;
          }
          if(req.body.couriersplease === 'true') {
            newproduct.carrier.couriersplease = true;
          }
        } else {
          newproduct.delivery = {
            shipping: false,
          }
        }
        await User.findById(req.user._id, (err, user) => {
          if (err) {
            errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
            req.flash('error', 'An error has occured. Please try again later');
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
                    errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
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
                    errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
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
                    errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
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
        if (process.env.NODE_ENV === 'production') {
          productLogger.info(`Message: A new product was created - ${product._id}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
        }
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
      pageKeywords: product.searchableTags
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
      pageKeywords: product.searchableTags
    });
  },
  // Products Update
  async productUpdate(req, res) {
    // find the product by id
    const product = await Product.findById(req.params.id);
    req.check('product[name]', 'The name of the product contains invalid characters.').matches(/^[a-zA-Z0-9 .,!?]+$/g);
    req.check('product[name]', 'The name of the product must contain between 3 and 100 characters.').notEmpty().isLength({ min: 3, max: 100 });
    req.check('product[category][0]', 'Please choose a main category.').notEmpty().isLength({max: 100}).matches(/^[a-zA-Z& ]+$/g);
    req.check('product[category][1]', 'Please choose a secondary category.').notEmpty().isLength({max: 100}).matches(/^[a-zA-Z& ]+$/g);
    req.check('product[category][2]', 'Please choose a tertiary category.').notEmpty().isLength({max: 100}).matches(/^[a-zA-Z& ]+$/g);
    req.check('product[condition]', 'Please select a product condition.').notEmpty().isLength({max: 100}).matches(/^[a-zA-Z ]+$/g);
    req.check('product[description]', "The product's description contains invalid characters").matches(/^[a-zA-Z0-9 .,!?]+$/g);
    req.check('product[description]', 'The description must contain between 3 and 500 characters.').notEmpty().isLength({min: 3, max: 500});
    req.check('product[repeatable]', 'Something went wrong. Please try again.').matches(/^(true|)$/g);
    req.check('product[btc_price]', 'You must input a price.').matches(/^[0-9.]+$/).notEmpty().isLength({ max: 500 });
    req.check('product[btc_price]', 'The price must have at most 30 characters.').isLength({max: 30});
    req.check('product[tags]', 'The tags must not contain special characters besides the hyphen (-)').matches(/^[a-z -]+$/gi);
    req.check('product[tags]', 'The tags must have a total maximum of 500 characters').isLength({ max: 500 });
    req.check('deletedImages', 'Something went wrong. Please try again.').isLength({max: 2000}).matches(/(^[a-z0-9 ]+$|)/i);
    req.check('product[shipping]', 'Something went wrong. Please try again.').isLength({ max: 500 }).matches(/^(true|false)$/g);
    req.check('name', 'The name must be at least 3 characters long').notEmpty().isLength({ min: 3, max: 500 }).trim();
    req.check('name', 'The name must not contain any special characters besides the hyphen (-)').matches(/^[a-z -]+$/gi).trim();
    req.check('email', 'Please specify a valid email address').isEmail().normalizeEmail().isLength({ max: 500 })
    .trim();
    req.check('phone', 'Please specify a valid phone number').notEmpty().matches(/^[()0-9+ -]+$/g).isLength({ max: 500 })
    .trim();
    req.check('street1', 'Please input a valid address').notEmpty().matches(/^[a-z0-9., -]+$/gi).isLength({ max: 500 })
      .trim();
    req.check('city', 'The city name must not contain special characters besides the dot, hyphen and comma').notEmpty().matches(/^[a-z .\-,]+$/gi).isLength({ max: 500 })
      .trim();
    if(req.body.state) {
      req.check('state', 'The state name must not contain special characters besides the dot, hyphen and comma').notEmpty().matches(/^[a-z .\-,]+$/gi).isLength({ max: 500 })
        .trim();
    }
    req.check('country', 'The country name must not contain special characters besides the dot, hyphen and comma').notEmpty().matches(/^[a-z .\-,]+$/gi).isLength({ max: 500 })
      .trim();
    req.check('zip', 'The zip code must not contain special characters besides the dot, hyphen and comma').notEmpty().matches(/^[a-z0-9 .\-,]+$/gi).isLength({ max: 500 })
      .trim();
    req.check('parcel_length', 'Invalid parcel length.').notEmpty().isNumeric().isLength({ max: 500 });
    req.check('parcel_width', 'Invalid parcel width.').notEmpty().isNumeric().isLength({ max: 500 });
    req.check('parcel_height', 'Invalid parcel height.').notEmpty().isNumeric().isLength({ max: 500 });
    req.check('parcel_distance_unit', 'Invalid parcel distance unit.').notEmpty().isAlpha().isLength({ max: 500 });
    req.check('parcel_weight', 'Invalid parcel weight.').notEmpty().isNumeric().isLength({ max: 500 });
    req.check('parcel_weight_unit', 'Invalid parcel weight unit.').notEmpty().isAlpha().isLength({ max: 500 });
    if(req.body.dhl_express) {
      req.check('dhl_express', 'Something went wrong. Please try again.').isLength({ max: 500 }).matches(/^(true|)$/g);
    }
    if(req.body.usps) {
      req.check('usps', 'Something went wrong. Please try again.').isLength({ max: 500 }).matches(/^(true|)$/g);
    }
    if(req.body.sendle) {
      req.check('sendle', 'Something went wrong. Please try again.').isLength({ max: 500 }).matches(/^(true|)$/g);
    }
    if(req.body.parcelforce) {
      req.check('parcelforce', 'Something went wrong. Please try again.').isLength({ max: 500 }).matches(/^(true|)$/g);
    }
    if(req.body.deutsche_post) {
      req.check('deutsche_post', 'Something went wrong. Please try again.').isLength({ max: 500 }).matches(/^(true|)$/g);
    }
    if(req.body.couriersplease) {
      req.check('couriersplease', 'Something went wrong. Please try again.').isLength({ max: 500 }).matches(/^(true|)$/g);
    }
    if(req.body.fastway) {
      req.check('fastway', 'Something went wrong. Please try again.').isLength({ max: 500 }).matches(/^(true|)$/g);
    }
    const errors = req.validationErrors();
    if (errors) {
      res.render('dashboard/dashboard_edit', {
        user: req.user,
        errors: errors,
        product,
        csrfToken: req.params._csrf,
        csrfSecret: req.params.csrfSecret,
        pageTitle: `${product.name} - Deal Your Crypto`,
        pageDescription: 'Description',
        pageKeywords: 'Keywords'
      });
    } else {
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

      let deleteImages;
      // check if there are images to delete
      if (req.body.deleteImages.length) {
        deleteImages = req.body.deleteImages.trim().split(' ');
        if (deleteImages.length >= product.images.length) {
          req.flash('error', 'The product must have at least one image.');
          return res.redirect('back');
        }
        for (const public_id of deleteImages) {
          // delete images from cloudinary
          await cloudinary.v2.uploader.destroy(public_id, (err) => {
            if (err) {
              errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
              req.flash('error', 'A problem has occured. Please try again later.');
              return res.redirect('back');
            }
          });
          // delete images from DB
          for (const image of product.images) {
            if (image.public_id === public_id) {
              product.images.splice(product.images.indexOf(image), 1);
            }
          }
        }
      }

      const btcPrice = Number(req.body.product.btc_price);
      if (req.body.product.repeatable === "true") {
        product.repeatable = req.body.product.repeatable;
      } else {
        product.repeatable = "false";
      }
      if (req.body.product.shipping === 'true') {
        product.delivery = {
          shipping: true,
          name: req.body.name,
          street1: req.body.street1,
          city: req.body.city,
          state: req.body.state,
          zip: req.body.zip,
          country: req.body.country,
          phone: req.body.phone,
          email: req.body.email,
        };
        product.parcel = {
          parcel_length: req.body.parcel_length,
          parcel_width: req.body.parcel_width,
          parcel_height: req.body.parcel_height,
          parcel_distance_unit: req.body.parcel_distance_unit,
          parcel_weight: req.body.parcel_weight,
          parcel_weight_unit: req.body.parcel_weight_unit,
        };
        product.carrier = {
          dhl_express: false,
          usps: false,
          sendle: false,
          parcelforce: false,
          deutsche_post: false,
          couriersplease: false,
          fastway: false,
        };
        if(req.body.dhl_express === 'true') {
          product.carrier.dhl_express = true;
        }
        if(req.body.usps === 'true') {
          product.carrier.usps = true;
        }
        if(req.body.deutsche_post === 'true') {
          product.carrier.deutsche_post = true;
        }
        if(req.body.sendle === 'true') {
          product.carrier.sendle = true;
        }
        if(req.body.parcelforce === 'true') {
          product.carrier.parcelforce = true;
        }
        if(req.body.fastway === 'true') {
          product.carrier.fastway = true;
        }
        if(req.body.couriersplease === 'true') {
          product.carrier.couriersplease = true;
        }
      } else {
        product.delivery = {
          shipping: false,
        }
        product.parcel = {};
        product.carrier = {};
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
      const tags = req.body.product.tags.trim().split(' ');
      product.tags = tags;
      product.searchableTags = req.body.product.tags;
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
            errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
            req.flash('error', 'An error has occured. Please try again later');
            res.redirect('back');
          } else {
            if ( user.feature_tokens >= 5 ) {
              product.feat_1.status = true;
              product.feat_1.expiry_date = Date.now() + feature1_time;
              User.findByIdAndUpdate(req.user._id, { $inc: { feature_tokens: feature1_cost } }, (err) => {
                if (err) {
                  errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                }
              });
              product.save();
              req.flash('success', 'Your product has been promoted successfully.');
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
            errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
            req.flash('error', 'An error has occured. Please try again later');
            res.redirect('back');
          } else {
            if (user.feature_tokens >= 15) {
              product.feat_2.status = true;
              product.feat_2.expiry_date = Date.now() + feature2_time;
              User.findByIdAndUpdate(req.user._id, { $inc: { feature_tokens: feature2_cost } }, (err) => {
                if (err) {
                  errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                }
              });
              product.save();
              req.flash('success', 'Your product has been promoted successfully.');
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
    let deleteDate = new Date();
    deleteDate.setDate(deleteDate.getDate() + 30);
    await Product.findByIdAndUpdate(req.params.id, {$set: {'deleteIn30.status': true, 'deleteIn30.deleteDate': deleteDate, available: 'Deleted'}});
    req.flash('success', 'Product deleted successfully!');
    res.redirect('/dashboard/open');
  },
  // Subscription page with details
  async subscriptionPage(req, res) {
    let premium = await Subscription.findOne({userid: req.user._id}, (err, sub) => {
      if(err) {
        errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
        console.log('Failed to retrieve subscription.');
      }
    });
    if(premium) {
      premium = true;
    } else {
      premium = false;
    }
    var url = "https://api.savvy.io/v3/currencies?token=" + SAVVY_SECRET;
    request(url, async function(error, response, body){
      if(!error && response.statusCode == 200) {
        var json = JSON.parse(body);
        var data = json.data;
        var btcrate = data.btc.rate;
        var tokenprice = 1/btcrate; // 1 USD
      res.render('dashboard/subscription', { 
        user: req.user,
        premium: premium,
        tokenprice,
        errors: req.session.errors,
        csrfToken: req.body.csrfSecret,
        pageTitle: 'Subscription - Deal Your Crypto',
        pageDescription: 'Description',
        pageKeywords: 'Keywords'
      });
      }
    });
  },
    // Subscription cancel page with details
    async subscriptionCancelPage(req, res) {
      let premium = await Subscription.findOne({userid: req.user._id}, (err, sub) => {
        if(err) {
          errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
          console.log('Failed to retrieve subscription.');
        }
      });
      if(premium) {
        premium = true;
      } else {
        premium = false;
      }
        res.render('dashboard/subscription-cancel', { 
          user: req.user,
          premium: premium,
          errors: req.session.errors,
          pageTitle: 'Cancel Subscription - Deal Your Crypto',
          pageDescription: 'Description',
          pageKeywords: 'Keywords'
        });
    },
	// Subscription Create
	async subscriptionCreate(req, res) {
    let CurrentUser = await User.findById(req.params.id);
    // Get token price
    const url = "https://api.savvy.io/v3/currencies?token=" + SAVVY_SECRET;
    request(url, async function(error, response, body){
      if(!error && response.statusCode == 200) {
        const json = JSON.parse(body);
        const data = json.data;
        const btcrate = data.btc.rate;
        const tokenprice = 1/btcrate; // 1 USD
        let expireDate = moment().add(req.body.days,"days").toISOString();
        let days = Number(req.body.days);
        const today = Date.now();
        let subscriptionCost;
        switch (days) {
          case (30):
            // Calculate cost
            subscriptionCost = Number((tokenprice * 19.99).toFixed(5));
            if (CurrentUser.btcbalance >= subscriptionCost) {
              // Create subscription
              Subscription.create({
                userid: CurrentUser._id,
                username: CurrentUser.username,
                expireDate: expireDate,
                expires1: today,
              }, (err, sub) => {
                if(err) {
                  req.flash('error', err.message);
                  return res.redirect('back');
                } else {
                  // Update user's balances
                  User.findByIdAndUpdate({ _id: CurrentUser._id }, { $inc: { btcbalance: -subscriptionCost, feature_tokens: +5 }, $set: {subscription1: true} }, (err) => {
                    if(err) {
                      errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                      req.flash('error', 'There was an error updating your balance, please try again.');
                      return res.redirect('back');
                    } else {
                      console.log(`Successfully created sub for ${subscriptionCost} BTC cost.`);
                      userLogger.info(`Message: User subscribed for ${days} days, paid ${subscriptionCost}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                      // Sell BTC
                      // REQUIRES TESTING
                      // withdraw(req, subscriptionCost);
                      req.flash('success', 'Subscription created successfully!');
                      return res.redirect(`/dashboard`);
                    }
                  });
                }
              });
            } else {
              req.flash('error', `Not enough currency. You are ${subscriptionCost - CurrentUser.btcbalance} BTC short.`);
              return res.redirect('/dashboard/addresses');
            }
          break;
          case (90):
            subscriptionCost = Number((tokenprice * 56.99).toFixed(5));
            if (CurrentUser.btcbalance >= subscriptionCost) {
              Subscription.create({
                userid: CurrentUser._id,
                username: CurrentUser.username,
                expireDate: expireDate,
                expires2: today,
              }, (err, sub) => {
                if(err) {
                  errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                  req.flash('error', err.message);
                  return res.redirect('back');
                } else {
                  User.findByIdAndUpdate({ _id: CurrentUser._id }, { $inc: { btcbalance: -subscriptionCost, feature_tokens: +15 }, $set: {subscription3: true} }, (err) => {
                    if(err) {
                      errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                      req.flash('error', 'There was an error updating your balance, please try again.');
                      return res.redirect('back');
                    } else {
                      console.log(`Successfully created sub for ${subscriptionCost} BTC cost.`);
                      userLogger.info(`Message: User subscribed for ${days} days, paid ${subscriptionCost}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);                      
                      // REQUIRES TESTING
                      // withdraw(req, subscriptionCost);
                      req.flash('success', 'Subscription created successfully!');
                      return res.redirect(`/dashboard`);
                    }
                  });
                }
              });
            } else {
              req.flash('error', `Not enough currency. You are ${subscriptionCost - CurrentUser.btcbalance} BTC short.`);
              return res.redirect('/dashboard/addresses');
            }
          break;
          case (180):
            subscriptionCost = Number((tokenprice * 107.99).toFixed(5));
            if (CurrentUser.btcbalance >= subscriptionCost) {
              Subscription.create({
                userid: CurrentUser._id,
                username: CurrentUser.username,
                expireDate: expireDate,
                expires3: today,
              }, (err, sub) => {
                if(err) {
                  errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                  req.flash('error', err.message);
                  return res.redirect('back');
                } else {
                  User.findByIdAndUpdate({ _id: CurrentUser._id }, { $inc: { btcbalance: -subscriptionCost, feature_tokens: +30 }, $set: {subscription6: true} }, (err) => {
                    if(err) {
                      errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                      req.flash('error', 'There was an error updating your balance, please try again.');
                      return res.redirect('back');
                    } else {
                      console.log(`Successfully created sub for ${subscriptionCost} BTC cost.`);
                      userLogger.info(`Message: User subscribed for ${days} days, paid ${subscriptionCost}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                      // REQUIRES TESTING
                      // withdraw(req, subscriptionCost);
                      req.flash('success', 'Subscription created successfully!');
                      return res.redirect(`/dashboard`);
                    }
                  });
                }
              });
            } else {
              req.flash('error', `Not enough currency. You are ${subscriptionCost - CurrentUser.btcbalance} BTC short.`);
              return res.redirect('/dashboard/addresses');
            }
          break;
          case (360):
            subscriptionCost = Number((tokenprice * 203.99).toFixed(5));
            if (CurrentUser.btcbalance >= subscriptionCost) {
              Subscription.create({
                userid: CurrentUser._id,
                username: CurrentUser.username,
                expireDate: expireDate,
                expires4: today,
              }, (err, sub) => {
                if(err) {
                  errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                  req.flash('error', err.message);
                  return res.redirect('back');
                } else {
                  User.findByIdAndUpdate({ _id: CurrentUser._id }, { $inc: { btcbalance: -subscriptionCost, feature_tokens: +60 }, $set: {subscription12: true} }, (err) => {
                    if(err) {
                      errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                      req.flash('error', 'There was an error updating your balance, please try again.');
                      return res.redirect('back');
                    } else {
                      console.log(`Successfully created sub for ${subscriptionCost} BTC cost.`);
                      userLogger.info(`Message: User subscribed for ${days} days, paid ${subscriptionCost}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                      // REQUIRES TESTING
                      // withdraw(req, subscriptionCost);
                      req.flash('success', 'Subscription created successfully!');
                      return res.redirect(`/dashboard`);
                    }
                  });
                }
              });
            } else {
              req.flash('error', `Not enough currency. You are ${subscriptionCost - CurrentUser.btcbalance} BTC short.`);
              return res.redirect('/dashboard/addresses');
            }
          break;
          default:
          break;
        }
      }
    });
  },
	async subscriptionCancel(req, res, next) {
    await User.findByIdAndUpdate(req.user._id, {$set: {subscription1: false, subscription3: false, subscription6: false, subscription12: false}},err => {
      if (err) {
        errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
        req.flash('error', 'There was an error cancelling your subscription.');
        return res.redirect('back');
      } else {
        userLogger.info(`Message: Subscription cancelled\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
        req.flash('success', 'Subscription cancelled successfully, we\'re sad to see you go!');
        return res.redirect('back');
      }
    });
  },
  // Get premium page
  async getPremium(req, res) {
    const premium = await Subscription.find({userid: req.user._id}, (err) => {
      if (err) {
        errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
        req.flash('error', 'There was an error. Please try again.');
        return res.redirect('back');
      }
    });
    if (premium.length > 0) {
      const products = await Product.find({available: 'True', 'author.id': req.user._id}).select('_id name');
      res.render('dashboard/dashboard_premium', {
        user: req.user,
        products,
        premium: true,
        errors: req.session.errors,
        csrfToken: req.cookies._csrf,
        csrfSecret: req.body.csrfSecret,
        pageTitle: 'Premium - Deal Your Crypto',
        pageDescription: 'Description',
        pageKeywords: 'Keywords'
      });
    } else {
      const url = "https://api.savvy.io/v3/currencies?token=" + SAVVY_SECRET;
      request(url, async function(error, response, body){
      if(!error && response.statusCode == 200) {
        const json = JSON.parse(body);
        const data = json.data;
        const btcrate = data.btc.rate;
        const tokenprice = 1/btcrate; // 1 USD
        res.render('dashboard/dashboard_premium', {
          user: req.user,
          premium: false,
          tokenprice,
          errors: req.session.errors,
          csrfToken: req.cookies._csrf,
          csrfSecret: req.body.csrfSecret,
          pageTitle: 'Premium - Deal Your Crypto',
          pageDescription: 'Description',
          pageKeywords: 'Keywords'
        });
      }
    });
    }
  },
  async getSearchData(req, res) {
    req.check('firstCat').isLength({ min: 3, max: 500 }).matches(/^[a-z &]+$/ig);
    req.check('timeframe').isLength({ min: 1, max: 5 }).matches(/(7|14|30|90|All)/g);
    const errors = req.validationErrors();
    if (errors) {
      return res.send(errors);
    } else {
      let searchQueries = [];
      if ([7, 14, 30, 90].includes(Number(req.params.timeframe))) {
        if (req.params.firstCat === 'all') {
          searchQueries = await SearchTerm.find({createdAt: {$gte: new Date((new Date().getTime() - (req.params.timeframe * 24 * 60 * 60 * 1000)))}});        
        } else {
          searchQueries = await SearchTerm.find({'queryFilters.category': req.params.firstCat, createdAt: {$gte: new Date((new Date().getTime() - (req.params.timeframe * 24 * 60 * 60 * 1000)))}});
        }
      } else {
        if (req.params.firstCat === 'all') {
          searchQueries = await SearchTerm.find({});        
        } else {
          searchQueries = await SearchTerm.find({'queryFilters.category': req.params.firstCat});
        }
      }
      let result = {};
      if (req.params.firstCat === 'all') {
        result = _.countBy(searchQueries, function(obj){
          return obj.queryFilters.category.replace('all', 'No subcategory');
        }); 
      } else {
        result = _.countBy(searchQueries, function(obj) {
          return obj.queryFilters.secondCategory;
        });
        delete Object.assign(result, {[`${req.params.firstCat}`]: result[undefined] })[undefined]; 
      }
      return res.send(result);
    }
  },
  async getProductData(req, res) {
    req.check('firstCat').isLength({ min: 3, max: 500 }).matches(/^[a-z &]+$/ig);
    req.check('timeframe').isLength({ min: 1, max: 5 }).matches(/(7|14|30|90|All)/g);
    const errors = req.validationErrors();
    if (errors) {
      return res.send(errors);
    } else {
      let products = {};
      if ([7, 14, 30, 90].includes(Number(req.params.timeframe))) {
        if (req.params.firstCat == 'all') {
          products = await Product.find({'author.id': req.user._id, createdAt: {$gte: new Date((new Date().getTime() - (req.params.timeframe * 24 * 60 * 60 * 1000)))}}).select('name views');
        } else {
          products = await Product.find({'author.id': req.user._id, 'category.1': req.params.firstCat, createdAt: {$gte: new Date((new Date().getTime() - (req.params.timeframe * 24 * 60 * 60 * 1000)))}}).select('name views');
        }
      } else {
        if (req.params.firstCat == 'all') {
          products = await Product.find({'author.id': req.user._id}).select('name views');
        } else {
          products = await Product.find({'author.id': req.user._id, 'category.1': req.params.firstCat}).select('name views');
        }
      }
      const result = Object.assign({}, ...(products.map(item => ({ [item.name]: item.views }) )));
      return res.send(result);
    }
  },
  async getProductSoldData(req, res) {
    req.check('firstCat').isLength({ min: 3, max: 500 }).matches(/^[a-z &]+$/ig);
    req.check('timeframe').isLength({ min: 1, max: 5 }).matches(/(7|14|30|90|All)/g);
    const errors = req.validationErrors();
    if (errors) {
      return res.send(errors);
    } else {
      let products = {};
      if ([7, 14, 30, 90].includes(Number(req.params.timeframe))) {
        if (req.params.firstCat == 'all') {
          products = await Product.find({'author.id': req.user._id, createdAt: {$gte: new Date((new Date().getTime() - (req.params.timeframe * 24 * 60 * 60 * 1000)))}}).select('name nrBought');
        } else {
          products = await Product.find({'author.id': req.user._id, 'category.1': req.params.firstCat, createdAt: {$gte: new Date((new Date().getTime() - (req.params.timeframe * 24 * 60 * 60 * 1000)))}}).select('name nrBought');
        }
      } else {
        if (req.params.firstCat == 'all') {
          products = await Product.find({'author.id': req.user._id}).select('name nrBought');
        } else {
          products = await Product.find({'author.id': req.user._id, 'category.1': req.params.firstCat}).select('name nrBought');
        }
      }
      const result = Object.assign({}, ...(products.map(item => ({ [item.name]: item.nrBought }) )));
      return res.send(result);
    }
  },
  async getNotifications(req, res) {
    res.render('dashboard/dashboard_notifications', {
      user: req.user,
      pageTitle: 'Notifications - Deal Your Crypto',
      pageDescription: 'Description',
      pageKeywords: 'Keywords'
    });
  },
  async postNotifications(req, res) {
    const notif = req.body.name;
    let CurrentUser = await User.findById(req.params.id);
    switch(notif) {
      case 'deal':
        if(CurrentUser.email_notifications.deal === true) {
          CurrentUser.email_notifications.deal = false;
        } else {
          CurrentUser.email_notifications.deal = true;
        }
        break;
      case 'message':
        if(CurrentUser.email_notifications.message === true) {
          CurrentUser.email_notifications.message = false;
        } else {
          CurrentUser.email_notifications.message = true;
        }
        break;
      case 'user':
        if(CurrentUser.email_notifications.user === true) {
          CurrentUser.email_notifications.user = false;
        } else {
          CurrentUser.email_notifications.user = true;
        }
        break;
      default: break;
    }
    await CurrentUser.save((err, result) => {
      if(err) {
        req.flash('error', 'There was an error updating your settings, please try again.');
        return res.redirect('back');
      } else {
        req.flash('success', 'Successfully updated your email notification settings.')
        return res.redirect('back');
      }
    })
  },
  async getProductViews(req, res) {
    req.check('product').notEmpty().isLength({ max: 500 }).matches(/^[a-zA-Z0-9 .,!?]+$/g);
    const errors = req.validationErrors();
    if (errors) {
      return req.send(errors);
    } else {
      const product = await Product.findById(req.params.product);
      const oneWeek = 7 * 24 * 60 * 60 * 1000;
      let views = [0, 0, 0, 0];
      product.viewDates.forEach((view) => {
        const distance = (new Date()) - view;
        if (distance < oneWeek) {
          views[0] += 1;
        } else if ((distance > oneWeek) && (distance < 2 * oneWeek)) {
          views[1] += 1;
        } else if ((distance > 2 * oneWeek) && (distance < 3 * oneWeek)) {
          views[2] += 1;
        } else if ((distance > 3 * oneWeek) && (distance < 4 * oneWeek)) {
          views[3] += 1;
        }
      });
      const result = {
        'Three weeks ago': views[3],
        'Two weeks ago': views[2],
        'One week ago': views[1],
        'This week': views[0]
      };
      return res.send(result);
    }
  }
};
