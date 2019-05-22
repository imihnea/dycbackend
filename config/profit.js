const { errorLogger, logger } = require('./winston');
const Profit = require('../models/profit');
const moment = require('moment');

function createProfit(req, cost, method) {
    Profit.create({
        amount: cost,
        acquired: method,
        userID: req.user._id
    }, err => {
        if (err) {
            console.log(err);
            errorLogger.error(`Status: ${err.status || 500}\r\nMessage: Error - Create Profit\r\n${err.message}\r\nAmount: ${amount}\r\nAcquired: ${method}\r\nIP: ${req.ip}\r\nUserID: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
        } else {
            console.log('profit created');
            if (process.env.NODE_ENV === 'production') {
                logger.info(`Profit created\r\nAmount: ${cost}\r\nAcquired: ${method}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
            }
        }
    });
}

module.exports = {createProfit};
