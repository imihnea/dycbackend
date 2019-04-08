const express = require('express');

const router = express.Router();

const Chat = require('../models/chat');
const User = require('../models/user');
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

// Time interval between unread message mails
const mailInterval = 4 * 60 * 60 * 1000; // 4 hours

const { getChats, getMessages, newMessage, newChat, updateMessages, newOngoingChat, newMessageDeal, updateMessagesDeal } = require('../controllers/messages');

const middleware = require('../middleware/index');

const { isLoggedIn, asyncErrorHandler, hasCompleteProfile, checkIfBelongsChat } = middleware; // destructuring assignment

// show all chats
router.get('/', isLoggedIn, asyncErrorHandler(getChats));

// show messages
router.get('/:id', isLoggedIn, asyncErrorHandler(checkIfBelongsChat), asyncErrorHandler(getMessages));

// update read field
router.put('/:id', isLoggedIn, asyncErrorHandler(checkIfBelongsChat), asyncErrorHandler(updateMessages));

// send message
router.put('/:id/sendMessage', isLoggedIn, asyncErrorHandler(checkIfBelongsChat), asyncErrorHandler(newMessage));

// update read field and go to deal
router.put('/:id/:dealid', isLoggedIn, asyncErrorHandler(checkIfBelongsChat), asyncErrorHandler(updateMessagesDeal));

// create chat
router.post('/:id/createChat', isLoggedIn, hasCompleteProfile, asyncErrorHandler(newChat));

// create ongoing deal chat
router.put('/:id/:dealid/createOngoing', isLoggedIn, asyncErrorHandler(newOngoingChat));

// send message from deal
router.put('/:dealid/:id/sendMessageDeal', isLoggedIn, asyncErrorHandler(checkIfBelongsChat), asyncErrorHandler(newMessageDeal));

setInterval(async () => {
    // get chats with messages
    let chat = await Chat.find({"messageCount": { $gt: 0 }});
        chat.forEach(async (item) => {
            // get last message and verify if it was read
            const lastMsg = item.messages[item.messages.length - 1];
            if (!lastMsg.read) {
                if (lastMsg.sender.toString() == item.user1.id.toString()) {
                    // send email to user2
                    const user2 = await User.findById(item.user2.id);

                    const output = `
                    <h1>You have an unread message</h1>
                    <p>Sender: ${item.user1.fullname}</p>
                    <p>Product: ${item.product.name}</p>
                    <p>Click <a href="localhost:8080/messages/${item._id}">here</a> to see the conversation.</p>
                    `;
                        const mailOptions = {
                            from: `Deal Your Crypto <noreply@dyc.com>`, // sender address
                            to: `${user2.full_name} <${user2.email}>`, // list of receivers
                            subject: 'You have an unread message', // Subject line
                            html: output, // html body
                        };
                        // send mail with defined transport object
                        transporter.sendMail(mailOptions, (error) => {
                            if (error) {
                                console.log(error);
                            } else {
                                console.log('Mail sent');
                            }
                        });

                } else {
                    // send email to user1
                    const user1 = await User.findById(item.user1.id);

                    const output = `
                    <h1>You have an unread message</h1>
                    <p>Sender: ${item.user2.fullname}</p>
                    <p>Product: ${item.product.name}</p>
                    <p>Click <a href="localhost:8080/messages/${item._id}">here</a> to see the conversation.</p>
                    `;
                        const mailOptions = {
                            from: `Deal Your Crypto <noreply@dyc.com>`, // sender address
                            to: `${user1.full_name} <${user1.email}>`, // list of receivers
                            subject: 'You have an unread message', // Subject line
                            html: output, // html body
                        };
                        // send mail with defined transport object
                        transporter.sendMail(mailOptions, (error) => {
                            if (error) {
                                console.log(error);
                            } else {
                                console.log('Mail sent');
                            }
                        });
                        
                }
            }
        });
  }, mailInterval);

module.exports = router;