const express = require('express');

const router = express.Router();

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