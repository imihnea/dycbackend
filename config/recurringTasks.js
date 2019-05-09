const User = require('../models/user');
const Deal = require('../models/deal');
const moment = require('moment');
const mongoose = require('mongoose');
const { logger, dealLogger, errorLogger } = require('./winston');
const { withdraw } = require('./withdraw');

// Connect child to DB
mongoose.Promise = global.Promise;
const DATABASEURL = process.env.DATABASEURL || 'mongodb://localhost/DYC';
mongoose.set('useFindAndModify', false); // disables warnings
mongoose.set('useCreateIndex', true); // disables warnings
mongoose.connect(DATABASEURL, { useNewUrlParser: true });

console.log('Child process started');
const req = false;

// Runs every 24 hours
setInterval( () => {
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
                            console.log(err);
                        } else {
                            // pay user and withdraw
                            switch(seller.accountType) {
                                case 'Standard':
                                    seller.btcbalance += item.price - ( item.price * standardAccountFee * 0.01);
                                    // Withdraw to our wallet
                                    withdrawAmount = item.price * standardAccountFee * 0.01;
                                    // REQUIRES TESTING
                                    // withdraw(req, withdrawAmount);
                                    break;
                                case 'Premium':
                                    seller.btcbalance += item.price - ( item.price * premiumAccountFee * 0.01);
                                    // Withdraw to our wallet
                                    withdrawAmount = item.price * premiumAccountFee * 0.01;
                                    // REQUIRES TESTING
                                    // withdraw(req, withdrawAmount);
                                    break;
                                case 'Partner':
                                    seller.btcbalance += item.price - ( item.price * partnerAccountFee * 0.01);
                                    // Withdraw to our wallet
                                    withdrawAmount = item.price * partnerAccountFee * 0.01;
                                    // REQUIRES TESTING
                                    // withdraw(req, withdrawAmount);
                                    break;
                                default:
                                    break;
                            }
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
    User.find({$or: [{subscription1: true}, {subscription3: true}, {subscription6: true}, {subscription12: true}]}, (err, res) => {
        if (err) {
            errorLogger.error(`Status: ${err.status || 500}\r\nMessage: Error on finding user - subscription\r\n${err.message} - Deals - Pay deals\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
            console.log(err);
        } else {
            res.forEach((user) => {
                Subscription.find({userid: user._id}, (err, sub) => {
                    if (err) {
                        errorLogger.error(`Status: ${err.status || 500}\r\nMessage: Error on finding user's subscription - subscription\r\n${err.message} - Deals - Pay deals\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                        console.log(err);
                    } else if (sub.length == 0) {
                        if (user.subscription1 == true) {
                            subscriptionCost = Number((tokenprice * 19.99).toFixed(5));
                            if (user.btcbalance >= subscriptionCost) {
                                Subscription.create({
                                    userid: user._id,
                                    username: user.username,
                                    expireDate: expireDate,
                                    expires1: today
                                }, err => {
                                        if(err) {
                                            errorLogger.error(`Status: ${err.status || 500}\r\nMessage: Error on creating subscription for user ${user._id} - subscription\r\n${err.message} - Deals - Pay deals\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                            console.log(err);
                                        } else {
                                            // Update user's balances
                                            user.btcbalance -= subscriptionCost;
                                            user.feature_tokens += 5;
                                            user.save(err => {
                                                if (err) {
                                                    errorLogger.error(`Status: ${err.status || 500}\r\nMessage: Update user after subscription1\r\n${err.message}\r\nUserId: ${user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                                } else {
                                                    userLogger.info(`Message: User subscribed for 30 days, paid ${subscriptionCost}\r\nUserId: ${user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                                    // REQUIRES TESTING
                                                    // withdraw(req, subscriptionCost);
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
                                        }
                                    }); 
                                }
                        } else if (user.subscription3 == true) {
                            subscriptionCost = Number((tokenprice * 56.99).toFixed(5));
                            if (user.btcbalance >= subscriptionCost) {
                                Subscription.create({
                                    userid: user._id,
                                    username: user.username,
                                    expireDate: expireDate,
                                    expires3: today
                                }, err => {
                                    if(err) {
                                        errorLogger.error(`Status: ${err.status || 500}\r\nMessage: Error on creating subscription3 for user ${user._id} - subscription\r\n${err.message} - Deals - Pay deals\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                        console.log(err);
                                    } else {
                                        // Update user's balances
                                        user.btcbalance -= subscriptionCost;
                                        user.feature_tokens += 15;
                                        user.save(err => {
                                            if (err) {
                                                errorLogger.error(`Status: ${err.status || 500}\r\nMessage: Update user after subscription3\r\n${err.message}\r\nUserId: ${user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                            } else {
                                                userLogger.info(`Message: User subscribed for 90 days, paid ${subscriptionCost}\r\nUserId: ${user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                            // REQUIRES TESTING
                                            // withdraw(req, subscriptionCost);
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
                                    }
                                }); 
                            }
                        } else if (user.subscription6 == true) {
                            subscriptionCost = Number((tokenprice * 107.99).toFixed(5));
                            if (user.btcbalance >= subscriptionCost) {
                                Subscription.create({
                                    userid: user._id,
                                    username: user.username,
                                    expireDate: expireDate,
                                    expires6: today
                                }, err => {
                                    if(err) {
                                        errorLogger.error(`Status: ${err.status || 500}\r\nMessage: Error on creating subscription6 for ${user._id} - subscription\r\n${err.message} - Deals - Pay deals\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                        console.log(err);
                                    } else {
                                        // Update user's balances
                                        user.btcbalance -= subscriptionCost;
                                        user.feature_tokens += 30;
                                        user.save(err => {
                                            if (err) {
                                                errorLogger.error(`Status: ${err.status || 500}\r\nMessage: Update user after subscription6\r\n${err.message}\r\nUserId: ${user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                            } else {
                                                userLogger.info(`Message: User subscribed for 180 days, paid ${subscriptionCost}\r\nUserId: ${user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                            // REQUIRES TESTING
                                            // withdraw(req, subscriptionCost);
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
                                        }
                                    }); 
                                }
                        } else if (user.subscription12 == true) {
                            subscriptionCost = Number((tokenprice * 203.99).toFixed(5));
                            if (user.btcbalance >= subscriptionCost) {
                                Subscription.create({
                                    userid: user._id,
                                    username: user.username,
                                    expireDate: expireDate,
                                    expires12: today
                                }, err => {
                                    if(err) {
                                        errorLogger.error(`Status: ${err.status || 500}\r\nMessage: Error on creating subscription12 for ${user._id} - subscription\r\n${err.message} - Deals - Pay deals\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                        console.log(err);
                                    } else {
                                        // Update user's balances
                                        user.btcbalance -= subscriptionCost;
                                        user.feature_tokens += 60;
                                        user.save(err => {
                                            if (err) {
                                                errorLogger.error(`Status: ${err.status || 500}\r\nMessage: Update user after subscription12\r\n${err.message}\r\nUserId: ${user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                            } else {
                                                userLogger.info(`Message: User subscribed for 180 days, paid ${subscriptionCost}\r\nUserId: ${user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                                // REQUIRES TESTING
                                                // withdraw(req, subscriptionCost);
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
                                    }
                                }); 
                            }
                        }
                    }
                });
            });
        }
    });

    // Delete non-OAuth users who didn't confirm their email
    User.deleteMany({confirmed: false, googleId: { $exists: false }, facebookId: { $exists: false }}, (err) => {
        if (err) {
            console.log(err);
            errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message} - Deleting users who didn't confirm their email\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
        }
    });

    // // Remove expired feat_1
    // Product.updateMany({"feat_1.status": true, "feat_1.expiry_date": { $lt: Date.now() } }, { $set: { "feat_1.status": false }}, {multi: true}, (err, result) => {
    //     if (err) {
    //         errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message} - Removing expired feat_1\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
    //         console.log(err);
    //     } else {
    //         productLogger.info(`Expired feat_1 removed on ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
    //         logger.info(`Expired feat_1 removed on ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
    //     }
    // });

    // // Remove expired feat_2
    // Product.updateMany({"feat_2.status": true, "feat_2.expiry_date": { $lt: Date.now() } }, { $set: { "feat_2.status": false }}, {multi: true}, (err, result) => {
    //     if (err) {
    //         errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message} - Removing expired feat_2\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
    //         console.log(err);
    //     } else {
    //         productLogger.info(`Expired feat_2 removed on ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
    //         logger.info(`Expired feat_2 removed on ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
    //     }
    // });
}, 24 * 60 * 60 * 1000);
