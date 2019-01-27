const express = require('express');

const router = express.Router();

const { getChats, getMessages, newMessage, newChat, updateMessages, newOngoingChat, newMessageDeal, updateMessagesDeal } = require('../controllers/messages');

const middleware = require('../middleware/index');

const { isLoggedIn, asyncErrorHandler } = middleware; // destructuring assignment

// show all chats
router.get('/', isLoggedIn, asyncErrorHandler(getChats));

// show messages
router.get('/:id', isLoggedIn, asyncErrorHandler(getMessages));

// update read field
router.put('/:id', isLoggedIn, asyncErrorHandler(updateMessages));

// update read field and go to deal
router.put('/:id/:dealid', isLoggedIn, asyncErrorHandler(updateMessagesDeal));

// send message
router.put('/:id/sendMessage', isLoggedIn, asyncErrorHandler(newMessage));

// create chat
router.post('/:id/createChat', isLoggedIn, asyncErrorHandler(newChat));

// create ongoing deal chat
router.put('/:id/:dealid/createOngoing', isLoggedIn, asyncErrorHandler(newOngoingChat));

// send message from deal
router.put('/:dealid/:chatid/sendMessage', isLoggedIn, asyncErrorHandler(newMessageDeal));

module.exports = router;