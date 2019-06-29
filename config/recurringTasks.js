const User = require('../models/user');
const Deal = require('../models/deal');
const Chat = require('../models/chat');
const Subscription = require('../models/subscription');
const Product = require('../models/product');
const Notification = require('../models/notification');
const moment = require('moment');
const mongoose = require('mongoose');
const { logger, dealLogger, errorLogger, productLogger, userLogger } = require('./winston');
const { createProfit } = require('./profit');
const nodemailer = require('nodemailer');
const { deleteProduct } = require('./elasticsearch');
const cloudinary = require('cloudinary');
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
const request = require('request');

const Client = require('coinbase').Client;
const client = new Client({
  'apiKey': process.env.COINBASE_API_KEY,
  'apiSecret': process.env.COINBASE_API_SECRET,
});

const EMAIL_USER = process.env.EMAIL_USER || 'k4nsyiavbcbmtcxx@ethereal.email';
const EMAIL_API_KEY = process.env.EMAIL_API_KEY || 'Mx2qnJcNKM5mp4nrG3';
const EMAIL_PORT = process.env.EMAIL_PORT || '587';
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.ethereal.email';

const transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_API_KEY,
    },
});

// Connect child to DB
mongoose.Promise = global.Promise;
const DATABASEURL = process.env.DATABASEURL || 'mongodb://localhost/DYC';
mongoose.set('useFindAndModify', false); // disables warnings
mongoose.set('useCreateIndex', true); // disables warnings
mongoose.connect(DATABASEURL, { useNewUrlParser: true });

