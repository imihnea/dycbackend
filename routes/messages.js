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

module.exports = router;
