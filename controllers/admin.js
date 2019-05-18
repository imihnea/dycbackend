const Profit = require('../models/profit');
const Withdraw = require('../models/withdrawRequests');
const User = require('../models/user');

const Client = require('coinbase').Client;

const client = new Client({
  'apiKey': process.env.COINBASE_API_KEY,
  'apiSecret': process.env.COINBASE_API_SECRET,
});


module.exports = {
    async getAdmin (req, res) {
        const profit = await Profit.find({status: 'Unpaid'});
        const withdrawals = await Withdraw.find({status: 'Processing'});
        res.render('admin', {
          profit,
          withdrawals,
          pageTitle: 'Administration - Deal Your Crypto',
          pageDescription: 'Description',
          pageKeywords: 'Keywords'
        });
    },
    async withdrawAccept (req, res) {
        const withdraw = await Withdraw.findById(req.params.id);
        client.getAccount('primary', function(err, account) {
            if(err) {
                errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                req.flash('error', 'There was a problem with your request, please try again.');
                res.redirect('back');
            } else {
                account.sendMoney({
                        'to': withdraw.address,
                        'amount': withdraw.amount,
                        'currency': 'BTC'
                }, 
                function(err, tx) {
                    if(err) {
                        errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message} - Cannot withdraw\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                        req.flash('error', 'There was an error withdrawing, please contact us immediately about this.');
                        res.redirect('back');
                    } else {
                        console.log(tx);
                        withdraw.status = 'Completed';
                        withdraw.save(err => {
                            if (err) {
                                errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message} - Couldn't save withdraw 'Completed' status\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${withdraw.userID}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
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
                                        from: `Deal Your Crypto <noreply@dyc.com>`,
                                        to: `${withdraw.userEmail}`,
                                        subject: 'Currency withdrawn successfully',
                                        html: data,
                                    };
                                    transporter.sendMail(mailOptions, (error) => {
                                        if (error) {
                                            console.log(error);
                                            errorLogger.error(`Status: ${error.status || 500}\r\nMessage: ${error.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${withdraw.userID}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                        }
                                        if (process.env.NODE_ENV === 'production') {
                                            userLogger.info(`Message: Withdraw successful\r\nWithdrawID: ${withdraw._id}\r\nAmount: ${withdraw.amount}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${withdraw.userID}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                        }
                                        req.flash('success', `Successfully withdrawn ${amount} BTC!`);
                                        res.redirect('back');
                                        console.log(`Withdrawn ${amount} BTC successfully.`);
                                    });
                                }
                            });
                        } else {
                            req.flash('success', `Successfully withdrawn ${amount} BTC!`);
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
                        from: `Deal Your Crypto <noreply@dyc.com>`,
                        to: `${withdraw.userEmail}`,
                        subject: 'Currency withdrawn successfully',
                        html: data,
                    };
                    transporter.sendMail(mailOptions, (error) => {
                        if (error) {
                            console.log(error);
                            errorLogger.error(`Status: ${error.status || 500}\r\nMessage: ${error.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${withdraw.userID}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                        }
                        if (process.env.NODE_ENV === 'production') {
                            userLogger.info(`Message: Withdraw successful\r\nWithdrawID: ${withdraw._id}\r\nAmount: ${withdraw.amount}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${withdraw.userID}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                        }
                        req.flash('success', `Successfully withdrawn ${amount} BTC!`);
                        res.redirect('back');
                        console.log(`Withdrawn ${amount} BTC successfully.`);
                    });
                }
            });
        } else {
            req.flash('success', `Successfully withdrawn ${amount} BTC!`);
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
                            errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message} - Cannot withdraw\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                            req.flash('error', 'There was an error withdrawing, please contact us immediately about this.');
                            res.redirect('back');
                        } else {
                            console.log(tx);
                            withdraw.status = 'Completed';
                            withdraw.save(err => {
                                if (err) {
                                    errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message} - Couldn't save withdraw 'Completed' status\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${withdraw.userID}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
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
                                            from: `Deal Your Crypto <noreply@dyc.com>`,
                                            to: `${withdraw.userEmail}`,
                                            subject: 'Currency withdrawn successfully',
                                            html: data,
                                        };
                                        transporter.sendMail(mailOptions, (error) => {
                                            if (error) {
                                                console.log(error);
                                                errorLogger.error(`Status: ${error.status || 500}\r\nMessage: ${error.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${withdraw.userID}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
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
        res.redirect('back');
    },
    async withdrawDenyAll (req, res) {
        let ids = req.body.withdrawIDs.split(" ");
        ids.pop();
        let withdraws = await Withdraw.find({_id: {$in: ids}});
        withdraws.forEach(async withdraw => {
            withdraw.status = 'Denied';
            await withdraw.save();
            await User.findByIdAndUpdate(withdraw.userID, {$inc: {btcbalance: withdraw.amount}});
        });
        req.flash('success', 'Successfully denied all withdraw requests');
        res.redirect('back');
    },
    async deleteProfit (req, res) {
        await Profit.findByIdAndUpdate(req.params.id, {$set: {status: 'Paid'}});
        req.flash('success', 'Successfully resetted profit');
        res.redirect('back');
    },
    async deleteAllProfits (req, res) {
        let ids = req.body.profitIDs.split(" ");
        ids.pop();
        let profits = await Profit.find({_id: {$in: ids}});
        profits.forEach(async profit => {
            profit.status = 'Paid';
            await profit.save();
        });
        req.flash('success', 'Successfully resetted unpaid profits');
        res.redirect('back');
    }
};