logger.info(`Message: Tasks process started\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
const req = false;

// Runs every 11 hours
setInterval( () => {
    const today = Date.now();
    let monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    let weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const refundTimer = 14 * 24 * 60 * 60 * 1000;

    // Look for delivered goods and complete deals
    Deal.find({'status': 'Pending Delivery', 'buyer.delivery.shipping': 'Shipping'}, (err, deals) => {
        if (err) {
            errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message} - Deals - Cannot find pending delivery deals\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
        } else {
            deals.forEach(deal => {
                request(`https://api.goshippo.com/tracks/${deal.buyer.delivery.carrier}/${deal.buyer.delivery.tracking_number}/`, function (error, response, body) {
                    if (error) {
                        errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message} - Shippo - GET Request failed\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                    } else {
                        if (response.tracking_history[response.tracking_history.length - 1].status == 'DELIVERED') {
                            deal.completedAt = Date.now();
                            deal.refundableUntil = Date.now() + refundTimer;
                            deal.status = 'Completed';
                            deal.save(err => {
                                if (err) {
                                    errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message} - Deals - Error saving the deal ${deal._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                }
                            });
                            Product.findById(deal.product.id, (err, product) => {
                                if (err) {
                                    errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message} - Product - Error finding product ${deal.product.id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                } else {
                                    if (!product.repeatable) {
                                        product.available = 'Closed';
                                        product.save(err => {
                                            if (err) {
                                                errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message} - Product - Error saving product ${product._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                            }
                                        });
                                        deleteProduct(product._id);
                                    }
                                }
                            });
                            User.findById(deal.product.author.id, (err, seller) => {
                                if (err) {
                                    errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message} - User - Error finding user ${deal.product.author.id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                } else {
                                    seller.nrSold += 1;
                                    seller.unreadNotifications += 1;
                                    seller.save(err => {
                                        if (err) {
                                            errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message} - User - Error updating seller ${seller._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                        }
                                    });
                                    Notification.create({
                                        userid: seller._id,
                                        linkTo: `/deals/${deal._id}`,
                                        imgLink: deal.product.imageUrl,
                                        message: `Your deal request has been completed`
                                    });
                                    if(seller.email_notifications.deal === true) {
                                        ejs.renderFile(path.join(__dirname, "../views/email_templates/completeDeal_seller.ejs"), {
                                            link: `http://${req.headers.host}/dashboard`,
                                            footerlink: `http://${req.headers.host}/dashboard/notifications`,
                                            name: deal.product.name,
                                            subject: `Status changed for ${deal.product.name} - Deal Your Crypto`,
                                        }, function (err, data) {
                                            if (err) {
                                                errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message} - Email - Error sending email to seller ${seller._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                            } else {
                                            const mailOptions = {
                                                from: `Deal Your Crypto <noreply@dealyourcrypto.com>`, // sender address
                                                to: `${seller.email}`, // list of receivers
                                                subject: 'Deal Status Changed', // Subject line
                                                html: data, // html body
                                            };
                                            transporter.sendMail(mailOptions, (error) => {
                                                if (error) {
                                                    errorLogger.error(`Status: ${error.status || 500}\r\nMessage: ${error.message} - Email - Error sending email to seller ${seller._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);                                                    
                                                }
                                            });
                                        }});
                                    }
                                }
                            });
                            User.findById(deal.buyer.id, (err, buyer) => {
                                if(buyer.email_notifications.deal === true) {
                                    ejs.renderFile(path.join(__dirname, "../views/email_templates/completeDeal_buyer.ejs"), {
                                        link: `http://${req.headers.host}/deals/${deal._id}`,
                                        footerlink: `http://${req.headers.host}/dashboard/notifications`,
                                        name: deal.product.name,
                                        subject: `Status changed for ${deal.product.name} - Deal Your Crypto`,
                                    }, function (err, data) {
                                        if (err) {
                                            errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message} - Email - Error sending email to buyer ${buyer._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);                                            
                                        } else {
                                        const mailOptions = {
                                            from: `Deal Your Crypto <noreply@dealyourcrypto.com>`, // sender address
                                            to: `${buyer.email}`, // list of receivers
                                            subject: 'Deal Status Changed', // Subject line
                                            html: data, // html body
                                        };
                                        transporter.sendMail(mailOptions, (error) => {
                                            if (error) {
                                                errorLogger.error(`Status: ${error.status || 500}\r\nMessage: ${error.message} - Email - Error sending email to buyer ${buyer._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                            }
                                        });
                                    }});
                                }
                            });
                        }
                    }
                });
            });
        }
    });

    // Pay deals which cannot be refunded anymore
    Deal.find({"status": "Completed", "paid": "false", "refundableUntil": { $lt: Date.now() }}, (err, deal) => {
        if (err) {
            errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message} - Deals - Pay deals\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
        } else {
            let withdrawAmount;
            if (deal.length > 0) {
                deal.forEach((item) => {
                    // get user who has to be paid
                    User.findById(item.product.author.id, (err, seller) => {
                        if (err) {
                            errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message} - Deals - Pay deals\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                        } else {
                            // pay user and create profit
                            Subscription.find({userid: seller._id}, (err, res) => {
                                if (err) {
                                    errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message} - Deals - Pay deals - subscription\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                } else {
                                    if (res.length > 0) {
                                        if (deal.buyer.delivery.shipping == 'Shipping') {
                                            client.getExchangeRates({'currency': 'BTC'}, function(error, data) {
                                                if (!error) {
                                                    let btcrate = data.data.rates.USD;
                                                    var tokenprice = 1/btcrate; // 1 USD
                                                    seller.btcbalance += item.price - ( item.price * premiumAccountFee * 0.01) - tokenprice;
                                                    // add profit to db
                                                    withdrawAmount = item.price * premiumAccountFee * 0.01 + tokenprice;
                                                    createProfit(req, withdrawAmount, 'Income Fee');
                                                }
                                            });
                                        } else {
                                            seller.btcbalance += item.price - ( item.price * premiumAccountFee * 0.01);
                                            // add profit to db
                                            withdrawAmount = item.price * premiumAccountFee * 0.01;
                                            createProfit(req, withdrawAmount, 'Income Fee');
                                        }
                                    } else {
                                        switch(seller.accountType) {
                                            case 'Standard':
                                                if (deal.buyer.delivery.shipping == 'Shipping') {
                                                    client.getExchangeRates({'currency': 'BTC'}, function(error, data) {
                                                        if (!error) {
                                                            let btcrate = data.data.rates.USD;
                                                            var tokenprice = 1/btcrate; // 1 USD
                                                            seller.btcbalance += item.price - ( item.price * standardAccountFee * 0.01) - tokenprice;
                                                            // add profit to db
                                                            withdrawAmount = item.price * standardAccountFee * 0.01 + tokenprice;
                                                            createProfit(req, withdrawAmount, 'Income Fee');
                                                        }
                                                    });
                                                } else {
                                                    seller.btcbalance += item.price - ( item.price * standardAccountFee * 0.01);
                                                    // add profit to db
                                                    withdrawAmount = item.price * premiumAccountFee * 0.01;
                                                    createProfit(req, withdrawAmount, 'Income Fee');
                                                }
                                                break;
                                            case 'Partner':
                                                if (deal.buyer.delivery.shipping == 'Shipping') {
                                                    client.getExchangeRates({'currency': 'BTC'}, function(error, data) {
                                                        if (!error) {
                                                            let btcrate = data.data.rates.USD;
                                                            var tokenprice = 1/btcrate; // 1 USD
                                                            seller.btcbalance += item.price - ( item.price * partnerAccountFee * 0.01) - tokenprice;
                                                            // add profit to db
                                                            withdrawAmount = item.price * partnerAccountFee * 0.01 + tokenprice;
                                                            createProfit(req, withdrawAmount, 'Income Fee');
                                                        }
                                                    });
                                                } else {
                                                    seller.btcbalance += item.price - ( item.price * partnerAccountFee * 0.01);
                                                    // add profit to db
                                                    withdrawAmount = item.price * partnerAccountFee * 0.01;
                                                    createProfit(req, withdrawAmount, 'Income Fee');
                                                }
                                                break;
                                            default:
                                                break;
                                        }
                                    }
                                }
                            });
                            seller.save(err => {
                                if (err) {
                                    errorLogger.error(`Status: ${err.status || 500}\r\nMessage: Couldn't save user ${seller._id}'s currency change\r\n${err.message} - Deals - Pay deals\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                }
                            });
                            // set deal as paid  
                            item.paid = true;
                            item.save(err => {
                                if (err) {
                                    errorLogger.error(`Status: ${err.status || 500}\r\nMessage: Couldn't save deal ${item._id}'s status change\r\n${err.message} - Deals - Pay deals\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                }
                            });
                        }
                    });
                });
            }
            if (process.env.NODE_ENV === 'production') {
                logger.info(`Deals were paid on ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
            }
        }
    });

    // Create subs for users with recurring payments
    // and expired subs
    let subscriptionCost;
    let tokenprice;
    client.getExchangeRates({'currency': 'BTC'}, function(error, data) {
        if (!error) {
          let btcrate = data.data.rates.USD;
          tokenprice = 1/btcrate; // 1 USD
          User.find({$or: [{subscription1: true}, {subscription3: true}, {subscription6: true}, {subscription12: true}]}, (err, res) => {
              if (err) {
                  errorLogger.error(`Status: ${err.status || 500}\r\nMessage: Error on finding user - subscription\r\n${err.message} - Subscription - Find user\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
              } else {
                  res.forEach((user) => {
                      Subscription.find({userid: user._id}, (err, sub) => {
                          if (err) {
                              errorLogger.error(`Status: ${err.status || 500}\r\nMessage: Error on finding user's subscription - subscription\r\n${err.message} - Subscription - Find sub\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                          } else if (sub.length == 0) {
                              if (user.subscription1 == true) {
                                  let expireDate = moment().add(30,"days").toISOString();
                                  subscriptionCost = Number((tokenprice * 19.99).toFixed(5));
                                  if (user.btcbalance >= subscriptionCost) {
                                      Subscription.create({
                                          userid: user._id,
                                          username: user.username,
                                          expireDate: expireDate,
                                          expires1: today
                                      }, err => {
                                              if(err) {
                                                  errorLogger.error(`Status: ${err.status || 500}\r\nMessage: Error on creating subscription for user ${user._id} - subscription\r\n${err.message} - Subscription - Create sub 1\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                              } else {
                                                  // Update user's balances
                                                  user.btcbalance -= subscriptionCost;
                                                  user.feature_tokens += 5;
                                                  user.save(err => {
                                                      if (err) {
                                                          errorLogger.error(`Status: ${err.status || 500}\r\nMessage: Update user after subscription1\r\n${err.message}\r\nUserId: ${user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                                      } else {
                                                          userLogger.info(`Message: User subscribed for 30 days, paid ${subscriptionCost}\r\nUserId: ${user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                                          createProfit(req, subscriptionCost, 'Subscription');
                                                          Notification.create({
                                                              userid: user._id,
                                                              linkTo: `/dashboard`,
                                                              message: `Your subscription has been automatically renewed`
                                                          }, (err) => {
                                                              if (err) {
                                                                  errorLogger.error(`Status: ${err.status || 500}\r\nMessage: Creating notification after subscription1 refresh\r\n${err.message}\r\nUserId: ${user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                                              }
                                                          });
                                                      }
                                                  });
                                              }             
                                          });
                                      } else {
                                          user.subscription1 = false;
                                          user.save(err => {
                                              if (err) {
                                                  errorLogger.error(`Status: ${err.status || 500}\r\nMessage: Update user after subscription1\r\n${err.message}\r\nUserId: ${user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                              } else {
                                                  userLogger.info(`Message: Recurring payments ended for 30 days subscription - Lack of funds\r\nUserId: ${user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                                  Notification.create({
                                                      userid: user._id,
                                                      linkTo: `/dashboard`,
                                                      message: `Your subscription has been cancelled due to lack of funds`
                                                  }, (err) => {
                                                      if (err) {
                                                          errorLogger.error(`Status: ${err.status || 500}\r\nMessage: Creating notification after subscription1 cancel\r\n${err.message}\r\nUserId: ${user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                                      }
                                                  });
                                              }
                                          }); 
                                      }
                              } else if (user.subscription3 == true) {
                                  let expireDate = moment().add(90,"days").toISOString();
                                  subscriptionCost = Number((tokenprice * 56.99).toFixed(5));
                                  if (user.btcbalance >= subscriptionCost) {
                                      Subscription.create({
                                          userid: user._id,
                                          username: user.username,
                                          expireDate: expireDate,
                                          expires3: today
                                      }, err => {
                                          if(err) {
                                              errorLogger.error(`Status: ${err.status || 500}\r\nMessage: Error on creating subscription3 for user ${user._id} - subscription\r\n${err.message} - Subscription - Create sub 3\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                          } else {
                                              // Update user's balances
                                              user.btcbalance -= subscriptionCost;
                                              user.feature_tokens += 15;
                                              user.save(err => {
                                                  if (err) {
                                                      errorLogger.error(`Status: ${err.status || 500}\r\nMessage: Update user after subscription3\r\n${err.message}\r\nUserId: ${user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                                  } else {
                                                      userLogger.info(`Message: User subscribed for 90 days, paid ${subscriptionCost}\r\nUserId: ${user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                                      createProfit(req, subscriptionCost, 'Subscription');
                                                      Notification.create({
                                                          userid: user._id,
                                                          linkTo: `/dashboard`,
                                                          message: `Your subscription has been automatically renewed`
                                                      }, (err) => {
                                                          if (err) {
                                                              errorLogger.error(`Status: ${err.status || 500}\r\nMessage: Creating notification after subscription3 refresh\r\n${err.message}\r\nUserId: ${user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                                          }
                                                      });
                                                  }
                                              });
                                          }             
                                      });
                                  } else {
                                      user.subscription3 = false;
                                      user.save(err => {
                                          if (err) {
                                              errorLogger.error(`Status: ${err.status || 500}\r\nMessage: Update user after subscription3\r\n${err.message}\r\nUserId: ${user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                          } else {
                                              userLogger.info(`Message: Recurring payments ended for 90 days subscription - Lack of funds\r\nUserId: ${user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                              Notification.create({
                                                  userid: user._id,
                                                  linkTo: `/dashboard`,
                                                  message: `Your subscription has been cancelled due to lack of funds`
                                              }, (err) => {
                                                  if (err) {
                                                      errorLogger.error(`Status: ${err.status || 500}\r\nMessage: Creating notification after subscription3 cancel\r\n${err.message}\r\nUserId: ${user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                                  }
                                              });
                                          }
                                      }); 
                                  }
                              } else if (user.subscription6 == true) {
                                  let expireDate = moment().add(180,"days").toISOString();
                                  subscriptionCost = Number((tokenprice * 107.99).toFixed(5));
                                  if (user.btcbalance >= subscriptionCost) {
                                      Subscription.create({
                                          userid: user._id,
                                          username: user.username,
                                          expireDate: expireDate,
                                          expires6: today
                                      }, err => {
                                          if(err) {
                                              errorLogger.error(`Status: ${err.status || 500}\r\nMessage: Error on creating subscription6 for ${user._id} - subscription\r\n${err.message} - Subscription - Create sub 6\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                          } else {
                                              // Update user's balances
                                              user.btcbalance -= subscriptionCost;
                                              user.feature_tokens += 30;
                                              user.save(err => {
                                                  if (err) {
                                                      errorLogger.error(`Status: ${err.status || 500}\r\nMessage: Update user after subscription6\r\n${err.message}\r\nUserId: ${user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                                  } else {
                                                      userLogger.info(`Message: User subscribed for 180 days, paid ${subscriptionCost}\r\nUserId: ${user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                                      createProfit(req, subscriptionCost, 'Subscription');
                                                      Notification.create({
                                                          userid: user._id,
                                                          linkTo: `/dashboard`,
                                                          message: `Your subscription has been automatically renewed`
                                                      }, (err) => {
                                                          if (err) {
                                                              errorLogger.error(`Status: ${err.status || 500}\r\nMessage: Creating notification after subscription6 refresh\r\n${err.message}\r\nUserId: ${user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                                          }
                                                      });
                                                  }
                                              });
                                          }             
                                          });
                                      } else {
                                          user.subscription6 = false;
                                          user.save(err => {
                                              if (err) {
                                                  errorLogger.error(`Status: ${err.status || 500}\r\nMessage: Update user after subscription6\r\n${err.message}\r\nUserId: ${user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                              } else {
                                                  userLogger.info(`Message: Recurring payments ended for 180 days subscription - Lack of funds\r\nUserId: ${user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                                  Notification.create({
                                                      userid: user._id,
                                                      linkTo: `/dashboard`,
                                                      message: `Your subscription has been cancelled due to lack of funds`
                                                  }, (err) => {
                                                      if (err) {
                                                          errorLogger.error(`Status: ${err.status || 500}\r\nMessage: Creating notification after subscription6 cancel\r\n${err.message}\r\nUserId: ${user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                                      }
                                                  });
                                              }
                                          }); 
                                      }
                              } else if (user.subscription12 == true) {
                                  let expireDate = moment().add(365,"days").toISOString();
                                  subscriptionCost = Number((tokenprice * 203.99).toFixed(5));
                                  if (user.btcbalance >= subscriptionCost) {
                                      Subscription.create({
                                          userid: user._id,
                                          username: user.username,
                                          expireDate: expireDate,
                                          expires12: today
                                      }, err => {
                                          if(err) {
                                              errorLogger.error(`Status: ${err.status || 500}\r\nMessage: Error on creating subscription12 for ${user._id} - subscription\r\n${err.message} - Subscription - Create sub 12\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                          } else {
                                              // Update user's balances
                                              user.btcbalance -= subscriptionCost;
                                              user.feature_tokens += 60;
                                              user.save(err => {
                                                  if (err) {
                                                      errorLogger.error(`Status: ${err.status || 500}\r\nMessage: Update user after subscription12\r\n${err.message}\r\nUserId: ${user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                                  } else {
                                                      userLogger.info(`Message: User subscribed for 180 days, paid ${subscriptionCost}\r\nUserId: ${user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                                      createProfit(req, subscriptionCost, 'Subscription');
                                                      Notification.create({
                                                          userid: user._id,
                                                          linkTo: `/dashboard`,
                                                          message: `Your subscription has been automatically renewed`
                                                      }, (err) => {
                                                          if (err) {
                                                              errorLogger.error(`Status: ${err.status || 500}\r\nMessage: Creating notification after subscription12 refresh\r\n${err.message}\r\nUserId: ${user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                                          }
                                                      });
                                                  }
                                              });
                                          }             
                                          });
                                  } else {
                                      user.subscription12 = false;
                                      user.save(err => {
                                          if (err) {
                                              errorLogger.error(`Status: ${err.status || 500}\r\nMessage: Update user after subscription12\r\n${err.message}\r\nUserId: ${user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                          } else {
                                              userLogger.info(`Message: Recurring payments ended for 360 days subscription - Lack of funds\r\nUserId: ${user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                              Notification.create({
                                                  userid: user._id,
                                                  linkTo: `/dashboard`,
                                                  message: `Your subscription has been cancelled due to lack of funds`
                                              }, (err) => {
                                                  if (err) {
                                                      errorLogger.error(`Status: ${err.status || 500}\r\nMessage: Creating notification after subscription12 cancel\r\n${err.message}\r\nUserId: ${user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                                  }
                                              });
                                          }
                                      }); 
                                  }
                              }
                          }
                      });
                  });
              }
          });
        } else {
            errorLogger.error(`Status: ${err.status || 500}\r\nMessage: Error on getting token price and updating subscriptions\r\n${err.message}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
        }
      });

    // Delete non-OAuth users who didn't confirm their email
    User.deleteMany({confirmed: false, googleId: { $exists: false }, facebookId: { $exists: false }}, (err) => {
        if (err) {
            errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message} - Deleting users who didn't confirm their email\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
        }
    });

    // Remove expired feat_1
    Product.updateMany({"feat_1.status": true, "feat_1.expiry_date": { $lt: Date.now() } }, { $set: { "feat_1.status": false }}, {multi: true}, (err, result) => {
        if (err) {
            errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message} - Removing expired feat_1\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
        } else {
            productLogger.info(`Expired feat_1 removed on ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
            logger.info(`Expired feat_1 removed on ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
        }
    });

    // Remove expired feat_2
    Product.updateMany({"feat_2.status": true, "feat_2.expiry_date": { $lt: Date.now() } }, { $set: { "feat_2.status": false }}, {multi: true}, (err, result) => {
        if (err) {
            errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message} - Removing expired feat_2\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
        } else {
            productLogger.info(`Expired feat_2 removed on ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
            logger.info(`Expired feat_2 removed on ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
        }
    });

    // get chats with messages
    Chat.find({"messageCount": { $gt: 0 }}, (err, chat) => {
        if (err) {
            errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message} - Finding chats with messages\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
        } else {
            chat.forEach(item => {
                // get last message and verify if it was read
                const lastMsg = item.messages[item.messages.length - 1];
                if (!lastMsg.read) {
                    if (lastMsg.sender.toString() == item.user1.id.toString()) {
                        // send email to user2
                         User.findById(item.user2.id, (err, user2) => {
                            if (err) {
                                errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message} - Finding user2 @chats\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                            } else {
                                // test this and the one below
                                if(user2.email_notifications.message === true) {
                                    ejs.renderFile(path.join(__dirname, "../views/email_templates/newMessage2.ejs"), {
                                        link: `http://${req.headers.host}/messages/${item._id}`,
                                        footerlink: `http://${req.headers.host}/dashboard/notifications`,
                                        sender: item.user1.fullname,
                                        product: item.product.name,
                                        subject: `You have an unread message`,
                                    }, function (err, data) {
                                        if (err) {
                                            errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nMethod: Sending user2 notif email\r\nUserId: ${user2._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                        } else {
                                            const mailOptions = {
                                                from: `Deal Your Crypto <noreply@dealyourcrypto.com>`, // sender address
                                                to: `${user2.full_name} <${user2.email}>`, // list of receivers
                                                subject: 'You have an unread message', // Subject line
                                                html: data, // html body
                                            };
                                            // send mail with defined transport object
                                            transporter.sendMail(mailOptions, (error) => {
                                                if (error) {
                                                    errorLogger.error(`Status: ${error.status || 500}\r\nMessage: ${error.message} - Sending mail user2 @chats\r\nUserId: ${user2._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                                }
                                            });
                                        }
                                    });
                                }
                            }
                        });
                    } else {
                        // send email to user1
                        const user1 = User.findById(item.user1.id, (err, res) => {
                            if (err) {
                                errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message} - Finding user1 @chats\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                            } else {
                                if (user1) {
                                    if(user1.email_notifications.message === true) {
                                        ejs.renderFile(path.join(__dirname, "../views/email_templates/newMessage2.ejs"), {
                                            link: `http://${req.headers.host}/messages/${item._id}`,
                                            footerlink: `http://${req.headers.host}/dashboard/notifications`,
                                            sender: item.user2.fullname,
                                            product: item.product.name,
                                            subject: `You have an unread message`,
                                        }, function (err, data) {
                                            if (err) {
                                                errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${res._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                            } else {
                                                const mailOptions = {
                                                    from: `Deal Your Crypto <noreply@dealyourcrypto.com>`, // sender address
                                                    to: `${user1.full_name} <${user1.email}>`, // list of receivers
                                                    subject: 'You have an unread message', // Subject line
                                                    html: data, // html body
                                                };
                                                // send mail with defined transport object
                                                transporter.sendMail(mailOptions, (error) => {
                                                    if (error) {
                                                        errorLogger.error(`Status: ${error.status || 500}\r\nMessage: ${error.message} - Sending mail user1 @chats\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                                    }
                                                });
                                            }
                                        });
                                    }
                                }
                            }
                        });
                    }
                }
            });
        }
    });

    // Deleting old chats and deals
    Chat.find({'createdAt': {$lt: monthAgo}}, (err, chats) => {
        if (err) {
            errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message} - Couldn't find the old chats\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
        } else {
            chats.forEach(chat => {
                if (chat.messageCount == 0) {
                    if (!chat.deal) {
                        chat.remove(err => {
                            if (err) {
                                errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message} - Error while removing old chat with no messages\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                            }
                        });
                    } else {
                        Deal.findById(chat.deal, (err, deal) => {
                            if (err) {
                                errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message} - Error while finding old chat deal\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                            } else {
                                if ((['Refunded', 'Cancelled', 'Declined', 'Refund denied'].includes(deal.status)) || ((deal.status == 'Completed') && (deal.refundableUntil < Date.now()))) {
                                    deal.remove(err => {
                                        if (err) {
                                            errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message} - Error while removing old deal\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                        }
                                    });
                                    chat.remove(err => {
                                        if (err) {
                                            errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message} - Error while removing old chat\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                        }
                                    });
                                }
                            }
                        });
                    }
                } else {
                    if (chat.messages[chat.messageCount - 1].createdAt < weekAgo) {
                        if (!chat.deal) {
                            chat.remove(err => {
                                if (err) {
                                    errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message} - Error while removing old chat with messages and no deal\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                }
                            });     
                        } else {
                            Deal.findById(chat.deal, (err, deal) => {
                                if (err) {
                                    errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message} - Error while finding old chat deal\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                } else {
                                    if (deal) {
                                        if (((deal.status == 'Completed') && (deal.refundableUntil < Date.now())) || (deal.status == 'Refunded') || (deal.status == 'Cancelled')) {
                                            deal.remove(err => {
                                                if (err) {
                                                    errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message} - Error while removing old deal\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                                }
                                            });
                                            chat.remove(err => {
                                                if (err) {
                                                    errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message} - Error while removing old chat\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                                }
                                            });
                                        }
                                    } else {
                                        chat.remove(err => {
                                            if (err) {
                                                errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message} - Error while removing old chat with messages and no deal\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                            }
                                        });  
                                    }
                                }
                            });
                        }
                    }
                }
            });
        }
    });

    // Deleting flagged products
    Product.find({'deleteIn30.status': true, 'deleteIn30.deleteDate': { $lt: Date.now() }}, (err, products) => {
        if (err) {
            errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message} - Couldn't find the flagged products\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
        } else {
            products.forEach(product => {
                product.images.forEach(image => {
                    cloudinary.v2.uploader.destroy(image.public_id);
                });
                const id = product._id;
                product.remove(err => {
                    if (err) {
                        errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message} - Couldn't remove product ${id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                    }
                });
                Deal.find({'product.id': id}, (err, res) => {
                    if (err) {
                        errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message} - Couldn't find deals for product ${id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                    } else {
                        res.remove(err => {
                            if (err) {
                                errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message} - Couldn't remove deal ${res._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                            }
                        });
                    }
                });
                if (process.env.NODE_ENV === 'production') {
                    productLogger.info(`Message: Product ${id} was deleted\r\nURL: ${req.originalUrl}\r\nMethod: Deleting products\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                }
            });
        }
    });

    // Deleting products that weren't bought in a month
    Product.find({'lastBought': { $lt: monthAgo }}, (err, products) => {
        if (err) {
            errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message} - Couldn't find the unbought products\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
        } else {
            products.forEach(product => {
                Deal.find({status: {$nin:['Completed', 'Refunded', 'Declined', 'Cancelled', 'Refund denied']}, 'product.id': product._id}, (err, deals) => {
                    if (err) {
                        errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message} - Couldn't find deals that weren't completed, refunded, declined, etc for product ${product._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                    } else {
                        if (deals.length == 0) {
                            Deal.find({'product.id': product._id, refundableUntil: {$gt: Date.now()}}, (err, refundableDeals) => {
                                if (err) {
                                    errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message} - Couldn't find refundable deals for product ${product._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                } else {
                                    if (refundableDeals.length == 0) {
                                        Deal.find({'product.id': product._id}, (err, nonrefundableDeals) => {
                                            if (err) {
                                                errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message} - Couldn't find nonrefundable deals for product ${product._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                            } else {
                                                nonrefundableDeals.forEach(deal => {
                                                    deal.remove(err => {
                                                        if (err) {
                                                            errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message} - Couldn't remove deal ${deal._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                                        }
                                                    });
                                                });
                                            }
                                        });
                                        product.images.forEach(image => {
                                            cloudinary.v2.uploader.destroy(image.public_id);
                                        });
                                        const id = product._id;
                                        product.remove(err => {
                                            if (err) {
                                                errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message} - Couldn't remove product ${id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                            }
                                        });
                                        if (process.env.NODE_ENV === 'production') {
                                            productLogger.info(`Message: Product ${id} was deleted\r\nMethod: Deleting old products\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                        }
                                    }
                                }
                            });
                        }
                    }
                });
            });
        }
    });

    // Deleting week old notifications
    Notification.find({'createdAt': { $lt: weekAgo }}, (err, notifications) => {
        if (err) {
            errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message} - Couldn't find the notifications\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
        } else {
            notifications.forEach(notification => {
                notification.remove();
            });
        }
    });
    if (process.env.NODE_ENV === 'production') {
        logger.info(`Message: Notifications deleted\r\nURL: ${req.originalUrl}\r\nMethod: Deleting notifications\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
    }
    logger.info(`Message: Recurring Tasks finished\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
}, 11 * 60 * 60 * 1000);
