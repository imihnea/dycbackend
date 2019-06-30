const Chat = require('../models/chat');
const ejs = require('ejs');
const path = require('path');
const User = require('../models/user');
const Product = require('../models/product');
const Deal = require('../models/deal');
const Notification = require('../models/notification');
const { errorLogger } = require('../config/winston');
const nodemailer = require('nodemailer');
const moment = require('moment');
const middleware = require('../middleware/index');

const { asyncErrorHandler } = middleware; // destructuring assignment

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

const escapeHTML = (unsafe) => {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/@/g, "&commat;")
        .replace(/\^/g, "&Hat;")
        .replace(/:/g, "&colon;")
        .replace(/;/g, "&semi;")
        .replace(/#/g, "&num;")
        .replace(/\$/g, "&dollar;")
        .replace(/%/g, "&percent;")
        .replace(/\*/g, "&ast;")
        .replace(/\(/g, "&lpar;")
        .replace(/\)/g, "&rpar;")
        .replace(/_/g, "&UnderBar;")
        .replace(/=/g, "&equals;")
        .replace(/\+/g, "&plus;")
        .replace(/`/g, "&grave;")
        .replace(/\//g, "&sol;")
        .replace(/\\/g, "&bsol;")
        .replace(/\|/g, "&vert;")
        .replace(/\[/g, "&lsqb;")
        .replace(/\]/g, "&rsqb;")
        .replace(/\{/g, "&lcub;")
        .replace(/\}/g, "&rcub;")
        .replace(/'/g, "&#039;");
}

module.exports = {
    // Chats Indexes
    async getChats(req, res) {
        // Show the chat only if the user takes part in it and
        // there have been messages sent already
        const chats = await Chat.paginate({$and:
             [{ $or: [{ "user1.id" : req.user._id }, { "user2.id": req.user._id}] },
                { "messageCount": { $gt: 0 } }] }, {
                    page: req.query.page || 1,
                    limit: 10,
                });
        chats.page = Number(chats.page);
        res.render('messages/messages', { 
            chats, 
            user: req.user,
            pageTitle: 'Messages - Deal Your Crypto',
            pageDescription: 'Your messages on Deal Your Crypto, the first marketplace dedicated to cryptocurrency.',
            pageKeywords: 'message, messages, buy with bitcoin, sell for bitcoin, bitcoin, bitcoin market, crypto, cryptocurrency'
        });
    },
    // Get Messages
    async getMessages(req, res) {
        const chat = await Chat.findById( req.params.id );
        let userid = '';
        if ( chat.user1.id.toString() !== req.user._id.toString() ) {
            userid = chat.user1.id;
        } else {
            userid = chat.user2.id;
        }
        const user2 = await User.findById(userid);
        let buyer;
        if (chat.user1.id.toString() === req.user._id.toString()) {
            buyer = req.user;
        } else {
            buyer = user2;
        }
        const product = await Product.findById(chat.product.id);
        res.render('messages/messages_msg', { 
            chat, 
            user: req.user, 
            user2, 
            buyer, 
            product,
            pageTitle: 'Messages - Deal Your Crypto',
            pageDescription: 'Your message on Deal Your Crypto, the first marketplace dedicated to cryptocurrency.',
            pageKeywords: 'message, messages, buy with bitcoin, sell for bitcoin, bitcoin, bitcoin market, crypto, cryptocurrency'
        });
    },
    // Update "read" field
    async updateMessages(req, res) {
        const chat = await Chat.findById( req.params.id );
        await chat.messages.forEach(asyncErrorHandler(async (message) => {
            let messagesRead = 0;
            if (( message.sender.toString() !== req.user._id.toString()) && (message.read == false) ) {
                message.read = true;
                messagesRead += 1;
            }
            if (messagesRead != 0) {
                await User.findByIdAndUpdate(req.user._id, { $inc: { unreadMessages: -messagesRead } }, (err) => {
                    if (err) {
                        errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                    }
                });
            }
        }));
        await chat.save();
        return res.redirect(`/messages/${ req.params.id }`);
    },
    async updateMessagesDeal(req, res) {
        const chat = await Chat.findById( req.params.id );
        await chat.messages.forEach(asyncErrorHandler(async (message) => {
            let messagesRead = 0;
            if (( message.sender.toString() !== req.user._id.toString()) && (message.read == false) ) {
                message.read = true;
                messagesRead += 1;
            }
            if (messagesRead != 0) {
                await User.findByIdAndUpdate(req.user._id, { $inc: { unreadMessages: -messagesRead } }, (err) => {
                    if (err) {
                        errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                    }
                });
            }
        }));
        await chat.save();
        return res.redirect(`/deals/${ req.params.dealid }`);
    },
    // Create Chat
    async newChat(req, res) {
        // Verify if this chat already exists
        let chat = await Chat.findOne( { "user1.id": req.user._id, "product.id": req.params.id });
        if ( chat ) {
            return res.redirect(`/messages/${chat._id}`);
        } else {
            // Find the product
            const product = await Product.findById( req.params.id );
            // Check if the user is the seller of the product
            if ( product.author.id.toString() === req.user._id.toString() ) {
                req.flash('error', 'You cannot start a chat with yourself.');
                return res.redirect('back');
            } else {
                // Find the seller
                const user2 = await User.findById( product.author.id );
                const newChat = {
                    user1: { 
                        id: req.user._id, 
                        fullname: req.user.full_name,
                        username: req.user.username,
                        avatarUrl: req.user.avatar.url 
                    },
                    user2: { 
                        id: user2.id, 
                        fullname: user2.full_name, 
                        username: user2.username,
                        avatarUrl: user2.avatar.url 
                    },
                    product: { 
                        id: product._id, 
                        name: product.name, 
                        imageUrl: product.images[0].url, 
                        price: product.btcPrice
                    }
                };
                chat = await Chat.create(newChat);
                return res.redirect(`/messages/${chat._id}`);
            }
        }        
    },
    // Create Chat - Ongoing deal with no chat
    async newOngoingChat(req, res) {
        // Verify if this chat already exists
        let chat = await Chat.find({ "user1.id": req.user._id, "product.id": req.params.id });
        if ( chat._id ) {
            // Link the chat to the deal
            let deal = await Deal.findById(req.params.dealid);
            deal.chat = chat._id;
            chat.deal = req.params.dealid;
            await deal.save();
            await chat.save();
            req.flash('success', 'You have successfully sent a purchase request.');
            return res.redirect(`/deals/${deal._id}`);
        } else {
            // Find the product
            const product = await Product.findById( req.params.id );
            // Find the seller
            const user2 = await User.findById( product.author.id );
            const newChat = {
                user1: { 
                    id: req.user._id, 
                    fullname: req.user.full_name,
                    username: req.user.username,
                    avatarUrl: req.user.avatar.url 
                },
                user2: { 
                    id: user2.id, 
                    fullname: user2.full_name,
                    username: user2.username,
                    avatarUrl: user2.avatar.url 
                },
                product: { 
                    id: product._id, 
                    name: product.name, 
                    imageUrl: product.images[0].url, 
                    price: product.price,
                },
                    deal: req.params.dealid 
                };
            chat = await Chat.create(newChat);
            // Link the chat to the deal
            let deal = await Deal.findById(req.params.dealid);
            deal.chat = chat._id;
            await deal.save();
            req.flash('success', 'You have successfully sent a purchase request.');
            return res.redirect(`/deals/${deal._id}`);
        }
    },
    // Create Message
    async newMessage(req, res) {
        req.check('message', 'The message contains illegal characters.').matches(/^[a-zA-Z0-9 `!@#$%^&*()_\-=+,<>./"?;:'\][{}\\|\r\n]+$/g).notEmpty();
        req.check('message', 'The message must contain at most 500 characters').isLength({ max: 500 });
        const errors = req.validationErrors();
        if (errors) {
            req.flash('The message contains illegal characters.');
            return res.redirect('back');
        }
        // Find the chat
        const chat = await Chat.findById( req.params.id );
        // Create the new message
        const message = escapeHTML(req.body.message);
        const newMessage = {
            sender: req.user._id,
            message,
        }
        // Insert the message
        chat.messages.push(newMessage);
        chat.messageCount += 1;
        await chat.save();
        if (chat.user1.id.toString() != req.user._id) {
            await User.findByIdAndUpdate(chat.user1.id, { $inc: { unreadMessages: 1, unreadNotifications: 1 } }, (err) => {
                if (err) {
                    errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                }
            });
            await Notification.create({
                userid: chat.user1.id,
                linkTo: `/messages/${chat._id}`,
                imgLink: chat.product.imageUrl,
                message: `You have received a message from ${chat.user2.username}`
            });
        } else if (chat.user2.id.toString() != req.user._id) {
            await User.findByIdAndUpdate(chat.user2.id, { $inc: { unreadMessages: 1, unreadNotifications: 1 } }, (err) => {
                if (err) {
                    errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                }
            });
            await Notification.create({
                userid: chat.user2.id,
                linkTo: `/messages/${chat._id}`,
                imgLink: chat.product.imageUrl,
                message: `You have received a message from ${chat.user1.username}`
            });
        }
        // Send an email if it was the first message of the conversation    
        if (chat.messageCount == 1) {      
            const user2 = await User.findById(chat.user2.id);
            if(user2.email_notifications.message === true) {
                ejs.renderFile(path.join(__dirname, "../views/email_templates/newMessage.ejs"), {
                    link: `http://${req.headers.host}/messages/${chat._id}`,
                    footerlink: `http://${req.headers.host}/dashboard/notifications`,
                    buyer: req.user.full_name,
                    name: chat.product.name,
                    subject: `New conversation for ${chat.product.name} - Deal Your Crypto`,
                }, function (err, data) {
                    if (err) {
                        errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                    } else {
                    const mailOptions = {
                        from: `Deal Your Crypto <noreply@dealyourcrypto.com>`, // sender address
                        to: `${user2.email}`, // list of receivers
                        subject: 'New Conversation Started', // Subject line
                        html: data, // html body
                    };
                    // send mail with defined transport object
                    transporter.sendMail(mailOptions, (error) => {
                        if (error) {
                            errorLogger.error(`Status: ${error.status || 500}\r\nMessage: ${error.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                        }
                    });
                } 
                });
            }
        }
        return res.redirect(`/messages/${chat._id}`);
    },
    async newMessageDeal(req, res) {
        req.check('message', 'The message contains illegal characters.').matches(/^[a-zA-Z0-9 `!@#$%^&*()_\-=+,<>./?;:"'\][{}\\|\r\n]+$/g).notEmpty();
        req.check('message', 'The message must contain at most 500 characters').isLength({ max: 500 });
        const errors = req.validationErrors();
        if (errors) {
            const deal = await Deal.findById(req.params.dealid);
            const seller = await User.findById(deal.product.author.id);
            const buyer = await User.findById(deal.buyer.id);
            const chat = await Chat.findById(deal.chat);
            return res.render('deals/deal', { 
                deal, 
                seller, 
                buyer, 
                user: req.user, 
                chat, 
                errors,
                pageTitle: `${deal.product.name} Message - Deal Your Crypto`,
                pageDescription: `Message for ${product.name} on Deal Your Crypto, the first marketplace dedicated to cryptocurrency.`,
                pageKeywords: `buy with bitcoin, ${product.name}, best deal, bitcoin, bitcoin market, crypto, cryptocurrency`,
            });
        }
        // Find the chat
        const chat = await Chat.findById( req.params.id );
        // Create the new message
        const message = escapeHTML(req.body.message);
        const newMessage = {
            sender: req.user._id,
            message
        }
        // Insert the message
        chat.messages.push(newMessage);
        chat.messageCount += 1;
        await chat.save();
        if (chat.user1.id.toString() != req.user._id) {
            await User.findByIdAndUpdate(chat.user1.id, { $inc: { unreadMessages: 1, unreadNotifications: 1 } }, (err) => {
                if (err) {
                    errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                }
            });
            await Notification.create({
                userid: chat.user1.id,
                linkTo: `/deals/${chat.deal}`,
                imgLink: chat.product.imageUrl,
                message: `You have received a message`
            });
        } else if (chat.user2.id.toString() != req.user._id) {
            await User.findByIdAndUpdate(chat.user2.id, { $inc: { unreadMessages: 1, unreadNotifications: 1 } }, (err) => {
                if (err) {
                    errorLogger.error(`Status: ${err.status || 500}\r\nMessage: ${err.message}\r\nURL: ${req.originalUrl}\r\nMethod: ${req.method}\r\nIP: ${req.ip}\r\nUserId: ${req.user._id}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                }
            });
            await Notification.create({
                userid: chat.user2.id,
                linkTo: `/deals/${chat.deal}`,
                imgLink: chat.product.imageUrl,
                message: `You have received a message`
            });
        }
        return res.redirect(`/deals/${req.params.dealid}`);
    },
    async destroyChat(req, res) {
        const chat = await Chat.findById(req.params.id);
        if (chat.deal) {
            const deal = await Deal.findById(chat.deal);
            if (!['Completed', 'Refunded', 'Declined', 'Cancelled', 'Refund denied'].includes(deal.status)) {
                req.flash('error', 'You cannot delete the chat while a deal is ongoing');
                return res.redirect('/messages');
            } else {
                await chat.remove();
                req.flash('success', 'Chat deleted successfully');
                return res.redirect('/messages');
            }
        } else {
            await chat.remove();
            req.flash('success', 'Chat deleted successfully');
            return res.redirect('/messages');
        }
    }    
};
