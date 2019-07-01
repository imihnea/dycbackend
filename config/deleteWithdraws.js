const Withdraw = require('../models/withdrawRequests');
const moment = require('moment');
const mongoose = require('mongoose');
const { logger, errorLogger } = require('./winston');

mongoose.Promise = global.Promise;
const DATABASEURL = process.env.DATABASEURL || 'mongodb://localhost/DYC';
mongoose.set('useFindAndModify', false); // disables warnings
mongoose.set('useCreateIndex', true); // disables warnings
mongoose.connect(DATABASEURL, { useNewUrlParser: true });

let hourAgo = new Date();
hourAgo.setDate(hourAgo.getTime() - 1000 * 60 * 30);

logger.info(`Message: Delete unverified withdrawals process started\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);

// Runs every 30 mins
setInterval( () => {
    // Delete unverified withdrawals created 1 hour ago
    Withdraw.deleteMany({verified: false, withdrawDate: {$lt: new Date().getTime()-(1*60*60*1000)}}, (err, res) => {
        if (err) {
            errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message} - Withdraw - Couldn't delete unverified withdrawals\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
        } else {
            if (res.n > 0) {
                logger.info(`Message: ${res.n} unverified withdrawals deleted\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}`);
            }
        }
    });
}, 30 * 60 * 1000);