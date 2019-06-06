const Notification = require('../models/notification');
const mongoose = require('mongoose');
const moment = require('moment');
const { logger } = require('./winston');

// Connect child to DB
mongoose.Promise = global.Promise;
const DATABASEURL = process.env.DATABASEURL || 'mongodb://localhost/DYC';
mongoose.set('useFindAndModify', false); // disables warnings
mongoose.set('useCreateIndex', true); // disables warnings
mongoose.connect(DATABASEURL, { useNewUrlParser: true });

logger.info(`Message: Notifications process started\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);

process.on('message', userid => {
    Notification.find({'userid': userid}, (err, notif) => {
        if (err) {
            console.log(err);
        } else {
            notif.forEach( notification => {
                notification.read = true;
                notification.save(err => {
                    if (err) {
                        console.log(err);
                    }
                });
            });
        }
    });
});