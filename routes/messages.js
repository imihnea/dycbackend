const express = require('express');

const router = express.Router();

const { getChats, getMessages, newMessage, newChat, updateMessages, newOngoingChat } = require('../controllers/messages');

const middleware = require('../middleware/index');

const { isLoggedIn, asyncErrorHandler } = middleware; // destructuring assignment

// show all chats
router.get('/', isLoggedIn, asyncErrorHandler(getChats));

// show messages
router.get('/:id', isLoggedIn, asyncErrorHandler(getMessages));

// update read field
router.put('/:id', isLoggedIn, asyncErrorHandler(updateMessages));

// send message
router.put('/:id/sendMessage', isLoggedIn, asyncErrorHandler(newMessage));

// create chat
router.post('/:id/createChat', isLoggedIn, asyncErrorHandler(newChat));

// create ongoing deal chat
router.put('/:id/:dealid/createOngoing', isLoggedIn, asyncErrorHandler(newOngoingChat));

module.exports = router;