const { errorLogger, logger } = require('./winston');
const Profit = require('../models/profit');
const moment = require('moment');

function createProfit(user, cost, method) {
    Profit.create({
        amount: cost,
        acquired: method,
        userID: user
    }, err => {
        if (err) {
            errorLogger.error(`Status: ${err.status || 500}\r\nMessage: Error - Create Profit\r\n${err.message}\r\nAmount: ${amount}\r\nAcquired: ${method}\r\nUserID: ${user}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
        } else {
            if (process.env.NODE_ENV === 'production') {
                logger.info(`Profit created\r\nAmount: ${cost}\r\nAcquired: ${method}\r\nUserId: ${user}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
            }
        }
    });
}

module.exports = {createProfit};
