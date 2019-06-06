const mongoose = require('mongoose');
const Notification = require('../models/notification');
const Deal = require('../models/deal');
const User = require('../models/user');
const Product = require('../models/product');
const Chat = require('../models/chat');
const Review = require('../models/review');
const { errorLogger, userLogger, productLogger, chatLogger, reviewLogger, logger, dealLogger } = require('./winston');
const moment = require('moment');

// Connect child to DB
mongoose.Promise = global.Promise;
const DATABASEURL = process.env.DATABASEURL || 'mongodb://localhost/DYC';
mongoose.set('useFindAndModify', false); // disables warnings
mongoose.set('useCreateIndex', true); // disables warnings
mongoose.connect(DATABASEURL, { useNewUrlParser: true });

logger.info(`Message: Account deletion process started\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);

process.on('message', user => {
    Product.deleteMany({'author.id': user}, (err) => {
        if (err) {
          errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: /config/deleteAcc.js\r\nMethod: Product delete error\r\nUserId: ${user}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
        } else {
          productLogger.info(`Message: User's products have been deleted\r\nURL: /config/deleteAcc.js\r\nMethod: Product delete\r\nUserId: ${user}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
        }
    });
    Deal.deleteMany({$or: [{'product.author.id': user}, {'buyer.id': user}]}, (err) => {
        if (err) {
            errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: /config/deleteAcc.js\r\nMethod: Deal delete error\r\nUserId: ${user}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
        } else {
            dealLogger.info(`Message: User's deals have been deleted\r\nURL: /config/deleteAcc.js\r\nMethod: Deal delete\r\nUserId: ${user}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
        }
    });
    Chat.deleteMany({$or: [{'user1.id': user}, {'user2.id': user}]}, (err) => {
        if (err) {
            errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: /config/deleteAcc.js\r\nMethod: Chat delete error\r\nUserId: ${user}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
        }
    });
    Notification.deleteMany({'userid': user}, (err) => {
        if (err) {
            errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: /config/deleteAcc.js\r\nMethod: Notification delete error\r\nUserId: ${user}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
        } else {
            logger.info(`Message: User's notifications have been deleted\r\nURL: /config/deleteAcc.js\r\nMethod: Notification delete\r\nUserId: ${user}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
        }
    });
    Review.deleteMany({$or: [{user: user}, {author: user}]}, (err) => {
        if (err) {
            errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: /config/deleteAcc.js\r\nMethod: Review delete error\r\nUserId: ${user}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
        } else {
            reviewLogger.info(`Message: User's reviews have been deleted\r\nURL: /config/deleteAcc.js\r\nMethod: Review delete\r\nUserId: ${user}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
        }
    });
    User.findByIdAndDelete(user, (err) => {
        if (err) {
            errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: /config/deleteAcc.js\r\nMethod: User delete error\r\nUserId: ${user}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
        } else {
            userLogger.info(`Message: User deleted account\r\nURL: /config/deleteAcc.js\r\nMethod: User delete\r\nUserId: ${user}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
        }
    });
});