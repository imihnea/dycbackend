const Profit = require('../models/profit');
const Withdraw = require('../models/withdrawRequests');
const User = require('../models/user');
const Subscription = require('../models/subscription');
const Product = require('../models/product');
const Notification = require('../models/notification');
const Report = require('../models/report');
const Deal = require('../models/deal');

const nodemailer = require('nodemailer');
const Client = require('coinbase').Client;
const ejs = require('ejs');
const path = require('path');
const { errorLogger, userLogger, logger } = require('../config/winston');
const moment = require('moment');
const middleware = require('../middleware/index');
const { client:elasticClient } = require('../config/elasticsearch');

const { asyncErrorHandler } = middleware; // destructuring assignment

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

module.exports = {
    async getAdmin (req, res) {
        const profit = await Profit.find({status: 'Unpaid'});
        const withdrawals = await Withdraw.find({status: 'Processing'});
        res.render('admin', {
          profit,
          withdrawals,
          errors: req.session.errors,
          pageTitle: 'Administration - Deal Your Crypto',
          pageDescription: 'Description',
          pageKeywords: 'Keywords'
        });
    },
    async getUsers(req, res) {
        const applications = await User.find({'partnerApplication.status': 'Processing'});
        res.render('adminUsers', {
            applications,
            errors: req.session.errors,
            pageTitle: 'Administration - Deal Your Crypto',
            pageDescription: 'Description',
            pageKeywords: 'Keywords'
        });
    },
    async getReports(req, res) {
        const reports = await Report.find({createdAt: {$gte: new Date((new Date().getTime() - (14 * 24 * 60 * 60 * 1000)))}});
        let productReports = [];
        let dealReports = [];
        let reviewReports = [];
        reports.forEach(report => {
            if (report.product) {
                productReports.push(report);
            } else if (report.deal) {
                dealReports.push(report);
            } else {
                reviewReports.push(report);
            }
        });
        res.render('adminReports', {
            productReports,
            dealReports,
            reviewReports,
            errors: req.session.errors,
            pageTitle: 'Administration - Deal Your Crypto',
            pageDescription: 'Description',
            pageKeywords: 'Keywords'
        });
    },
    async withdrawAccept (req, res) {
        const withdraw = await Withdraw.findById(req.params.id);
        client.getAccount('primary', function(err, account) {
            if(err) {
                errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                req.flash('error', 'There was a problem with your request, please try again.');
                return res.redirect('back');
            } else {
                account.sendMoney({
                        'to': withdraw.address,
                        'amount': withdraw.amount,
                        'currency': 'BTC'
                }, 
                function(err, tx) {
                    if(err) {
                        errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message} - Cannot withdraw\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                        req.flash('error', 'There was an error withdrawing, please contact us immediately about this.');
                        return res.redirect('back');
                    } else {
                        withdraw.status = 'Completed';
                        withdraw.save(err => {
                            if (err) {
                                errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message} - Couldn't save withdraw 'Completed' status\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${withdraw.userID}\r\nWithdrawId: ${withdraw._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                            }
                        });
                        if(withdraw.notify === true) {
                                ejs.renderFile(path.join(__dirname, "../views/email_templates/withdraw.ejs"), {
                                link: `http://${req.headers.host}/dashboard/address`,
                                footerlink: `http://${req.headers.host}/dashboard/notifications`,
                                amount: withdraw.amount,
                                address: withdraw.address,
                                subject: 'Currency withdrawn successfully - Deal Your Crypto',
                            }, 
                            function (err, data) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    const mailOptions = {
                                        from: `Deal Your Crypto <noreply@dealyourcrypto.com>`,
                                        to: `${withdraw.userEmail}`,
                                        subject: 'Currency withdrawn successfully',
                                        html: data,
                                    };
                                    transporter.sendMail(mailOptions, (error) => {
                                        if (error) {
                                            errorLogger.error(`Status: ${error.status || 500}\r\nMessage: ${error.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${withdraw.userID}\r\nWithdrawID: ${withdraw._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                        }
                                        if (process.env.NODE_ENV === 'production') {
                                            userLogger.info(`Message: Withdraw successful\r\nWithdrawID: ${withdraw._id}\r\nAmount: ${withdraw.amount}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${withdraw.userID}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                        }
                                        req.flash('success', `Successfully withdrawn ${withdraw.amount} BTC!`);
                                        return res.redirect('back');
                                    });
                                }
                            });
                        } else {
                            req.flash('success', `Successfully withdrawn ${withdraw.amount} BTC!`);
                            return res.redirect('back');
                        }
                    }
                });
            }
        });
    },
    async withdrawDeny (req, res) {
        const withdraw = await Withdraw.findById(req.params.id);
        withdraw.status = 'Denied';
        await withdraw.save();
        if (req.body.action == 'moneyBack') {
            await User.findByIdAndUpdate(withdraw.userID, {$inc: {btcbalance: withdraw.amount}});
        }
        if(withdraw.notify === true) {
            ejs.renderFile(path.join(__dirname, "../views/email_templates/withdrawDenied.ejs"), {
                link: `http://${req.headers.host}/dashboard/address`,
                footerlink: `http://${req.headers.host}/dashboard/notifications`,
                amount: withdraw.amount,
                subject: 'Currency withdrawal denied - Deal Your Crypto',
            }, 
            function (err, data) {
                if (err) {
                    console.log(err);
                } else {
                    const mailOptions = {
                        from: `Deal Your Crypto <noreply@dealyourcrypto.com>`,
                        to: `${withdraw.userEmail}`,
                        subject: 'Currency withdrawal denied',
                        html: data,
                    };
                    transporter.sendMail(mailOptions, (error) => {
                        if (error) {
                            errorLogger.error(`Status: ${error.status || 500}\r\nMessage: ${error.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${withdraw.userID}\r\nWithdrawID: ${withdraw._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                        }
                        if (process.env.NODE_ENV === 'production') {
                            userLogger.info(`Message: Withdraw denied\r\nWithdrawID: ${withdraw._id}\r\nAmount: ${withdraw.amount}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${withdraw.userID}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                        }
                        req.flash('success', `Successfully denied withdrawal!`);
                        return res.redirect('back');
                    });
                }
            });
        } else {
            req.flash('success', `Successfully denied withdrawal!`);
            return res.redirect('back');
        }
    },
    async withdrawAcceptAll (req, res) {
        const ids = req.body.withdrawIDs.split(" ");
        ids.pop();
        let withdraws = await Withdraw.find({_id: {$in: ids}});
        client.getAccount('primary', function(err, account) {
            if(err) {
                errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                req.flash('error', 'There was a problem with your request, please try again.');
                return res.redirect('back');
            } else {
                withdraws.forEach(withdraw => {
                    account.sendMoney({
                        'to': withdraw.address,
                        'amount': withdraw.amount,
                        'currency': 'BTC'
                    }, 
                    function(err, tx) {
                        if(err) {
                            errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message} - Cannot withdraw\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nWithdrawID: ${withdraw._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                            req.flash('error', 'There was an error withdrawing, please contact us immediately about this.');
                            return res.redirect('back');
                        } else {
                            withdraw.status = 'Completed';
                            withdraw.save(err => {
                                if (err) {
                                    errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message} - Couldn't save withdraw 'Completed' status\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${withdraw.userID}\r\nWithdrawID: ${withdraw._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                }
                            });
                            if(withdraw.notify === true) {
                                    ejs.renderFile(path.join(__dirname, "../views/email_templates/withdraw.ejs"), {
                                    link: `http://${req.headers.host}/dashboard/address`,
                                    footerlink: `http://${req.headers.host}/dashboard/notifications`,
                                    amount: withdraw.amount,
                                    address: withdraw.address,
                                    subject: 'Currency withdrawn successfully - Deal Your Crypto',
                                }, 
                                function (err, data) {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        const mailOptions = {
                                            from: `Deal Your Crypto <noreply@dealyourcrypto.com>`,
                                            to: `${withdraw.userEmail}`,
                                            subject: 'Currency withdrawn successfully',
                                            html: data,
                                        };
                                        transporter.sendMail(mailOptions, (error) => {
                                            if (error) {
                                                errorLogger.error(`Status: ${error.status || 500}\r\nMessage: ${error.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${withdraw.userID}\r\nWithdrawID: ${withdraw._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                            }
                                            if (process.env.NODE_ENV === 'production') {
                                                userLogger.info(`Message: Withdraw successful\r\nWithdrawID: ${withdraw._id}\r\nAmount: ${withdraw.amount}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${withdraw.userID}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                            }
                                        });
                                    }
                                });
                            }
                        }
                    });
                });
            }
        });
        req.flash('success', 'Successfully accepted all requests');
        return res.redirect('back');
    },
    async withdrawDenyAll (req, res) {
        let ids = req.body.withdrawIDs.split(" ");
        ids.pop();
        let withdraws = await Withdraw.find({_id: {$in: ids}});
        withdraws.forEach(asyncErrorHandler(async withdraw => {
            withdraw.status = 'Denied';
            await withdraw.save();
            await User.findByIdAndUpdate(withdraw.userID, {$inc: {btcbalance: withdraw.amount}});
            if(withdraw.notify === true) {
                ejs.renderFile(path.join(__dirname, "../views/email_templates/withdrawDenied.ejs"), {
                    link: `http://${req.headers.host}/dashboard/address`,
                    footerlink: `http://${req.headers.host}/dashboard/notifications`,
                    amount: withdraw.amount,
                    subject: 'Currency withdrawal denied - Deal Your Crypto',
                }, 
                function (err, data) {
                    if (err) {
                        console.log(err);
                    } else {
                        const mailOptions = {
                            from: `Deal Your Crypto <noreply@dealyourcrypto.com>`,
                            to: `${withdraw.userEmail}`,
                            subject: 'Currency withdrawal denied',
                            html: data,
                        };
                        transporter.sendMail(mailOptions, (error) => {
                            if (error) {
                                errorLogger.error(`Status: ${error.status || 500}\r\nMessage: ${error.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${withdraw.userID}\r\nWithdrawID: ${withdraw._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                            }
                            if (process.env.NODE_ENV === 'production') {
                                userLogger.info(`Message: Withdraw denied\r\nWithdrawID: ${withdraw._id}\r\nAmount: ${withdraw.amount}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${withdraw.userID}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                            }
                        });
                    }
                });
            }
        }));
        req.flash('success', 'Successfully denied all withdraw requests');
        return res.redirect('back');
    },
    async deleteProfit (req, res) {
        await Profit.findByIdAndUpdate(req.params.id, {$set: {status: 'Paid'}});
        if (process.env.NODE_ENV == 'Production') {
            logger.info(`Profit ${req.params.id} paid on ${app.locals.moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
        }
        req.flash('success', 'Successfully resetted profit');
        return res.redirect('back');
    },
    async deleteAllProfits (req, res) {
        let ids = req.body.profitIDs.split(" ");
        ids.pop();
        let profits = await Profit.find({_id: {$in: ids}});
        profits.forEach(asyncErrorHandler(async profit => {
            profit.status = 'Paid';
            await profit.save();
        }));
        if (process.env.NODE_ENV == 'Production') {
            logger.info(`Profits ${req.body.profitIDs} paid on ${app.locals.moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
        }
        req.flash('success', 'Successfully resetted unpaid profits');
        return res.redirect('back');
    },
    async banUser (req, res) {
        req.check('userid', 'The userid is invalid').notEmpty().isLength({max: 24}).matches(/^[a-f0-9]+$/gi);
        const errors = req.validationErrors();
        if (errors) {
            const profit = await Profit.find({status: 'Unpaid'});
            const withdrawals = await Withdraw.find({status: 'Processing'});
            const applications = await User.find({'partnerApplication.status': 'Processing'});
            return res.render('admin', {
                profit,
                withdrawals,
                applications,
                errors,
                pageTitle: 'Administration - Deal Your Crypto',
                pageDescription: 'Description',
                pageKeywords: 'Keywords'
            });
        }
        const user = await User.findById(req.body.userid);
        let until = new Date();
        switch (req.body.time) {
            case '1d':
                until.setDate(until.getDate() + 1);
            break;
            case '3d':
                until.setDate(until.getDate() + 3);
            break;
            case '7d':
                until.setDate(until.getDate() + 7);
            break;
            case '14d':
                until.setDate(until.getDate() + 14);
            break;
            case '1m':
                until.setDate(until.getDate() + 30);
            break;
            case 'perm':
                until = new Date(8640000000000000);
            break;
            default:
            break;
        }
        const ban = {
            until,
            reason: req.body.reason
        }
        user.ban.push(ban);
        await Subscription.findOne({userid: user._id},  (err, res) => {
            if (err) {
                errorLogger.error(`Status: ${error.status || 500}\r\nMessage: ${error.message} - @ Find Subscription\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
            } else {
                if (res) {
                    if (res.expireDate < until) {
                        user.subscription1 = false;
                        user.subscription3 = false;
                        user.subscription6 = false;
                        user.subscription12 = false;
                        res.remove();
                    }
                }
            }
        });
        await user.save();
        if (process.env.NODE_ENV === 'production') {
            userLogger.info(`Message: User banned until ${until}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
        }
        let reason;
        switch (req.body.reason) {
            case 'Scamming':
                reason = 'Attempt to scam, fraud or mislead a potential customer';
                break;
            case 'SuspectActivity':
                reason = 'Suspect activity';
            break;
            default:
            break;
        }
        until = until.toUTCString();
        if(user.email_notifications.user === true) {
            ejs.renderFile(path.join(__dirname, "../views/email_templates/ban.ejs"), {
                link: `http://${req.headers.host}/`,
                footerlink: `http://${req.headers.host}/dashboard/notifications`,
                until,
                reason,
                subject: 'Account suspended - Deal Your Crypto',
            }, 
            function (err, data) {
                if (err) {
                    errorLogger.error(`Status: ${error.status || 500}\r\nMessage: ${error.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                } else {
                    const mailOptions = {
                        from: `Deal Your Crypto <noreply@dealyourcrypto.com>`,
                        to: `${user.email}`,
                        subject: 'Account suspended',
                        html: data,
                    };
                    transporter.sendMail(mailOptions, (error) => {
                        if (error) {
                            errorLogger.error(`Status: ${error.status || 500}\r\nMessage: ${error.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                        }
                    });
                }
            });
        }
        req.flash('success', 'User banned successfully');
        return res.redirect('back');
    },
    async partnerUser (req, res) {
        req.check('userid', 'The userid is invalid').notEmpty().isLength({max: 24}).matches(/^[a-f0-9]+$/gi);
        const errors = req.validationErrors();
        if (errors) {
            const profit = await Profit.find({status: 'Unpaid'});
            const withdrawals = await Withdraw.find({status: 'Processing'});
            const applications = await User.find({'partnerApplication.status': 'Processing'});
            return res.render('admin', {
                profit,
                withdrawals,
                applications,
                errors,
                pageTitle: 'Administration - Deal Your Crypto',
                pageDescription: 'Description',
                pageKeywords: 'Keywords'
            });
        }
        const user = await User.findByIdAndUpdate(req.body.userid, {$set: {accountType: 'Partner', 'partnerApplication.status': 'Accepted'}});
        await Product.updateMany({'author.id': req.body.userid}, {$set: {'author.accountType': 'Partner'}}, {multi: true});
        await Notification.create({
            userid: user._id,
            linkTo: `/dashboard/`,
            message: `Your partnership request has been accepted`
        });
        if (process.env.NODE_ENV === 'production') {
            userLogger.info(`Message: User partnered\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
        }
        if(user.email_notifications.user === true) {
            ejs.renderFile(path.join(__dirname, "../views/email_templates/partner.ejs"), {
                link: `http://${req.headers.host}/`,
                footerlink: `http://${req.headers.host}/dashboard/notifications`,
                subject: 'Partnership accepted - Deal Your Crypto',
            }, 
            function (err, data) {
                if (err) {
                    errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                } else {
                    const mailOptions = {
                        from: `Deal Your Crypto <noreply@dealyourcrypto.com>`,
                        to: `${user.email}`,
                        subject: 'Partnership accepted',
                        html: data,
                    };
                    transporter.sendMail(mailOptions, (error) => {
                        if (error) {
                            errorLogger.error(`Status: ${error.status || 500}\r\nMessage: ${error.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                        }
                    });
                }
            });
        }
        req.flash('success', 'User partnered successfully');
        return res.redirect('back');
    },
    async partnerDecline (req, res) {
        req.check('reason', 'The reason is invalid').notEmpty().isLength({max: 500}).matches(/^[a-z ]+$/gi);
        req.check('userid', 'The userid is invalid').notEmpty().isLength({max: 24}).matches(/^[a-f0-9]+$/gi);
        const errors = req.validationErrors();
        if (errors) {
            const profit = await Profit.find({status: 'Unpaid'});
            const withdrawals = await Withdraw.find({status: 'Processing'});
            const applications = await User.find({'partnerApplication.status': 'Processing'});
            return res.render('admin', {
                profit,
                withdrawals,
                applications,
                errors,
                pageTitle: 'Administration - Deal Your Crypto',
                pageDescription: 'Description',
                pageKeywords: 'Keywords'
            });
        }
        const user = await User.findById(req.body.userid);
        user.partnerApplication.status = 'Declined';
        user.declineReason = req.body.reason;
        user.unreadNotifications += 1;
        await user.save();
        await Notification.create({
            userid: user._id,
            linkTo: `/dashboard/`,
            message: `Your partnership request has been declined`
        });
        if (process.env.NODE_ENV === 'production') {
            userLogger.info(`Message: Partnership declined\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
        }
        if(user.email_notifications.user === true) {
            let lastApp = new Date(user.partnerApplication.sentOn);
            lastApp.setDate(lastApp.getDate() + 90);
            ejs.renderFile(path.join(__dirname, "../views/email_templates/partnerDeclined.ejs"), {
                link: `http://${req.headers.host}/`,
                footerlink: `http://${req.headers.host}/dashboard/notifications`,
                subject: 'Partnership declined - Deal Your Crypto',
                reason: req.body.reason,
                reapplyDate: lastApp
            }, 
            function (err, data) {
                if (err) {
                    errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                } else {
                    const mailOptions = {
                        from: `Deal Your Crypto <noreply@dealyourcrypto.com>`,
                        to: `${user.email}`,
                        subject: 'Partnership declined',
                        html: data,
                    };
                    transporter.sendMail(mailOptions, (error) => {
                        if (error) {
                            errorLogger.error(`Status: ${error.status || 500}\r\nMessage: ${error.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                        }
                    });
                }
            });
        }
        req.flash('success', 'Partnership successfully declined');
        return res.redirect('back');
    },
    async reportDelete(req, res){
        await Report.findByIdAndDelete(req.params.id);
        req.flash('success', 'Report successfully deleted');
        return res.redirect('back');
    },
    async reviewDelete(req, res){
        const review = await Review.findById(req.params.reviewid);
        await Notification.create({
            userid: review.author,
            linkTo: `/products/${review.product}/view`,
            message: `Your review has been found to breach the guidelines and it has been removed`
        });
        await review.deleteOne();
        await Report.deleteMany({review: req.params.reviewid});
        req.flash('success', 'Review deleted successfully');
        return res.redirect('back');
    },
    async productDelete(req, res){
        const deals = await Deal.find({'product._id': req.params.productid});
        if (deals.length > 0) {
            req.flash('error', 'There are existing deals for this product.');
            return res.redirect('back');
        }
        const product = await Product.findById(req.params.productid);
        await Notification.create({
            userid: product.author._id,
            linkTo: `/`,
            imgLink: product.images[0].url,
            message: `${product.name} has been found to breach the guidelines and it has been removed`
        });
        let deleteDate = new Date();
        deleteDate.setDate(deleteDate.getDate() + 30);
        await Product.findByIdAndUpdate(req.params.productid, {$set: {'deleteIn30.status': true, 'deleteIn30.deleteDate': deleteDate, available: 'Deleted'}});
        elasticClient.delete({
            index: 'products',
            type: 'products',
            id: `${req.params.productid}`
          }, (err) => {
            if (err) {
              console.log(err);
            }
        });
        await Report.deleteMany({product: req.params.productid});
        req.flash('success', 'Product deleted successfully');
        return res.redirect('back');
    },
    async dealDelete(req, res){
        const deal = await Deal.findById(req.params.dealid);
        const buyer = await User.findById(deal.buyer.id);
        buyer.btcbalance += deal.price;
        buyer.unreadNotifications += 1;
        await buyer.save();
        await Notification.create({
            userid: deal.buyer.id,
            linkTo: `/`,
            imgLink: deal.product.imageUrl,
            message: `Your deal for ${deal.product.name} has been cancelled and you were refunded ${deal.price} BTC`
        });
        await Notification.create({
            userid: deal.product.author._id,
            linkTo: `/`,
            imgLink: deal.product.imageUrl,
            message: `Your deal for ${deal.product.name} has been found to breach the guidelines and it has been cancelled`
        });
        await Report.deleteMany({deal: req.params.dealid});
        req.flash('success', 'Deal deleted successfully');
        return res.redirect('back');
    }

};
