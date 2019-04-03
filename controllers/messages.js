const Chat = require('../models/chat');
const ejs = require('ejs');
const path = require('path');
const User = require('../models/user');
const Product = require('../models/product');
const Deal = require('../models/deal');
const nodemailer = require('nodemailer');

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
            pageDescription: 'Description',
            pageKeywords: 'Keywords'
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
            pageDescription: 'Description',
            pageKeywords: 'Keywords'
        });
    },
    // Update "read" field
    async updateMessages(req, res) {
        const chat = await Chat.findById( req.params.id );
        await chat.messages.forEach(async (message) => {
            let messagesRead = 0;
            if (( message.sender.toString() !== req.user._id.toString()) && (message.read == false) ) {
                message.read = true;
                messagesRead += 1;
            }
            if (messagesRead != 0) {
                await User.findByIdAndUpdate(req.user._id, { $inc: { unreadMessages: -messagesRead } }, (err) => {
                    if (err) {
                        console.log(err);
                    }
                });
            }
        });
        await chat.save();
        res.redirect(`/messages/${ req.params.id }`);
    },
    async updateMessagesDeal(req, res) {
        const chat = await Chat.findById( req.params.id );
        await chat.messages.forEach(async (message) => {
            let messagesRead = 0;
            if (( message.sender.toString() !== req.user._id.toString()) && (message.read == false) ) {
                message.read = true;
                messagesRead += 1;
            }
            if (messagesRead != 0) {
                await User.findByIdAndUpdate(req.user._id, { $inc: { unreadMessages: -messagesRead } }, (err) => {
                    if (err) {
                        console.log(err);
                    }
                });
            }
        });
        await chat.save();
        res.redirect(`/deals/${ req.params.dealid }`);
    },
    // Create Chat
    async newChat(req, res) {
        // Verify if this chat already exists
        let chat = await Chat.findOne( { "user1.id": req.user._id, "product.id": req.params.id });
        if ( chat ) {
            res.redirect(`/messages/${chat._id}`);
        } else {
            // Find the product
            const product = await Product.findById( req.params.id );
            // Check if the user is the seller of the product
            if ( product.author.id.toString() === req.user._id.toString() ) {
                req.flash('error', 'You cannot start a chat with yourself.');
                res.redirect('back');
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
                        price: product.price
                    }
                };
                chat = await Chat.create(newChat);
                
                res.redirect(`/messages/${chat._id}`);
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
            res.redirect(`/deals/${deal._id}`);
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
            res.redirect(`/deals/${deal._id}`);
        };
    },
    // Create Message
    async newMessage(req, res) {
        req.check('message', 'The message contains illegal characters.').matches(/^[a-zA-Z0-9 .,!?\r\n|\r|\n]+$/g).notEmpty();
        const errors = req.validationErrors();
        if (errors) {
            req.flash('The message contains illegal characters.');
            return res.redirect('back');
        }
        // Find the chat
        const chat = await Chat.findById( req.params.id );
        // Create the new message
        const newMessage = {
            sender: req.user._id,
            message: req.body.message,
        }
        // Insert the message
        chat.messages.push(newMessage);
        chat.messageCount += 1;
        await chat.save();
        if (chat.user1.id.toString() != req.user._id) {
            await User.findByIdAndUpdate(chat.user1.id, { $inc: { unreadMessages: 1 } }, (err) => {
                if (err) {
                    console.log(err);
                }
            });
        } else if (chat.user2.id.toString() != req.user._id) {
            await User.findByIdAndUpdate(chat.user2.id, { $inc: { unreadMessages: 1 } }, (err) => {
                if (err) {
                    console.log(err);
                }
            });
        }
        // Send an email if it was the first message of the conversation    
        if (chat.messageCount == 1) {      
            const user2 = await User.findById(chat.user2.id);
            ejs.renderFile(path.join(__dirname, "../views/email_templates/newMessage.ejs"), {
                link: `http://${req.headers.host}/messages/${chat._id}`,
                buyer: req.user.full_name,
                name: chat.product.name,
                subject: `New conversation for ${chat.product.name} - Deal Your Crypto`,
              }, function (err, data) {
                if (err) {
                    console.log(err);
                } else {
                const mailOptions = {
                    from: `Deal Your Crypto <noreply@dyc.com>`, // sender address
                    to: `${user2.email}`, // list of receivers
                    subject: 'New Conversation Started', // Subject line
                    html: data, // html body
                };
                // send mail with defined transport object
                transporter.sendMail(mailOptions, (error) => {
                    if (error) {
                    console.log(error);
                    }
                });
            }});  
        }
        res.redirect(`/messages/${chat._id}`);
    },
    async newMessageDeal(req, res) {
        req.check('message', 'The message contains illegal characters.').matches(/^[a-zA-Z0-9 .,!?\r\n|\r|\n]+$/g).notEmpty();
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
                pageDescription: 'Description',
                pageKeywords: 'Keywords'
            });
        }
        // Find the chat
        const chat = await Chat.findById( req.params.id );
        // Create the new message
        const newMessage = {
            sender: req.user._id,
            message: req.body.message,
        }
        // Insert the message
        chat.messages.push(newMessage);
        chat.messageCount += 1;
        await chat.save();
        if (chat.user1.id.toString() != req.user._id) {
            await User.findByIdAndUpdate(chat.user1.id, { $inc: { unreadMessages: 1 } }, (err) => {
                if (err) {
                    console.log(err);
                }
            });
        } else if (chat.user2.id.toString() != req.user._id) {
            await User.findByIdAndUpdate(chat.user2.id, { $inc: { unreadMessages: 1 } }, (err) => {
                if (err) {
                    console.log(err);
                }
            });
        }
        res.redirect(`/deals/${req.params.dealid}`);
    },    
};
